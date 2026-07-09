import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button, Input, Label } from "@/components/ui-kit";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — tutor.vigilance.rw" }] }),
  component: Forgot,
});

function Forgot() {
  return (
    <AuthShell
      title="Reset your password."
      subtitle="We'll email you a secure link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/auth/sign-in" className="font-medium text-foreground underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@school.edu" autoComplete="email" />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
