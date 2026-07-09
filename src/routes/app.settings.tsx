import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Divider, Input, Label } from "@/components/ui-kit";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — tutor.vigilance.rw" }] }),
  component: SettingsPage,
});

const sections = ["Profile", "Preferences", "Plan", "Danger zone"] as const;

function SettingsPage() {
  const [section, setSection] = useState<(typeof sections)[number]>("Profile");
  return (
    <AppShell title="Settings">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-md px-3 py-2 text-left text-sm transition ${
                section === s
                  ? "bg-elevated font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div>
          {section === "Profile" && <ProfileSection />}
          {section === "Preferences" && <PreferencesSection />}
          {section === "Plan" && <PlanSection />}
          {section === "Danger zone" && <DangerSection />}
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Divider />
      <div className="mt-6 space-y-5">{children}</div>
    </Card>
  );
}

function ProfileSection() {
  return (
    <Section title="Profile" description="How you appear across tutor.vigilance.rw.">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-elevated text-lg font-semibold">
          AJ
        </div>
        <div>
          <Button variant="outline" size="sm">Upload avatar</Button>
          <p className="mt-2 text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" defaultValue="Alex Johnson" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="alex@school.edu" />
        </div>
      </div>

      <div>
        <Label>Role</Label>
        <div className="grid grid-cols-2 gap-2 md:max-w-sm">
          {["Student", "Educator"].map((r) => (
            <button
              key={r}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                r === "Student"
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button>Save changes</Button>
      </div>
    </Section>
  );
}

function PreferencesSection() {
  return (
    <Section title="Preferences" description="Tune how the AI tutor works for you.">
      {[
        { k: "Cite sources by default", v: "Always attach citations to answers." },
        { k: "Auto-generate summaries", v: "Summarize new uploads on ingestion." },
        { k: "Email me weekly progress", v: "A short recap every Sunday." },
      ].map((p, i) => (
        <div key={p.k} className={`flex items-center justify-between gap-4 ${i > 0 ? "border-t border-border pt-5" : ""}`}>
          <div>
            <div className="text-sm font-medium">{p.k}</div>
            <div className="text-xs text-muted-foreground">{p.v}</div>
          </div>
          <Toggle defaultOn={i !== 2} />
        </div>
      ))}
    </Section>
  );
}

function PlanSection() {
  return (
    <Section title="Plan" description="You are on the Free plan.">
      <div className="rounded-md border border-border bg-elevated p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Free</div>
            <div className="mt-1 text-xs text-muted-foreground">
              50 daily queries · 5 uploads / day · basic quizzes
            </div>
          </div>
          <div className="text-2xl font-semibold">$0</div>
        </div>
      </div>
      <div className="rounded-md border border-foreground p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Pro</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Unlimited queries · unlimited uploads · advanced quizzes & flashcards
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">$12</div>
            <div className="text-xs text-muted-foreground">/month</div>
          </div>
        </div>
        <Button className="mt-4 w-full">Upgrade to Pro</Button>
      </div>
    </Section>
  );
}

function DangerSection() {
  return (
    <Section title="Danger zone" description="Irreversible account actions.">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Sign out of all sessions</div>
          <div className="text-xs text-muted-foreground">Ends every active session across devices.</div>
        </div>
        <Button variant="outline" size="sm">Sign out</Button>
      </div>
      <Divider />
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Delete account</div>
          <div className="text-xs text-muted-foreground">Permanently erase your data.</div>
        </div>
        <Link
          to="/auth/sign-in"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Delete
        </Link>
      </div>
    </Section>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border border-border transition ${
        on ? "bg-primary" : "bg-background"
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full transition ${
          on ? "left-6 bg-primary-foreground" : "left-0.5 bg-foreground"
        }`}
      />
    </button>
  );
}
