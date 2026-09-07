-- Migration: Strictly User Flashcards Isolation
-- Ensures users can ONLY view and manage flashcard decks belonging to their own user_id.

DO $$
BEGIN
  -- Drop overly broad policy if it exists
  DROP POLICY IF EXISTS "Authenticated users view flashcards" ON public.flashcard_decks;

  -- Create strictly scoped select policy
  DROP POLICY IF EXISTS "Users view own flashcards" ON public.flashcard_decks;
  CREATE POLICY "Users view own flashcards" ON public.flashcard_decks
    FOR SELECT USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );

  -- Ensure users can insert and manage their own flashcards
  DROP POLICY IF EXISTS "Users manage own flashcards" ON public.flashcard_decks;
  CREATE POLICY "Users manage own flashcards" ON public.flashcard_decks
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "Admins manage all flashcards" ON public.flashcard_decks;
  CREATE POLICY "Admins manage all flashcards" ON public.flashcard_decks
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );
END $$;

NOTIFY pgrst, 'reload schema';
