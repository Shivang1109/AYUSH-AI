-- AYUSH AI Database Setup Script
-- Run these commands in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE ENHANCEMENTS (for Dosha)
-- ============================================

-- Add dosha columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dosha_primary VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dosha_secondary VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dosha_assessment_date TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dosha_quiz_answers JSONB;

-- Add index for faster dosha lookups
CREATE INDEX IF NOT EXISTS idx_profiles_dosha ON profiles(dosha_primary);

-- ============================================
-- 2. QUERY_HISTORY TABLE ENHANCEMENTS
-- ============================================

-- Add enhanced logging columns
ALTER TABLE query_history ADD COLUMN IF NOT EXISTS matched_keywords TEXT[];
ALTER TABLE query_history ADD COLUMN IF NOT EXISTS dosha_used VARCHAR(10);
ALTER TABLE query_history ADD COLUMN IF NOT EXISTS ranking_score FLOAT;
ALTER TABLE query_history ADD COLUMN IF NOT EXISTS ai_refinement_used BOOLEAN DEFAULT FALSE;
ALTER TABLE query_history ADD COLUMN IF NOT EXISTS response_time_ms FLOAT;

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_query_history_dosha ON query_history(dosha_used);
CREATE INDEX IF NOT EXISTS idx_query_history_score ON query_history(ranking_score);

-- ============================================
-- 3. SAVED_REMEDIES TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS saved_remedies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    remedy_id UUID REFERENCES remedies(id) ON DELETE CASCADE,
    remedy_name TEXT NOT NULL,
    saved_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, remedy_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_saved_remedies_user ON saved_remedies(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_remedies_remedy ON saved_remedies(remedy_id);

-- Enable RLS
ALTER TABLE saved_remedies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_remedies
CREATE POLICY "Users can view their own saved remedies"
    ON saved_remedies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved remedies"
    ON saved_remedies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved remedies"
    ON saved_remedies FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved remedies"
    ON saved_remedies FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. VERIFY SETUP
-- ============================================

-- Check profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check query_history table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'query_history' 
ORDER BY ordinal_position;

-- Check saved_remedies table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'saved_remedies' 
ORDER BY ordinal_position;

-- ============================================
-- 5. SAMPLE QUERIES (for testing)
-- ============================================

-- Get user's dosha profile
-- SELECT dosha_primary, dosha_secondary, dosha_assessment_date 
-- FROM profiles 
-- WHERE id = 'user_id_here';

-- Get enhanced query history
-- SELECT symptom, remedy_name, matched_keywords, dosha_used, ranking_score, response_time_ms
-- FROM query_history 
-- WHERE user_id = 'user_id_here'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Get user's saved remedies
-- SELECT sr.*, r.name, r.herb, r.category
-- FROM saved_remedies sr
-- JOIN remedies r ON sr.remedy_id = r.id
-- WHERE sr.user_id = 'user_id_here'
-- ORDER BY sr.saved_at DESC;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Make sure you have auth.users table set up
-- 3. Make sure you have remedies table with proper structure
-- 4. RLS policies ensure users can only access their own data
-- 5. Indexes improve query performance
