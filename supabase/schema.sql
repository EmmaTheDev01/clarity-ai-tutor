-- Supabase Master Schema for Clarity AI Tutor / PureLearn.ai
-- Consolidated schema incorporating all migrations:
-- 1. Profiles & Role Management
-- 2. Student Profiles (XP, Streak, Understanding Category, Token Balance)
-- 3. Classrooms & Enrolments
-- 4. Materials (Files, Links, Text with Strict User Isolation)
-- 5. Quizzes (Teacher & Student Grounded Material Quizzes)
-- 6. Quiz Attempts (Strict Student Isolation, Telemetry & Confidence Tracking)
-- 7. Flashcard Decks (Strict User-Only Isolation & AI Mastery)
-- 8. Digital Notebook (Automated & Manual Notes, Starred, Pinned, Images)
-- 9. Note Shares (Collaborative Note Sharing)
-- 10. Favorites (Bookmarks for Materials, Flashcards, Notes)
-- 11. Chat Sessions & Messages (Encrypted Storage Requirement)
-- 12. Persistent Notifications
-- 13. System Settings (Gemini API Key & Admin Configurations)
-- 14. Cached Public App Stats (User Count Trigger)
-- 15. Institutional Demo Requests
-- 16. Subscriptions & User Audit Logs
-- 17. Security Definer Helper Functions & Infinite Recursion Guards
-- 18. Storage Buckets (avatars, study-files) & Policies

-- =========================================================================
-- 1. ENUMS & TYPES
-- =========================================================================
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE cognitive_profile_tag AS ENUM ('standard', 'adhd', 'dyslexia', 'sensory');
CREATE TYPE material_type AS ENUM ('PDF', 'Word', 'Image', 'Slides', 'Audio', 'Video', 'YouTube', 'Link', 'Text', 'File');
CREATE TYPE chat_sender_role AS ENUM ('student', 'assistant', 'teacher', 'admin');

