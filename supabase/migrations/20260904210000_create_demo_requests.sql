-- Migration: Institutional & User Demo Requests Table
-- Allows public submissions from the landing page and provides admin-only management.

-- 1. Create table public.demo_requests
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Educator',
  organization TEXT,
  team_size TEXT,
  use_case TEXT,
  preferred_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'scheduled', 'completed', 'cancelled'
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone (visitors on the landing page) to submit a demo request
DROP POLICY IF EXISTS "Public can submit demo requests" ON public.demo_requests;
CREATE POLICY "Public can submit demo requests"
  ON public.demo_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow admins full access (SELECT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins full access to demo requests" ON public.demo_requests;
CREATE POLICY "Admins full access to demo requests"
  ON public.demo_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. Create an index on status and created_at for fast querying in admin portal
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON public.demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests(created_at DESC);
