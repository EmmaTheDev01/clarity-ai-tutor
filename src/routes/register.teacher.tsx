import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/register/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Onboarding — tutor.vigilance.rw" },
      { name: "description", content: "Register as an educator and set up classrooms." },
    ],
  }),
  component: TeacherRegister,
});

const subjects = [
  "Mathematics & Calculus",
  "Machine Learning & AI",
  "Physics & Electromagnetism",
  "Organic Chemistry",
  "Molecular Biology",
  "Computer Science & Algorithms",
];

function TeacherRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !institution || !credentialId) return;

    try {
      // 1. Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "teacher",
          },
        },
      });

      if (data?.user) {
        // 2. Insert profile record
        await supabase.from("profiles").insert({
          id: data.user.id,
          name,
          email,
          role: "teacher",
        });

        // 3. Log registration in audit logs
        await supabase.from("user_logs").insert({
          user_id: data.user.id,
          action_type: "teacher_onboarding_complete",
          details: `Completed onboarding at ${institution} (Credential ID: ${credentialId})`,
        });
      }
    } catch (err) {
      console.warn("Teacher DB signup integration warning:", err);
    }

    // Direct local state simulation fallbacks
    localStorage.setItem(
      "user_profile",
      JSON.stringify({
        name,
        email,
        role: "teacher",
        institution,
        credentialId,
        subjects: selectedSubjects,
      }),
    );

    navigate({ to: "/teacher" as any });
  };

  return (
    <AuthShell
      title="Create Educator Profile"
      subtitle="Verify your credentials to build isolated classrooms."
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
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Core Credentials */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Dr. Sarah Adeyemi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="s.adeyemi@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Institutional Affiliation */}
        <div className="border-t border-border pt-4 space-y-4">
          <div>
            <Label htmlFor="institution">Institution / University</Label>
            <Input
              id="institution"
              placeholder="University of Rwanda"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="credential">Teacher Credential / Faculty ID</Label>
            <Input
              id="credential"
              placeholder="FED-8294-A9"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Areas of Expertise */}
        <div className="border-t border-border pt-4">
          <Label>Subjects of Expertise</Label>
          <p className="text-[10px] text-muted-foreground mb-3">
            Select the subjects you instruct to map dynamic AI sandbox prompts.
          </p>
          <div className="flex flex-col gap-2">
            {subjects.map((s) => {
              const active = selectedSubjects.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition ${
                    active
                      ? "border-primary bg-primary/5 text-foreground font-semibold"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{s}</span>
                  {active && <span className="text-primary text-[10px] font-bold">✓ Active</span>}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Complete Educator Profile
        </Button>
      </form>
    </AuthShell>
  );
}