-- =========================================================================
-- 2. PROFILES (Extends Supabase auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    approval_status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'banned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. STUDENT PROFILES (Cognitive attributes, streaks, XP & understanding)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    academic_focus TEXT[],
    education_level TEXT DEFAULT 'Undergraduate' NOT NULL, -- 'High School', 'Undergraduate', 'Postgraduate'
    grade_level TEXT, -- 'Freshman', '3.8 GPA', '11th Grade'
    language_preference TEXT DEFAULT 'en' NOT NULL,
    cognitive_profile cognitive_profile_tag NOT NULL DEFAULT 'standard',
    visual_spacing_preference TEXT DEFAULT 'normal' NOT NULL, -- 'normal', 'wide', 'loose'
    pastel_filter_color TEXT, -- Sepia, pastel yellow, cream hues
    xp INTEGER DEFAULT 0 NOT NULL,
    streak INTEGER DEFAULT 0 NOT NULL,
    last_active_date DATE DEFAULT CURRENT_DATE,
    quizzes_mastered INTEGER DEFAULT 0 NOT NULL,
    quizzes_answered INTEGER DEFAULT 0 NOT NULL,
    quizzes_failed INTEGER DEFAULT 0 NOT NULL,
    understanding_level TEXT DEFAULT 'Novice Explorer' NOT NULL,
    daily_bonus_tokens INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON COLUMN public.student_profiles.understanding_level IS 
'Student understanding category based on quiz mastery: Novice Explorer (0-2), Active Scholar (3-5), Conceptual Master (6-9), Socratic Polymath (10+)';

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. CLASSROOMS (Managed by Teachers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 5. CLASSROOM STUDENTS JUNCTION (Classroom enrolments)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.classroom_students (
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (classroom_id, student_id)
);

ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 6. MATERIALS (Course documents, files, links uploaded by users or teachers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type material_type NOT NULL,
    url TEXT,
    content TEXT, -- Extract raw text for LLM embedding and quiz grounding
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    quiz_id UUID, -- Will reference quizzes(id) via foreign key constraint below
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT,
    mime_type TEXT,
    file_size BIGINT,
    source_kind TEXT CHECK (source_kind IN ('file', 'link', 'text')) DEFAULT 'file' NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 7. QUIZZES (Interactive conceptual quizzes grounded in materials)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    questions JSONB NOT NULL, -- Array of objects: { question: text, options: text[], correctIndex: int, explanation?: text }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Add deferred foreign key from materials.quiz_id to quizzes.id if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_materials_quiz' AND table_name = 'materials'
    ) THEN
        ALTER TABLE public.materials 
        ADD CONSTRAINT fk_materials_quiz 
        FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =========================================================================
-- 8. QUIZ ATTEMPTS (Strictly isolated student assessment performance)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    material_title TEXT,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC(5,2) NOT NULL, -- Percentage (e.g. 85.50)
    confidence_level INT CHECK (confidence_level BETWEEN 1 AND 5) NOT NULL DEFAULT 3,
    passed BOOLEAN DEFAULT false NOT NULL,
    questions_answered INT DEFAULT 0 NOT NULL,
    questions_failed INT DEFAULT 0 NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 9. FLASHCARD DECKS (Strict user isolation & AI mastery decks)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General' NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cards JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: [{ q: text, a: text }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 10. DIGITAL NOTEBOOK (Automated and Manual Notes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT,
    is_ai_generated BOOLEAN DEFAULT false NOT NULL,
    is_starred BOOLEAN DEFAULT false NOT NULL,
    pinned BOOLEAN DEFAULT false NOT NULL,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 11. NOTE SHARES (Collaborative email-based note sharing)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.note_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    shared_with_email TEXT NOT NULL,
    shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, shared_with_email)
);

ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 12. FAVORITES (Bookmarks for materials, flashcards, notes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT CHECK (item_type IN ('material', 'flashcard', 'note')) NOT NULL,
    item_id UUID NOT NULL,
    bookmarked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, item_type, item_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 13. CHAT SESSIONS & MESSAGES (Encrypted student AI chat)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    active_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    sender_role chat_sender_role NOT NULL,
    encrypted_content TEXT NOT NULL, -- Message text encrypted at client before DB write
    encryption_iv TEXT NOT NULL, -- Initialization vector for crypto key alignment
    citation TEXT,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 14. NOTIFICATIONS (Per-user persistent alerts)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT DEFAULT '🔔',
    is_read BOOLEAN DEFAULT false NOT NULL,
    type TEXT DEFAULT 'system',
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 15. SYSTEM SETTINGS (Database-level API key & platform configurations)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 16. APP STATS (Cached public statistics, user counter)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.app_stats (
    id TEXT PRIMARY KEY,
    value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_stats (id, value, updated_at)
VALUES ('user_count', 0, now())
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 17. DEMO REQUESTS (Institutional and educator landing page requests)
-- =========================================================================
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

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 18. SUBSCRIPTIONS & USER LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'educator'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'trialing'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'onboarding_complete', 'quiz_submission', 'flashcard_export', 'subscription_change'
    details TEXT, -- JSON summary of changes, metadata
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_monthly_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    year_month TEXT NOT NULL, -- Format: 'YYYY-MM' e.g. '2026-09'
    prompt_count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_monthly_prompts UNIQUE (user_id, year_month)
);

ALTER TABLE public.user_monthly_prompts ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- 19. ADMIN HELPER FUNCTION (Prevents RLS Infinite Recursion)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- --- PROFILES ---
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
CREATE POLICY "Users can view any profile" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;
CREATE POLICY "Admins have full access on profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
    FOR DELETE USING (public.is_admin() OR auth.uid() = id);

-- --- STUDENT PROFILES ---
DROP POLICY IF EXISTS "Students view/update own profile" ON public.student_profiles;
CREATE POLICY "Students view/update own profile" ON public.student_profiles
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view classroom students profiles" ON public.student_profiles;
CREATE POLICY "Teachers can view classroom students profiles" ON public.student_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_students cs
            JOIN public.classrooms c ON cs.classroom_id = c.id
            WHERE cs.student_id = student_profiles.student_id AND c.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins have full access on student_profiles" ON public.student_profiles;
CREATE POLICY "Admins have full access on student_profiles" ON public.student_profiles
    FOR ALL USING (public.is_admin());

-- --- CLASSROOMS ---
DROP POLICY IF EXISTS "Teachers manage own classrooms" ON public.classrooms;
CREATE POLICY "Teachers manage own classrooms" ON public.classrooms
    FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students view enrolled classrooms" ON public.classrooms;
CREATE POLICY "Students view enrolled classrooms" ON public.classrooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_students cs
            WHERE cs.classroom_id = classrooms.id AND cs.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins have full access on classrooms" ON public.classrooms;
CREATE POLICY "Admins have full access on classrooms" ON public.classrooms
    FOR ALL USING (public.is_admin());

-- --- CLASSROOM STUDENTS ---
DROP POLICY IF EXISTS "Teachers manage classroom enrolments" ON public.classroom_students;
CREATE POLICY "Teachers manage classroom enrolments" ON public.classroom_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students view own enrolments" ON public.classroom_students;
CREATE POLICY "Students view own enrolments" ON public.classroom_students
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access on classroom_students" ON public.classroom_students;
CREATE POLICY "Admins have full access on classroom_students" ON public.classroom_students
    FOR ALL USING (public.is_admin());

-- --- MATERIALS (Strict User Isolation) ---
DROP POLICY IF EXISTS "Students view classroom materials" ON public.materials;
DROP POLICY IF EXISTS "Students view educator and classroom materials" ON public.materials;
DROP POLICY IF EXISTS "Users view own uploaded materials" ON public.materials;
CREATE POLICY "Users view own uploaded materials" ON public.materials
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (
            uploaded_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
            )
        )
    );

