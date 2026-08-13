-- Supabase Migration: Admin Ban/Delete Users & System-wide Flashcard Decks Management
-- Enables RLS Policies for Admins to Ban ('banned'), Delete Users, and manage Flashcards.

-- 1. Create Flashcard Decks Table if not exists
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General' NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cards JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: [{ q: text, a: text }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Flashcard Decks
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

-- Flashcard Decks RLS Policies
DROP POLICY IF EXISTS "Authenticated users view flashcards" ON public.flashcard_decks;
CREATE POLICY "Authenticated users view flashcards" ON public.flashcard_decks
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users manage own flashcards" ON public.flashcard_decks;
CREATE POLICY "Users manage own flashcards" ON public.flashcard_decks
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all flashcards" ON public.flashcard_decks;
CREATE POLICY "Admins manage all flashcards" ON public.flashcard_decks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 2. Ensure Profiles RLS Policies allow Admins to Update (Ban) & Delete Any User
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
        OR auth.uid() = id
    );

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
        OR auth.uid() = id
    );
