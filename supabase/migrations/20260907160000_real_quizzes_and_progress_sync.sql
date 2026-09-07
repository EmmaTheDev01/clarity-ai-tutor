-- Migration: Real Quizzes & Student Progress Synchronization
-- PureLearn.ai Schema Extension

-- 1. Add material_id on quizzes for bidirectional linking with materials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'material_id'
  ) THEN
    ALTER TABLE public.quizzes ADD COLUMN material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quizzes_material_id ON public.quizzes(material_id);

-- 2. Ensure RLS policies allow students and teachers to create and view quizzes for their materials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quizzes' 
      AND policyname = 'Users create and manage own quizzes'
  ) THEN
    CREATE POLICY "Users create and manage own quizzes" ON public.quizzes
      FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quizzes' 
      AND policyname = 'Users view accessible material quizzes'
  ) THEN
    CREATE POLICY "Users view accessible material quizzes" ON public.quizzes
      FOR SELECT USING (
        auth.uid() = teacher_id
        OR EXISTS (
          SELECT 1 FROM public.materials m
          WHERE (m.quiz_id = quizzes.id OR m.id = quizzes.material_id)
            AND (m.uploaded_by = auth.uid() OR m.classroom_id IS NOT NULL)
        )
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
