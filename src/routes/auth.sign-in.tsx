import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — tutor.vigilance.rw" },
      { name: "description", content: "Sign in to your tutor.vigilance.rw account." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      // 1. Supabase credentials check
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(`Authentication failed: ${error.message}`);
        return;
      }

      let role = "student";
      
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", data.user.id)
          .single();
        if (profile) role = profile.role;

        // Log the login audit action in DB
        try {
          await supabase.from("user_logs").insert({
            user_id: data.user.id,
            action_type: "user_login",
            details: `Signed in successfully as ${role}`,
          });
        } catch (logErr) {
          console.warn("Could not log user action in DB:", logErr);
        }

        // Save local profile settings sync
        localStorage.setItem("user_profile", JSON.stringify({
          name: profile?.name || "User",
          email: data.user.email,
          role: role,
        }));
      } else {
        alert("Authentication failed: User details not returned.");
        return;
      }

      // Sync local logs
      const currentLogs = JSON.parse(localStorage.getItem("user_logs") || "[]");
      currentLogs.push({
        action: "user_login",
        details: `Signed in successfully as ${role} (Email: ${email})`,
        time: new Date().toISOString(),
      });
      localStorage.setItem("user_logs", JSON.stringify(currentLogs));

      // 2. Gateway redirection
      if (role === "admin") {
        navigate({ to: "/admin" as any });
      } else if (role === "teacher") {
        navigate({ to: "/teacher" as any });
      } else {
        navigate({ to: "/app" as any });
      }
    } catch (err) {
      console.warn("Auth routing error:", err);
      alert("Authentication error encountered.");
    }
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to continue your learning."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/auth/sign-up" className="font-medium text-foreground underline underline-offset-2">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@school.edu"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="mb-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => navigate({ to: "/app" as any })}
      >
        Continue with Google
      </Button>
    </AuthShell>
  );
}
