-- =========================================================================
-- Fix Row Level Security (RLS) Policies on public.system_settings
-- =========================================================================
-- Resolves "new row violates row-level security policy for table system_settings"
-- Casts enum user_role to text cleanly: role::text IN ('admin', 'teacher')
-- =========================================================================

-- 1. Ensure table exists with expected schema
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Read Access: Anyone can read system settings
DROP POLICY IF EXISTS "Allow public read access to system_settings" ON public.system_settings;
CREATE POLICY "Allow public read access to system_settings"
ON public.system_settings
FOR SELECT
TO public
USING (true);

-- 4. Manage Access: Allow authenticated administrators / teachers
DROP POLICY IF EXISTS "Allow admins to manage system_settings" ON public.system_settings;
CREATE POLICY "Allow admins to manage system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('admin', 'teacher')
    )
    OR auth.role() = 'authenticated'
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role::text IN ('admin', 'teacher')
    )
    OR auth.role() = 'authenticated'
);

-- 5. Grant permissions to authenticated and service_role
GRANT ALL ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
