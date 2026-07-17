-- Add xp column to student_profiles for dynamic study progress
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL;
