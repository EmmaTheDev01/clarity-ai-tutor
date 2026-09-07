-- Migration: Record Quizzes Answered & Failed, and link quiz_attempts with materials
-- PureLearn.ai Schema Extension

-- 1. Make quiz_id in quiz_attempts nullable and add material_id & metrics
ALTER TABLE public.quiz_attempts 
  ALTER COLUMN quiz_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material_title TEXT,
  ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS questions_answered INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS questions_failed INT DEFAULT 0;

-- 2. Add quizzes_answered and quizzes_failed to student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS quizzes_answered INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS quizzes_failed INT DEFAULT 0 NOT NULL;

-- 3. Ensure RLS policies allow students to record their quiz attempts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quiz_attempts' 
      AND policyname = 'Students record own quiz attempts'
  ) THEN
    CREATE POLICY "Students record own quiz attempts" ON public.quiz_attempts
      FOR INSERT WITH CHECK (student_id = auth.uid());
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
