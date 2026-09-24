-- =========================================================================
-- PureLearn Admin Email Broadcasts & Resend Delivery Logs Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.email_broadcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    preview_text TEXT,
    body_html TEXT NOT NULL,
    body_text TEXT,
    target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'students', 'teachers', 'specific', 'test'
    recipient_count INTEGER DEFAULT 0 NOT NULL,
    recipients JSONB DEFAULT '[]'::jsonb, -- Array of email addresses or user objects
    status TEXT NOT NULL DEFAULT 'sent', -- 'draft', 'sending', 'sent', 'partial', 'failed'
    resend_batch_id TEXT,
    sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_created ON public.email_broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_audience ON public.email_broadcasts(target_audience);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_status ON public.email_broadcasts(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.email_broadcasts ENABLE ROW LEVEL SECURITY;

-- Admins full access policy
DROP POLICY IF EXISTS "Admins have full access on email_broadcasts" ON public.email_broadcasts;
CREATE POLICY "Admins have full access on email_broadcasts" ON public.email_broadcasts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow service_role bypass for Edge Functions
GRANT ALL ON public.email_broadcasts TO authenticated, service_role;
