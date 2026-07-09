import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";

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
  const [role, setRole] = useState<"student" | "educator">("student");
  return (
    <AuthShell
      title="Create your account."
      subtitle="Free forever. Upgrade any time."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-medium text-foreground underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Alex Johnson" autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@school.edu" autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" />
        </div>
        <div>
          <Label>I am a</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["student", "educator"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-md border px-3 py-2 text-sm capitalize transition ${
                  role === r
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
