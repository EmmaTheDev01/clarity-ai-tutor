-- Migration: Student Understanding Level, Daily Streak Tracking & Free Token Rewards
-- PureLearn.ai Schema Extension

-- 1. Add columns to student_profiles if they do not exist
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS quizzes_mastered INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS understanding_level TEXT DEFAULT 'Novice Explorer' NOT NULL,
ADD COLUMN IF NOT EXISTS daily_bonus_tokens INTEGER DEFAULT 0 NOT NULL;

-- 2. Add comment documenting the understanding_level categories
COMMENT ON COLUMN public.student_profiles.understanding_level IS 
'Student understanding category based on quiz mastery: Novice Explorer (0-2), Active Scholar (3-5), Conceptual Master (6-9), Socratic Polymath (10+)';

-- 3. Add index on student_id and understanding_level for classroom telemetry
CREATE INDEX IF NOT EXISTS idx_student_profiles_understanding 
ON public.student_profiles (student_id, understanding_level);
