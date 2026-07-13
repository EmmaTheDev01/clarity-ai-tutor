import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community Hub — purelearn.ai" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-1.5 font-serif">

            purelearn.ai
          </Link>
          <Link to="/auth/sign-up" className="text-sm font-bold px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground transition">
            Join Community
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            Learner & Educator Community
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Collaborate on Socratic learning strategies, share customized focus templates, and coordinate verify credentials.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="p-8 bg-elevated/10 border border-border/50 rounded-2xl flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-black shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-base font-bold text-foreground mb-1">purelearn Discord Server</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Interact directly with developers, submit cognitive accessibility requests, and share LaTeX formatting workflows.
              </p>
            </div>
            <a href="#" className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-bold transition flex items-center gap-1.5 shrink-0">
              Connect Discord
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card>

          <Card className="p-8 bg-elevated/10 border border-border/50 rounded-2xl flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-black shrink-0">
              <Brain className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-base font-bold text-foreground mb-1">Educator Masterclass</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Online forums for verifying academic institutions, tuning AI tutor rules, and establishing student privacy boundaries.
              </p>
            </div>
            <a href="#" className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-bold transition flex items-center gap-1.5 shrink-0">
              Browse Classes
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
