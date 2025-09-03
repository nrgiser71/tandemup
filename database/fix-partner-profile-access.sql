-- Fix RLS policy to allow users to view partner profiles in their sessions

-- Add policy to allow users to view profiles of their session partners
CREATE POLICY "Users can view session partner profiles" ON profiles
  FOR SELECT USING (
    -- Allow viewing own profile
    auth.uid() = id 
    OR
    -- Allow viewing profiles of users in the same session
    id IN (
      SELECT user1_id FROM sessions 
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
        AND (user1_id = profiles.id OR user2_id = profiles.id)
        AND user1_id IS NOT NULL AND user2_id IS NOT NULL
    )
    OR
    id IN (
      SELECT user2_id FROM sessions 
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
        AND (user1_id = profiles.id OR user2_id = profiles.id)
        AND user1_id IS NOT NULL AND user2_id IS NOT NULL
    )
  );

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;