-- TandemUp Migration: Single Language to Multiple Languages
-- This migration safely converts the profiles.language column from TEXT to TEXT[] 
-- while preserving existing data and adding support for 5 languages: en, nl, fr, es, de

-- Migration execution should be done in a transaction for safety
BEGIN;

-- Step 1: Add the new languages column as TEXT[] with proper constraints
ALTER TABLE profiles 
ADD COLUMN languages TEXT[] 
CHECK (
  array_length(languages, 1) >= 1 AND 
  languages <@ ARRAY['en', 'nl', 'fr', 'es', 'de']
);

-- Step 2: Migrate existing data from language to languages
-- Convert each single language value to a single-element array
UPDATE profiles 
SET languages = ARRAY[language]::TEXT[]
WHERE language IS NOT NULL;

-- Step 3: Make the new languages column NOT NULL after data migration
ALTER TABLE profiles 
ALTER COLUMN languages SET NOT NULL;

-- Step 4: Drop the old language column and its constraint
ALTER TABLE profiles 
DROP CONSTRAINT profiles_language_check;

ALTER TABLE profiles 
DROP COLUMN language;

-- Step 5: Update the handle_new_user function to work with language arrays
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_language TEXT;
  user_languages TEXT[];
BEGIN
  -- Extract language from metadata, default to 'en'
  user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'en');
  
  -- Validate the language is supported, fallback to 'en' if not
  IF user_language NOT IN ('en', 'nl', 'fr', 'es', 'de') THEN
    user_language := 'en';
  END IF;
  
  -- Convert to array format
  user_languages := ARRAY[user_language];
  
  -- Insert new profile with languages array
  INSERT INTO public.profiles (
    id, 
    first_name, 
    languages, 
    timezone,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    user_languages,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add index for better performance on language queries
CREATE INDEX idx_profiles_languages ON profiles USING GIN (languages);

-- Step 7: Create helper function to check if user speaks a language
CREATE OR REPLACE FUNCTION user_speaks_language(user_id UUID, lang TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND lang = ANY(languages)
  );
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create helper function to get common languages between users
CREATE OR REPLACE FUNCTION get_common_languages(user1_id UUID, user2_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  user1_langs TEXT[];
  user2_langs TEXT[];
  common_langs TEXT[];
BEGIN
  SELECT languages INTO user1_langs FROM profiles WHERE id = user1_id;
  SELECT languages INTO user2_langs FROM profiles WHERE id = user2_id;
  
  -- Find intersection of both arrays
  SELECT ARRAY(
    SELECT UNNEST(user1_langs)
    INTERSECT
    SELECT UNNEST(user2_langs)
  ) INTO common_langs;
  
  RETURN common_langs;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update the matching function to consider language compatibility
-- This enhances the existing match_session_users function to prefer users with common languages
CREATE OR REPLACE FUNCTION match_session_users()
RETURNS TRIGGER AS $$
DECLARE
  waiting_session_id UUID;
  common_lang_session_id UUID;
BEGIN
  -- Only try to match if this is a new waiting session
  IF NEW.status = 'waiting' AND NEW.user2_id IS NULL THEN
    -- First, try to find a session with users who share at least one language
    SELECT s.id INTO common_lang_session_id
    FROM sessions s
    JOIN profiles p ON s.user1_id = p.id
    JOIN profiles current_user ON current_user.id = NEW.user1_id
    WHERE s.status = 'waiting'
      AND s.user2_id IS NULL
      AND s.user1_id != NEW.user1_id
      AND s.start_time = NEW.start_time
      AND s.duration = NEW.duration
      AND s.id != NEW.id
      AND p.languages && current_user.languages  -- Arrays have common elements
    ORDER BY s.created_at ASC
    LIMIT 1;
    
    -- If we found a language-compatible match, use it
    IF common_lang_session_id IS NOT NULL THEN
      waiting_session_id := common_lang_session_id;
    ELSE
      -- Otherwise, fall back to any available session
      SELECT id INTO waiting_session_id
      FROM sessions
      WHERE status = 'waiting'
        AND user2_id IS NULL
        AND user1_id != NEW.user1_id
        AND start_time = NEW.start_time
        AND duration = NEW.duration
        AND id != NEW.id
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
    
    -- If we found any match, update both sessions
    IF waiting_session_id IS NOT NULL THEN
      -- Update the existing waiting session
      UPDATE sessions
      SET user2_id = NEW.user1_id, status = 'matched', updated_at = NOW()
      WHERE id = waiting_session_id;
      
      -- Delete the new session since we matched with existing one
      DELETE FROM sessions WHERE id = NEW.id;
      
      -- Return NULL to prevent the insert
      RETURN NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create a view for easy querying of user language preferences
CREATE OR REPLACE VIEW user_language_preferences AS
SELECT 
  p.id,
  p.first_name,
  p.email,
  p.languages,
  unnest(p.languages) as individual_language,
  array_length(p.languages, 1) as language_count
FROM profiles p;

-- Verification queries (commented out - uncomment to run checks)
/*
-- Verify migration completed successfully
SELECT 
  'Migration Check' as check_type,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN languages IS NOT NULL THEN 1 END) as profiles_with_languages,
  COUNT(CASE WHEN array_length(languages, 1) >= 1 THEN 1 END) as profiles_with_valid_languages
FROM profiles;

-- Check language distribution
SELECT 
  unnest(languages) as language,
  COUNT(*) as user_count
FROM profiles
GROUP BY unnest(languages)
ORDER BY user_count DESC;

-- Test helper functions
SELECT user_speaks_language((SELECT id FROM profiles LIMIT 1), 'en') as speaks_english;
SELECT get_common_languages(
  (SELECT id FROM profiles LIMIT 1 OFFSET 0),
  (SELECT id FROM profiles LIMIT 1 OFFSET 1)
) as common_languages;
*/

COMMIT;

-- Post-migration notes:
-- 1. All existing single language values have been converted to single-element arrays
-- 2. New constraint allows arrays with 1+ elements from the 5 supported languages
-- 3. Enhanced matching algorithm prefers users with common languages
-- 4. Helper functions added for language-based queries
-- 5. GIN index added for efficient array operations
-- 6. View created for easy language preference analysis
-- 
-- Application code changes needed:
-- 1. Update frontend to handle arrays instead of single values
-- 2. Update API endpoints to accept/return language arrays
-- 3. Update user settings UI to allow multiple language selection
-- 4. Update session matching logic to leverage common language preferences