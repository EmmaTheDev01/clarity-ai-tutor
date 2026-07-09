-- Supabase Schema for Clarity AI Tutor (Adaptive Cognitive Environment)
-- Matches roles, classroom isolation, automated notes, quizzes, confidence telemetry, and favorites.

-- 1. Enums
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE cognitive_profile_tag AS ENUM ('standard', 'adhd', 'dyslexia', 'sensory');
CREATE TYPE material_type AS ENUM ('PDF', 'Word', 'Image', 'Slides', 'Audio', 'Video', 'YouTube', 'Link', 'Text', 'File');
CREATE TYPE chat_sender_role AS ENUM ('student', 'assistant', 'teacher', 'admin');

-- 2. Profiles (Extends Supabase Auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Student Profiles (Added Education & Grade level attributes for AI customization)
CREATE TABLE public.student_profiles (
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    academic_focus TEXT[],
    education_level TEXT DEFAULT 'Undergraduate' NOT NULL, -- 'High School', 'Undergraduate', 'Postgraduate'
    grade_level TEXT, -- 'Freshman', '3.8 GPA', '11th Grade'
    language_preference TEXT DEFAULT 'en' NOT NULL,
    cognitive_profile cognitive_profile_tag NOT NULL DEFAULT 'standard',
    visual_spacing_preference TEXT DEFAULT 'normal' NOT NULL, -- 'normal', 'wide', 'loose'
    pastel_filter_color TEXT, -- Sepia, pastel yellow, cream hues
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Classrooms (Managed by Teachers)
CREATE TABLE public.classrooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- 5. Classroom Students Junction (Isolate Students in Teachers' Classrooms)
CREATE TABLE public.classroom_students (
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (classroom_id, student_id)
);

ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

-- 6. Quizzes
CREATE TABLE public.quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    questions JSONB NOT NULL, -- Array of objects: { question: text, options: text[], correctIndex: int }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- 7. Materials (Lessons uploaded by teachers or students)
CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type material_type NOT NULL,
    url TEXT,
    content TEXT, -- Extract raw text for LLM embedding
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT,
    mime_type TEXT,
    file_size BIGINT,
    source_kind TEXT CHECK (source_kind IN ('file', 'link', 'text')) DEFAULT 'file' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 8. Quiz Attempts (Performance + Self-Rated Confidence loops)
CREATE TABLE public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC(5,2) NOT NULL, -- Percentage (e.g. 85.50)
    confidence_level INT CHECK (confidence_level BETWEEN 1 AND 5) NOT NULL, -- Correlate score vs confidence
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 9. Digital Notebook (Automated and Manual Notes)
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT,
    is_ai_generated BOOLEAN DEFAULT false NOT NULL,
    is_starred BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 10. Favorites (Bookmarks for materials, flashcards, notes)
CREATE TABLE public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT CHECK (item_type IN ('material', 'flashcard', 'note')) NOT NULL,
    item_id UUID NOT NULL,
    bookmarked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, item_type, item_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 11. Chat Sessions
CREATE TABLE public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    active_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- 12. Chat Messages (ENCRYPTED STORAGE REQUIREMENT)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    sender_role chat_sender_role NOT NULL,
    encrypted_content TEXT NOT NULL, -- Message text encrypted in DB
    encryption_iv TEXT NOT NULL, -- Initialisation vector for crypto key alignment
    citation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 13. Subscriptions (Reporting plan status to Admin dashboard)
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL DEFAULT 'Free', -- 'Free', 'Pro', 'Enterprise'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'trialing'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 14. Activity Audit Logs (Log all user logins and dashboard actions)
CREATE TABLE public.user_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'onboarding_complete', 'quiz_submission', 'flashcard_export'
    details TEXT, -- JSON summary of changes, metadata
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles: Authenticated users can view profiles. Only own profile editable.
CREATE POLICY "Users can view any profile" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Student Profiles: Students view/edit their own. Teachers can view students in their classrooms.
CREATE POLICY "Students view/update own profile" ON public.student_profiles
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view classroom students profiles" ON public.student_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_students cs
            JOIN public.classrooms c ON cs.classroom_id = c.id
            WHERE cs.student_id = student_profiles.student_id AND c.teacher_id = auth.uid()
        )
    );

-- Classrooms: Only managing teacher or enrolled students can view.
CREATE POLICY "Teachers manage own classrooms" ON public.classrooms
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students view enrolled classrooms" ON public.classrooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_students cs
            WHERE cs.classroom_id = classrooms.id AND cs.student_id = auth.uid()
        )
    );

