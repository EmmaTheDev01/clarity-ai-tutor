-- Migration: 20260907180000_subscriptions_and_quotas_complete.sql
-- Description: Comprehensive subscription management, user upsert RLS, audit logs & monthly prompt quotas.

-- 1. Ensure subscriptions table exists with appropriate columns and user uniqueness
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'educator'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'trialing', 'past_due'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure plan_tier column exists if table was previously created with plan_name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan_tier'
    ) THEN
        ALTER TABLE public.subscriptions RENAME COLUMN plan_name TO plan_tier;
    END IF;
END $$;

-- Ensure user_id has unique constraint for clean atomic upserts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_user_id_key'
    ) THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN others THEN NULL;
END $$;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS Policies:
-- Users can view their own subscription
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can insert/upsert their own subscription
DROP POLICY IF EXISTS "Users insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users insert own subscriptions" ON public.subscriptions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update their own subscription
DROP POLICY IF EXISTS "Users update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users update own subscriptions" ON public.subscriptions
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Administrators have unrestricted access to manage and review all subscriptions
DROP POLICY IF EXISTS "Admins have full access on subscriptions" ON public.subscriptions;
CREATE POLICY "Admins have full access on subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin());

-- 2. Audit Logs Table for subscription lifecycle tracking
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own logs" ON public.user_logs;
CREATE POLICY "Users view own logs" ON public.user_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own logs" ON public.user_logs;
CREATE POLICY "Users insert own logs" ON public.user_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access on user_logs" ON public.user_logs;
CREATE POLICY "Admins have full access on user_logs" ON public.user_logs
    FOR ALL TO authenticated USING (public.is_admin());

-- 3. Monthly Prompt Tracking (Future Limit Architecture)
CREATE TABLE IF NOT EXISTS public.user_monthly_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    year_month TEXT NOT NULL, -- e.g. '2026-09'
    prompt_count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_monthly_prompts UNIQUE (user_id, year_month)
);

ALTER TABLE public.user_monthly_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own prompt counts" ON public.user_monthly_prompts;
CREATE POLICY "Users view own prompt counts" ON public.user_monthly_prompts
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all prompt counts" ON public.user_monthly_prompts;
CREATE POLICY "Admins view all prompt counts" ON public.user_monthly_prompts
    FOR ALL TO authenticated USING (public.is_admin());

-- 4. Indexes for rapid telemetry and lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions(plan_tier);
CREATE INDEX IF NOT EXISTS idx_user_logs_user ON public.user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_action ON public.user_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_logs_created ON public.user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_prompts_user_month ON public.user_monthly_prompts(user_id, year_month);

NOTIFY pgrst, 'reload schema';
