import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/register/student")({
  head: () => ({
    meta: [
      { title: "Student Registration — tutor.vigilance.rw" },
      { name: "description", content: "Create your student account." },
    ],
  }),
  component: StudentRegister,
});

function StudentRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/app",
        },
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Google login redirect failed, navigating directly:", err);
      navigate({ to: "/app" as any });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsRegistering(true);
    try {
      // 1. Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "student",
          },
        },
      });

      if (error) {
        alert(`Registration failed: ${error.message}`);
        setIsRegistering(false);
        return;
      }

      if (data?.user) {
        // 2. Insert profile record
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name,
          email,
          role: "student",
        });

        // Log registration in audit log database
        try {
          await supabase.from("user_logs").insert({
            user_id: data.user.id,
            action_type: "student_registered",
            details: `Registered email: ${email}`,
          });
        } catch (logErr) {
          console.warn("Log writing warning:", logErr);
        }

        alert("Registration successful! Please sign in with your credentials.");
        navigate({ to: "/auth/sign-in" as any });
      }
    } catch (err) {
      console.error("Student DB signup error:", err);
      alert("Registration error encountered.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <AuthShell
      title="Create Student Account"
      subtitle="Register now to access Socratic STEM guidance."
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isRegistering}>
          {isRegistering ? "Creating account..." : "Sign Up"}
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
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleLogin}
      >
        Sign up with Google
      </Button>
    </AuthShell>
  );
}
