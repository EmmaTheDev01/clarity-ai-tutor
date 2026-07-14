import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in to Clarity — tutor.vigilance.rw" },
      { name: "description", content: "Sign in to Clarity AI Tutor." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigate({ to: "/app" as any });
      }
    };
    checkSession();
  }, [navigate]);

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
      toast.error("Google sign-in failed. Please try again.");
      console.warn("Google login redirect failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // 1. Supabase credentials check
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Sign-in failed: ${error.message}`);
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
        localStorage.setItem(
          "user_profile",
          JSON.stringify({
            name: profile?.name || "User",
            email: data.user.email,
            role: role,
          }),
        );
      } else {
        toast.error("Sign-in failed: user details not returned.");
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

      toast.success(`Welcome back!`);

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
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to continue your learning."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/auth/sign-up"
            className="font-medium text-foreground underline underline-offset-2"
          >
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
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
        Continue with Google
      </Button>
    </AuthShell>
  );
}
