-- Migration: System Settings table for storing Gemini API Key & global configuration
-- Enables database-level API Key management for administrators

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access: Allows the AI tutor client to read active system configuration
CREATE POLICY "Allow public read access to system_settings"
ON public.system_settings
FOR SELECT
TO public
USING (true);

-- 2. Admin Manage Access: Allows administrators to create, update, or delete system_settings
CREATE POLICY "Allow admins to manage system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);
