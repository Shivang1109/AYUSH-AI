-- AYUSH AI Database Update Script
-- Run these commands in your Supabase SQL Editor
-- This script safely adds only missing columns and tables

-- ============================================
-- 1. PROFILES TABLE ENHANCEMENTS (for Dosha)
-- ============================================

-- Add dosha columns to profiles table (IF NOT EXISTS)
DO $$ 
BEGIN
    -- Add dosha_primary column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'dosha_primary'
    ) THEN
        ALTER TABLE profiles ADD COLUMN dosha_primary VARCHAR(10);
    END IF;

    -- Add dosha_secondary column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'dosha_secondary'
    ) THEN
        ALTER TABLE profiles ADD COLUMN dosha_secondary VARCHAR(10);
    END IF;

    -- Add dosha_assessment_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'dosha_assessment_date'
    ) THEN
        ALTER TABLE profiles ADD COLUMN dosha_assessment_date TIMESTAMP;
    END IF;

    -- Add dosha_quiz_answers column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'dosha_quiz_answers'
    ) THEN
        ALTER TABLE profiles ADD COLUMN dosha_quiz_answers JSONB;
    END IF;
END $$;

-- Add index for faster dosha lookups (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_profiles_dosha ON profiles(dosha_primary);

-- ============================================
-- 2. QUERY_HISTORY TABLE ENHANCEMENTS
-- ============================================

DO $$ 
BEGIN
    -- Add matched_keywords column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'query_history' AND column_name = 'matched_keywords'
    ) THEN
        ALTER TABLE query_history ADD COLUMN matched_keywords TEXT[];
    END IF;

    -- Add dosha_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'query_history' AND column_name = 'dosha_used'
    ) THEN
        ALTER TABLE query_history ADD COLUMN dosha_used VARCHAR(10);
    END IF;

    -- Add ranking_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'query_history' AND column_name = 'ranking_score'
    ) THEN
        ALTER TABLE query_history ADD COLUMN ranking_score FLOAT;
    END IF;

    -- Add ai_refinement_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'query_history' AND column_name = 'ai_refinement_used'
    ) THEN
        ALTER TABLE query_history ADD COLUMN ai_refinement_used BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add response_time_ms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'query_history' AND column_name = 'response_time_ms'
    ) THEN
        ALTER TABLE query_history ADD COLUMN response_time_ms FLOAT;
    END IF;
END $$;

-- Add indexes for analytics (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_query_history_dosha ON query_history(dosha_used);
CREATE INDEX IF NOT EXISTS idx_query_history_score ON query_history(ranking_score);

-- ============================================
-- 3. VERIFY SETUP
-- ============================================

-- Check profiles table structure
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type,
    CASE 
        WHEN column_name IN ('dosha_primary', 'dosha_secondary', 'dosha_assessment_date', 'dosha_quiz_answers') 
        THEN '✅ NEW' 
        ELSE '✓' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check query_history table structure
SELECT 
    'query_history' as table_name,
    column_name, 
    data_type,
    CASE 
        WHEN column_name IN ('matched_keywords', 'dosha_used', 'ranking_score', 'ai_refinement_used', 'response_time_ms') 
        THEN '✅ NEW' 
        ELSE '✓' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'query_history' 
ORDER BY ordinal_position;

-- Check saved_remedies table (should already exist)
SELECT 
    'saved_remedies' as table_name,
    column_name, 
    data_type,
    '✓ EXISTS' as status
FROM information_schema.columns 
WHERE table_name = 'saved_remedies' 
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Database update complete!';
    RAISE NOTICE '✅ Profiles table enhanced with dosha columns';
    RAISE NOTICE '✅ Query_history table enhanced with logging columns';
    RAISE NOTICE '✅ Saved_remedies table already exists';
    RAISE NOTICE '🎉 Your database is ready for the enhanced AYUSH AI!';
END $$;