DROP POLICY IF EXISTS "Users manage own uploaded materials" ON public.materials;
CREATE POLICY "Users manage own uploaded materials" ON public.materials
    FOR ALL USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Teachers manage classroom materials" ON public.materials;
CREATE POLICY "Teachers manage classroom materials" ON public.materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins have full access on materials" ON public.materials;
CREATE POLICY "Admins have full access on materials" ON public.materials
    FOR ALL USING (public.is_admin());

-- --- QUIZZES ---
DROP POLICY IF EXISTS "Teachers manage own quizzes" ON public.quizzes;
CREATE POLICY "Teachers manage own quizzes" ON public.quizzes
    FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Users create and manage own quizzes" ON public.quizzes;
CREATE POLICY "Users create and manage own quizzes" ON public.quizzes
    FOR ALL USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Users view accessible material quizzes" ON public.quizzes;
CREATE POLICY "Users view accessible material quizzes" ON public.quizzes
    FOR SELECT USING (
        auth.uid() = teacher_id
        OR EXISTS (
            SELECT 1 FROM public.materials m
            WHERE (m.quiz_id = quizzes.id OR m.id = quizzes.material_id)
              AND (m.uploaded_by = auth.uid() OR m.classroom_id IS NOT NULL)
        )
    );

DROP POLICY IF EXISTS "Admins have full access on quizzes" ON public.quizzes;
CREATE POLICY "Admins have full access on quizzes" ON public.quizzes
    FOR ALL USING (public.is_admin());

-- --- QUIZ ATTEMPTS (Strict Student Isolation: No Cross-User Leakage) ---
DROP POLICY IF EXISTS "Students manage own attempts" ON public.quiz_attempts;
CREATE POLICY "Students manage own attempts" ON public.quiz_attempts
    FOR ALL USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students record own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students record own quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers view student attempts" ON public.quiz_attempts;
CREATE POLICY "Teachers view student attempts" ON public.quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_id AND q.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins have full access on quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Admins have full access on quiz_attempts" ON public.quiz_attempts
    FOR ALL USING (public.is_admin());

-- --- FLASHCARD DECKS (Strict User Isolation) ---
DROP POLICY IF EXISTS "Authenticated users view flashcards" ON public.flashcard_decks;
DROP POLICY IF EXISTS "Users view own flashcards" ON public.flashcard_decks;
CREATE POLICY "Users view own flashcards" ON public.flashcard_decks
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Users manage own flashcards" ON public.flashcard_decks;
CREATE POLICY "Users manage own flashcards" ON public.flashcard_decks
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all flashcards" ON public.flashcard_decks;
CREATE POLICY "Admins manage all flashcards" ON public.flashcard_decks
    FOR ALL USING (public.is_admin());

-- --- NOTES ---
DROP POLICY IF EXISTS "Students manage own notes" ON public.notes;
CREATE POLICY "Students manage own notes" ON public.notes
    FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Users can view accepted shared notes" ON public.notes;
CREATE POLICY "Users can view accepted shared notes" ON public.notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.note_shares ns
            WHERE ns.note_id = notes.id
              AND ns.shared_with = auth.uid()
              AND ns.status = 'accepted'
        )
    );

DROP POLICY IF EXISTS "Admins have full access on notes" ON public.notes;
CREATE POLICY "Admins have full access on notes" ON public.notes
    FOR ALL USING (public.is_admin());

-- --- NOTE SHARES ---
DROP POLICY IF EXISTS "Users manage shares they sent" ON public.note_shares;
CREATE POLICY "Users manage shares they sent" ON public.note_shares
    FOR ALL USING (shared_by = auth.uid());

DROP POLICY IF EXISTS "Recipients view and respond to shares" ON public.note_shares;
CREATE POLICY "Recipients view and respond to shares" ON public.note_shares
    FOR SELECT USING (shared_with = auth.uid());

DROP POLICY IF EXISTS "Recipients can accept or reject shares" ON public.note_shares;
CREATE POLICY "Recipients can accept or reject shares" ON public.note_shares
    FOR UPDATE USING (shared_with = auth.uid())
    WITH CHECK (shared_with = auth.uid());

-- --- FAVORITES ---
DROP POLICY IF EXISTS "Students manage own favorites" ON public.favorites;
CREATE POLICY "Students manage own favorites" ON public.favorites
    FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access on favorites" ON public.favorites;
