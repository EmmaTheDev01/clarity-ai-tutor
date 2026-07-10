-- Fix Row Level Security infinite recursion on profiles table for admin checks.
-- Run this in your Supabase SQL Editor to resolve the status 500 errors on Profiles/Materials queries.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the profiles admin policy
DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;
CREATE POLICY "Admins have full access on profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Recreate the student_profiles admin policy
DROP POLICY IF EXISTS "Admins have full access on student_profiles" ON public.student_profiles;
CREATE POLICY "Admins have full access on student_profiles" ON public.student_profiles
    FOR ALL USING (public.is_admin());

-- Recreate the classrooms admin policy
DROP POLICY IF EXISTS "Admins have full access on classrooms" ON public.classrooms;
CREATE POLICY "Admins have full access on classrooms" ON public.classrooms
    FOR ALL USING (public.is_admin());

-- Recreate the classroom_students admin policy
DROP POLICY IF EXISTS "Admins have full access on classroom_students" ON public.classroom_students;
CREATE POLICY "Admins have full access on classroom_students" ON public.classroom_students
    FOR ALL USING (public.is_admin());

-- Recreate the quizzes admin policy
DROP POLICY IF EXISTS "Admins have full access on quizzes" ON public.quizzes;
CREATE POLICY "Admins have full access on quizzes" ON public.quizzes
    FOR ALL USING (public.is_admin());

-- Recreate the materials admin policy
DROP POLICY IF EXISTS "Admins have full access on materials" ON public.materials;
CREATE POLICY "Admins have full access on materials" ON public.materials
    FOR ALL USING (public.is_admin());

-- Recreate the quiz_attempts admin policy
DROP POLICY IF EXISTS "Admins have full access on quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Admins have full access on quiz_attempts" ON public.quiz_attempts
    FOR ALL USING (public.is_admin());

-- Recreate the notes admin policy
DROP POLICY IF EXISTS "Admins have full access on notes" ON public.notes;
CREATE POLICY "Admins have full access on notes" ON public.notes
    FOR ALL USING (public.is_admin());

-- Recreate the favorites admin policy
DROP POLICY IF EXISTS "Admins have full access on favorites" ON public.favorites;
CREATE POLICY "Admins have full access on favorites" ON public.favorites
    FOR ALL USING (public.is_admin());

-- Recreate the chat_sessions admin policy
DROP POLICY IF EXISTS "Admins have full access on chat_sessions" ON public.chat_sessions;
CREATE POLICY "Admins have full access on chat_sessions" ON public.chat_sessions
    FOR ALL USING (public.is_admin());

-- Recreate the messages admin policy
DROP POLICY IF EXISTS "Admins have full access on messages" ON public.messages;
CREATE POLICY "Admins have full access on messages" ON public.messages
    FOR ALL USING (public.is_admin());

-- Recreate the subscriptions admin policy
DROP POLICY IF EXISTS "Admins have full access on subscriptions" ON public.subscriptions;
CREATE POLICY "Admins have full access on subscriptions" ON public.subscriptions
    FOR ALL USING (public.is_admin());

-- Recreate the user_logs admin policy
DROP POLICY IF EXISTS "Admins have full access on user_logs" ON public.user_logs;
CREATE POLICY "Admins have full access on user_logs" ON public.user_logs
    FOR ALL USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
