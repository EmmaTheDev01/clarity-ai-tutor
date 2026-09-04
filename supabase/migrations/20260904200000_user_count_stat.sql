-- Migration: Public app_stats table for cached user count
-- Kept trigger-based (no pg_cron) so it works on all Supabase tiers.

-- 1. Create app_stats table
CREATE TABLE IF NOT EXISTS public.app_stats (
  id         TEXT PRIMARY KEY,
  value      BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow anon/public reads (no auth needed for the landing page)
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_stats" ON public.app_stats;

CREATE POLICY "Public read app_stats"
  ON public.app_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Seed the user_count row
INSERT INTO public.app_stats (id, value, updated_at)
VALUES ('user_count', 0, now())
ON CONFLICT (id) DO NOTHING;

-- 3. Core worker function that counts profiles and upserts into app_stats (returns void, can be called directly)
CREATE OR REPLACE FUNCTION public.refresh_user_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count BIGINT;
BEGIN
  SELECT COUNT(*) INTO _count FROM public.profiles;

  INSERT INTO public.app_stats (id, value, updated_at)
  VALUES ('user_count', _count, now())
  ON CONFLICT (id)
  DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

  RETURN _count;
END;
$$;

-- 4. Separate trigger wrapper function
CREATE OR REPLACE FUNCTION public.trigger_refresh_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_user_count();
  RETURN NULL;
END;
$$;

-- 5. Trigger: fires after any INSERT or DELETE on profiles
DROP TRIGGER IF EXISTS trg_refresh_user_count ON public.profiles;

CREATE TRIGGER trg_refresh_user_count
  AFTER INSERT OR DELETE
  ON public.profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_user_count();

-- 6. Backfill the current real count right now
SELECT public.refresh_user_count();
