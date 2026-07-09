import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";

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
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@school.edu" autoComplete="email" />
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
          <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
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

      <Button variant="outline" size="lg" className="w-full">
        Continue with Google
      </Button>
    </AuthShell>
  );
}
