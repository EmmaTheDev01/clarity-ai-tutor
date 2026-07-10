import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create your account — tutor.vigilance.rw" },
      { name: "description", content: "Create a free tutor.vigilance.rw account." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigate({ to: "/app" as any });
      }
    };
    checkSession();
  }, [navigate]);
  return (
    <AuthShell
      title="Join Clarity AI Tutor."
      subtitle="Select your account type to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/auth/sign-in"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <Link
          to="/register/student"
          className="block rounded-lg border border-border bg-elevated/40 p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
        >
          <h3 className="text-sm font-semibold text-foreground">Student account</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Onboard your study focuses, personalize visual layouts, and select neurodivergent
            profiles (ADHD, Dyslexia, Sensory support).
          </p>
        </Link>

        <Link
          to="/register/teacher"
          className="block rounded-lg border border-border bg-elevated/40 p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
        >
          <h3 className="text-sm font-semibold text-foreground">Teacher or educator account</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Register your institution, configure class syllabi, upload course materials with quiz
            requirements, and train custom AI rules.
          </p>
        </Link>
      </div>
    </AuthShell>
  );
}