CREATE POLICY "Admins have full access on favorites" ON public.favorites
    FOR ALL USING (public.is_admin());

-- --- CHAT SESSIONS & MESSAGES ---
DROP POLICY IF EXISTS "Students manage own chats" ON public.chat_sessions;
CREATE POLICY "Students manage own chats" ON public.chat_sessions
    FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access on chat_sessions" ON public.chat_sessions;
CREATE POLICY "Admins have full access on chat_sessions" ON public.chat_sessions
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students manage own messages" ON public.messages;
CREATE POLICY "Students manage own messages" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id AND s.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins have full access on messages" ON public.messages;
CREATE POLICY "Admins have full access on messages" ON public.messages
    FOR ALL USING (public.is_admin());

-- --- NOTIFICATIONS ---
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and system can insert notifications" ON public.notifications;
CREATE POLICY "Users and system can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

-- --- SYSTEM SETTINGS ---
DROP POLICY IF EXISTS "Allow public read access to system_settings" ON public.system_settings;
CREATE POLICY "Allow public read access to system_settings" ON public.system_settings
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow admins to manage system_settings" ON public.system_settings;
CREATE POLICY "Allow admins to manage system_settings" ON public.system_settings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- APP STATS ---
DROP POLICY IF EXISTS "Public read app_stats" ON public.app_stats;
CREATE POLICY "Public read app_stats" ON public.app_stats
    FOR SELECT TO anon, authenticated USING (true);

-- --- DEMO REQUESTS ---
DROP POLICY IF EXISTS "Public can submit demo requests" ON public.demo_requests;
CREATE POLICY "Public can submit demo requests" ON public.demo_requests
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to demo requests" ON public.demo_requests;
CREATE POLICY "Admins full access to demo requests" ON public.demo_requests
    FOR ALL TO authenticated USING (public.is_admin());

-- --- SUBSCRIPTIONS ---
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users insert own subscriptions" ON public.subscriptions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users update own subscriptions" ON public.subscriptions
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access on subscriptions" ON public.subscriptions;
CREATE POLICY "Admins have full access on subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin());

-- --- USER LOGS ---
DROP POLICY IF EXISTS "Users view own logs" ON public.user_logs;
CREATE POLICY "Users view own logs" ON public.user_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own logs" ON public.user_logs;
CREATE POLICY "Users insert own logs" ON public.user_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access on user_logs" ON public.user_logs;
CREATE POLICY "Admins have full access on user_logs" ON public.user_logs
    FOR ALL TO authenticated USING (public.is_admin());

-- --- USER MONTHLY PROMPTS ---
DROP POLICY IF EXISTS "Users view own prompt counts" ON public.user_monthly_prompts;
CREATE POLICY "Users view own prompt counts" ON public.user_monthly_prompts
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all prompt counts" ON public.user_monthly_prompts;
CREATE POLICY "Admins view all prompt counts" ON public.user_monthly_prompts
    FOR ALL TO authenticated USING (public.is_admin());


-- =========================================================================
-- 21. APP USER COUNT AUTO-REFRESH TRIGGER
-- =========================================================================
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

DROP TRIGGER IF EXISTS trg_refresh_user_count ON public.profiles;
CREATE TRIGGER trg_refresh_user_count
  AFTER INSERT OR DELETE
  ON public.profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_user_count();


-- =========================================================================
-- 22. OPTIMIZING PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_understanding ON public.student_profiles(student_id, understanding_level);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_student ON public.classroom_students(student_id);
CREATE INDEX IF NOT EXISTS idx_materials_classroom ON public.materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_quiz ON public.materials(quiz_id);
CREATE INDEX IF NOT EXISTS idx_materials_pinned ON public.materials(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_material_id ON public.quizzes(material_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_student ON public.notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON public.notes(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_shares_note ON public.note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_recipient ON public.note_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_note_shares_email ON public.note_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_favorites_student ON public.favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_student ON public.chat_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON public.demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_logs_user ON public.user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_action ON public.user_logs(action_type);


-- =========================================================================
-- 23. SUPABASE STORAGE BUCKETS AND POLICIES
-- =========================================================================
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

DROP POLICY IF EXISTS "Anyone can read public avatars" ON storage.objects;
CREATE POLICY "Anyone can read public avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users manage own avatar objects" ON storage.objects;
CREATE POLICY "Users manage own avatar objects" ON storage.objects
    FOR ALL USING (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    ) WITH CHECK (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Authenticated users read study files" ON storage.objects;
CREATE POLICY "Authenticated users read study files" ON storage.objects
    FOR SELECT USING (bucket_id = 'study-files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users manage own study files" ON storage.objects;
CREATE POLICY "Users manage own study files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]
    ) WITH CHECK (
        bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]
    );