-- Classroom Students: Class teachers can manage. Students view own joins.
CREATE POLICY "Teachers manage classroom enrolments" ON public.classroom_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students view own enrolments" ON public.classroom_students
    FOR SELECT USING (student_id = auth.uid());

-- Quizzes: Teacher owner has full access. Classroom students can read.
CREATE POLICY "Teachers manage own quizzes" ON public.quizzes
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students view classroom quizzes" ON public.quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.materials m
            JOIN public.classroom_students cs ON m.classroom_id = cs.classroom_id
            WHERE m.quiz_id = quizzes.id AND cs.student_id = auth.uid()
        )
    );

-- Materials: Classroom teachers manage. Classroom students view.
CREATE POLICY "Teachers manage classroom materials" ON public.materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Users manage own uploaded materials" ON public.materials
    FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Students view classroom materials" ON public.materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_students cs
            WHERE cs.classroom_id = materials.classroom_id AND cs.student_id = auth.uid()
        )
    );

-- Quiz Attempts: Students view own. Teachers view own student attempts.
CREATE POLICY "Students manage own attempts" ON public.quiz_attempts
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers view student attempts" ON public.quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_id AND q.teacher_id = auth.uid()
        )
    );

-- Notes: Exclusive to student author.
CREATE POLICY "Students manage own notes" ON public.notes
    FOR ALL USING (student_id = auth.uid());

-- Favorites: Exclusive to student author.
CREATE POLICY "Students manage own favorites" ON public.favorites
    FOR ALL USING (student_id = auth.uid());

-- Chats & Messages: Exclusive to student author.
CREATE POLICY "Students manage own chats" ON public.chat_sessions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students manage own messages" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id AND s.student_id = auth.uid()
        )
    );

-- Subscriptions: Users view own plan.
CREATE POLICY "Users view own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- User Logs: Users view own activity logs.
CREATE POLICY "Users view own logs" ON public.user_logs
    FOR SELECT USING (user_id = auth.uid());


-- =========================================================================
-- GLOBAL ADMIN BYPASS OVERRIDES (RLS Policies for Admins)
-- =========================================================================

CREATE POLICY "Admins have full access on profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on student_profiles" ON public.student_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on classrooms" ON public.classrooms FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on classroom_students" ON public.classroom_students FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on quizzes" ON public.quizzes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on materials" ON public.materials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on quiz_attempts" ON public.quiz_attempts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on notes" ON public.notes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on favorites" ON public.favorites FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on chat_sessions" ON public.chat_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on messages" ON public.messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on subscriptions" ON public.subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins have full access on user_logs" ON public.user_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- =========================================================================
-- OPTIMIZING INDEXES FOR SPEED AND ISOLATION
-- =========================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX idx_classroom_students_student ON public.classroom_students(student_id);
CREATE INDEX idx_materials_classroom ON public.materials(classroom_id);
CREATE INDEX idx_materials_uploaded_by ON public.materials(uploaded_by);
CREATE INDEX idx_materials_quiz ON public.materials(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX idx_notes_student ON public.notes(student_id);
CREATE INDEX idx_favorites_student ON public.favorites(student_id);
CREATE INDEX idx_chat_sessions_student ON public.chat_sessions(student_id);
CREATE INDEX idx_messages_session ON public.messages(session_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_user_logs_user ON public.user_logs(user_id);
CREATE INDEX idx_user_logs_action ON public.user_logs(action_type);


-- =========================================================================
-- SUPABASE STORAGE BUCKETS AND POLICIES
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

CREATE POLICY "Anyone can read public avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users manage own avatar objects" ON storage.objects
    FOR ALL USING (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    ) WITH CHECK (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Authenticated users read study files" ON storage.objects
    FOR SELECT USING (bucket_id = 'study-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users manage own study files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]
    ) WITH CHECK (
        bucket_id = 'study-files' AND auth.uid()::text = (storage.foldername(name))[1]
    );
