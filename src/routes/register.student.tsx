import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";

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
  const [isRegistering, setIsRegistering] = useState(false);

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
        await supabase.from("profiles").insert({
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
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isRegistering}>
          {isRegistering ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </AuthShell>
  );
}
