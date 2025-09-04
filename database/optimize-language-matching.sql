-- TandemUp: Language Matching Performance Optimization
-- This file contains additional indexes and optimizations for the language array matching
-- Run this after the main migration to ensure optimal performance

-- Additional composite indexes for the matching query
CREATE INDEX IF NOT EXISTS idx_sessions_waiting_language_compatible 
ON sessions (start_time, duration, status) 
WHERE status = 'waiting' AND user2_id IS NULL;

-- Index to quickly find sessions by time/duration/status combination
CREATE INDEX IF NOT EXISTS idx_sessions_matching_candidates 
ON sessions (start_time, duration, status, user1_id, user2_id, created_at);

-- Partial index for better performance on waiting sessions only
CREATE INDEX IF NOT EXISTS idx_sessions_waiting_users 
ON sessions (user1_id, start_time) 
WHERE status = 'waiting' AND user2_id IS NULL;

-- Performance analysis function to help monitor matching efficiency
CREATE OR REPLACE FUNCTION analyze_language_matching_performance()
RETURNS TABLE (
  time_slot TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  total_waiting INTEGER,
  languages_distribution JSONB,
  potential_matches INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH waiting_sessions AS (
    SELECT 
      s.start_time,
      s.duration,
      s.user1_id,
      p.languages
    FROM sessions s
    JOIN profiles p ON s.user1_id = p.id
    WHERE s.status = 'waiting' 
      AND s.user2_id IS NULL
  ),
  grouped_sessions AS (
    SELECT 
      ws.start_time,
      ws.duration,
      COUNT(*) as total_waiting,
      jsonb_object_agg(
        lang,
        COUNT(*)
      ) as lang_dist,
      -- Calculate potential matches (users with at least one common language)
      COUNT(*) * (COUNT(*) - 1) / 2 as max_potential_matches
    FROM waiting_sessions ws
    CROSS JOIN UNNEST(ws.languages) as lang
    GROUP BY ws.start_time, ws.duration
  )
  SELECT 
    gs.start_time,
    gs.duration,
    gs.total_waiting::INTEGER,
    gs.lang_dist,
    gs.max_potential_matches::INTEGER
  FROM grouped_sessions gs
  ORDER BY gs.start_time, gs.duration;
END;
$$ LANGUAGE plpgsql;

-- Function to get language compatibility statistics
CREATE OR REPLACE FUNCTION get_language_compatibility_stats()
RETURNS TABLE (
  language_pair TEXT,
  user_count INTEGER,
  match_potential_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_language_pairs AS (
    SELECT 
      l1 as lang1,
      l2 as lang2,
      COUNT(DISTINCT p.id) as users_with_both
    FROM profiles p
    CROSS JOIN UNNEST(p.languages) as l1
    CROSS JOIN UNNEST(p.languages) as l2
    WHERE l1 <= l2  -- Avoid duplicate pairs like (en,nl) and (nl,en)
    GROUP BY l1, l2
  )
  SELECT 
    CASE 
      WHEN ulp.lang1 = ulp.lang2 THEN ulp.lang1
      ELSE ulp.lang1 || '-' || ulp.lang2
    END,
    ulp.users_with_both::INTEGER,
    -- Calculate match potential score (higher is better for matchmaking)
    CASE 
      WHEN ulp.users_with_both >= 2 THEN 
        LOG(ulp.users_with_both::NUMERIC) * ulp.users_with_both
      ELSE 0
    END as match_potential_score
  FROM user_language_pairs ulp
  WHERE ulp.users_with_both > 0
  ORDER BY match_potential_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring view for language matching
CREATE OR REPLACE VIEW language_matching_health AS
SELECT 
  'Total Profiles' as metric,
  COUNT(*)::TEXT as value,
  'users' as unit
FROM profiles
UNION ALL
SELECT 
  'Multilingual Users' as metric,
  COUNT(*)::TEXT as value,
  'users' as unit
FROM profiles 
WHERE array_length(languages, 1) > 1
UNION ALL
SELECT 
  'Average Languages per User' as metric,
  ROUND(AVG(array_length(languages, 1)), 2)::TEXT as value,
  'languages' as unit
FROM profiles
UNION ALL
SELECT 
  'Most Popular Language' as metric,
  (
    SELECT lang 
    FROM (
      SELECT UNNEST(languages) as lang, COUNT(*) as cnt
      FROM profiles 
      GROUP BY lang 
      ORDER BY cnt DESC 
      LIMIT 1
    ) t
  ) as value,
  'language_code' as unit
UNION ALL
SELECT 
  'Waiting Sessions' as metric,
  COUNT(*)::TEXT as value,
  'sessions' as unit
FROM sessions 
WHERE status = 'waiting' AND user2_id IS NULL;

-- Comments with usage examples and performance tips
/*
USAGE EXAMPLES:

1. Check matching performance for current time slots:
   SELECT * FROM analyze_language_matching_performance();

2. See language compatibility statistics:
   SELECT * FROM get_language_compatibility_stats();

3. Monitor overall matching health:
   SELECT * FROM language_matching_health;

4. Find users who could potentially be matched (common languages):
   SELECT 
     p1.id as user1_id,
     p2.id as user2_id,
     p1.languages && p2.languages as has_common_language,
     p1.languages & p2.languages as common_languages_array
   FROM profiles p1
   CROSS JOIN profiles p2
   WHERE p1.id != p2.id 
     AND p1.languages && p2.languages
   LIMIT 10;

PERFORMANCE TIPS:

1. The GIN index on languages is crucial for the && operator performance
2. Composite indexes help with complex matching queries
3. Partial indexes reduce index size for status-specific queries
4. Regular VACUUM and ANALYZE on the profiles and sessions tables
5. Consider partitioning sessions table by date if volume grows large

MONITORING:

Run this query periodically to check if indexes are being used:
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('profiles', 'sessions')
ORDER BY idx_scan DESC;
*/