-- Add images column to messages and notes tables to fix missing user chats and notes

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS images TEXT[];

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS images TEXT[];

NOTIFY pgrst, 'reload schema';
