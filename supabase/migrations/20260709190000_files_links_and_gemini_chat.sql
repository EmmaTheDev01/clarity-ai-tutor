-- Bring an existing Clarity AI Tutor Supabase project up to the file/link upload model.
-- Run this in Supabase SQL Editor or with `supabase db push`, then reload the app.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_sender_role') THEN
    CREATE TYPE public.chat_sender_role AS ENUM ('student', 'assistant', 'teacher', 'admin');
  END IF;
END $$;

ALTER TYPE public.material_type ADD VALUE IF NOT EXISTS 'Word';
ALTER TYPE public.material_type ADD VALUE IF NOT EXISTS 'Image';
ALTER TYPE public.material_type ADD VALUE IF NOT EXISTS 'Video';
ALTER TYPE public.material_type ADD VALUE IF NOT EXISTS 'Link';
ALTER TYPE public.material_type ADD VALUE IF NOT EXISTS 'File';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.materials
  ALTER COLUMN classroom_id DROP NOT NULL,
  ALTER COLUMN quiz_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS source_kind TEXT DEFAULT 'file' NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'materials_source_kind_check'
      AND conrelid = 'public.materials'::regclass
  ) THEN
    ALTER TABLE public.materials
      ADD CONSTRAINT materials_source_kind_check CHECK (source_kind IN ('file', 'link', 'text'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'sender_role'
      AND udt_name = 'user_role'
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN sender_role TYPE public.chat_sender_role
      USING (
        CASE sender_role::text
          WHEN 'student' THEN 'student'
          WHEN 'teacher' THEN 'assistant'
          WHEN 'admin' THEN 'admin'
          ELSE 'assistant'
        END
      )::public.chat_sender_role;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'materials'
      AND policyname = 'Users manage own uploaded materials'
  ) THEN
    CREATE POLICY "Users manage own uploaded materials" ON public.materials
      FOR ALL USING (uploaded_by = auth.uid())
      WITH CHECK (uploaded_by = auth.uid());
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'study-files',
    'study-files',
    true,
    209715200,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can read public avatars'
  ) THEN
    CREATE POLICY "Anyone can read public avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users manage own avatar objects'
  ) THEN
    CREATE POLICY "Users manage own avatar objects" ON storage.objects
      FOR ALL USING (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
      ) WITH CHECK (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users read study files'
  ) THEN
    CREATE POLICY "Authenticated users read study files" ON storage.objects
      FOR SELECT USING (bucket_id = 'study-files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users manage own study files'
  ) THEN
    CREATE POLICY "Users manage own study files" ON storage.objects
      FOR ALL USING (
        bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]
      ) WITH CHECK (
        bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
