-- Fix RLS policy to allow users to join waiting sessions

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;

-- Create new policy that allows users to:
-- 1. Update sessions where they are already user1 or user2
-- 2. Join waiting sessions (where user2_id is NULL and status is 'waiting')
CREATE POLICY "Users can update their own sessions or join waiting sessions" ON sessions
  FOR UPDATE USING (
    auth.uid() = user1_id 
    OR auth.uid() = user2_id 
    OR (status = 'waiting' AND user2_id IS NULL AND auth.uid() != user1_id)
  );

-- Also add a more explicit policy for joining waiting sessions
CREATE POLICY "Users can join waiting sessions" ON sessions
  FOR UPDATE 
  USING (status = 'waiting' AND user2_id IS NULL AND auth.uid() != user1_id)
  WITH CHECK (status = 'matched' AND auth.uid() = user2_id);