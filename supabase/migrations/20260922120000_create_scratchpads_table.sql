-- =========================================================================
-- PureLearn Smart Scratchpad / Tablet Notepad Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.scratchpads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Scratchpad',
    subject TEXT DEFAULT 'General',
    -- Stroke data stored as JSONB for lossless vector re-editing, undo/redo, and scale independence
    strokes_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Thumbnail base64 or storage image preview for fast card loading in note list
    thumbnail_url TEXT,
    -- Paper styling configuration
    paper_style TEXT NOT NULL DEFAULT 'grid' CHECK (paper_style IN ('blank', 'ruled', 'grid', 'dots')),
    paper_theme TEXT NOT NULL DEFAULT 'light' CHECK (paper_theme IN ('light', 'dark', 'yellow_pad', 'sepia')),
    -- Latest AI Socratic synthesis cache
    ai_analysis JSONB,
    -- Optional link if converted or synced to a structured note in public.notes
    linked_note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_scratchpads_student ON public.scratchpads(student_id);
CREATE INDEX IF NOT EXISTS idx_scratchpads_updated ON public.scratchpads(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scratchpads ENABLE ROW LEVEL SECURITY;

-- Students can view, create, edit, and delete only their own scratchpads
DROP POLICY IF EXISTS "Students manage own scratchpads" ON public.scratchpads;
CREATE POLICY "Students manage own scratchpads" ON public.scratchpads
    FOR ALL
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Admins full access
DROP POLICY IF EXISTS "Admins have full access on scratchpads" ON public.scratchpads;
CREATE POLICY "Admins have full access on scratchpads" ON public.scratchpads
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
