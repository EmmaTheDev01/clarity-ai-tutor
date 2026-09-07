-- Restrict student materials access to strictly their own uploaded materials to prevent any cross-user data leakage.
-- Teachers and Admins retain access to system materials.

DO $$
BEGIN
  -- Drop broad sharing policy if exists
  DROP POLICY IF EXISTS "Students view classroom materials" ON public.materials;
  DROP POLICY IF EXISTS "Students view educator and classroom materials" ON public.materials;

  -- Create strict user-only read policy
  DROP POLICY IF EXISTS "Users view own uploaded materials" ON public.materials;
  CREATE POLICY "Users view own uploaded materials" ON public.materials
    FOR SELECT USING (
      auth.role() = 'authenticated'
      AND (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
        )
      )
    );
END $$;

NOTIFY pgrst, 'reload schema';
