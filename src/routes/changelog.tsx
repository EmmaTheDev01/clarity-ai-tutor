import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/changelog")({
  head: () => ({ meta: [{ title: "System Changelog — purelearn.ai" }] }),
  component: ChangelogPage,
});

function ChangelogPage() {
  const releases = [
    {
      version: "v1.3.0",
      date: "July 2026",
      title: "UI/UX Enhancements & Google OAuth Integration",
      changes: [
        "Implemented automatic Google Profile Avatar capture and synchronization for users signing in via Google.",
        "Redesigned the Contact Us page into a high-contrast 2-tone split layout with a stark white minimalist contact form.",
        "Refactored authentication pages to prominently feature the 'Continue with Google' button above email login forms.",
        "Replaced simple text headers in static pages with a sleek implementation of the main application logo.",
        "Standardized logo proportions globally across the homepage, headers, footers, and authentication screens.",
      ],
    },
    {
      version: "v1.2.0",
      date: "July 2026",
      title: "Interactive Classrooms & LaTeX block rendering",
      changes: [
        "Enabled double dollar sign $$ block LaTeX formatting in notes & chat libraries.",
        "Implemented strict Admin verification workflows for Educator profiles.",
        "Added ADHD, Dyslexia, and Sensory Low-Stimulus cognitive adjustment modes.",
        "Created daily study streak XP multiplier scores (+2x XP) and badges.",
        "Implemented context attachments inside escalated study notes.",
      ],
    },
    {
      version: "v1.1.0",
      date: "June 2026",
      title: "Isolated Database & Digital Notes",
      changes: [
        "Created isolated digital note-taking panels with automatic Markdown-to-HTML rendering.",
        "Added student-to-student note sharing invites and secure read-only permission states.",
        "Patched security vulnerabilities including Notes XSS sanitize filters.",
        "Bound Socratic quiz loops directly to target study materials instead of profile histories.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="purelearn.ai Logo" className="h-11 w-auto sm:h-12" />
          </Link>
          <Link to="/auth/sign-in" className="text-xs font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            System Changelog
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Stay up to date with updates and security patches deployed to purelearn.ai.
          </p>
        </div>

        {/* Release Timeline */}
        <div className="space-y-12">
          {releases.map((release) => (
            <div key={release.version} className="relative pl-8 border-l border-border/80">
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-1.5 h-4.5 w-4.5 rounded-full border border-primary/30 bg-background flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>

              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {release.version}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">{release.date}</span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-4">{release.title}</h3>

              <Card className="p-6 bg-elevated/10 border border-border/50 rounded-2xl">
                <ul className="space-y-3.5 text-xs text-muted-foreground">
                  {release.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <BookmarkCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
