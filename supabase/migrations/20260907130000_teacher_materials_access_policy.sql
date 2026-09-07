-- Allow students to read materials uploaded by teachers, trainers, admins, or in their enrolled classrooms.
-- This ensures students have full access to learning materials uploaded by educators.

DO $$
BEGIN
  -- Drop existing policy if exists to replace with updated unified read policy
  DROP POLICY IF EXISTS "Students view classroom materials" ON public.materials;
  DROP POLICY IF EXISTS "Students view educator and classroom materials" ON public.materials;

  CREATE POLICY "Students view educator and classroom materials" ON public.materials
    FOR SELECT USING (
      auth.role() = 'authenticated'
      AND (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.classroom_students cs
          WHERE cs.classroom_id = materials.classroom_id AND cs.student_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = materials.uploaded_by AND p.role IN ('teacher', 'admin')
        )
      )
    );
END $$;

NOTIFY pgrst, 'reload schema';
