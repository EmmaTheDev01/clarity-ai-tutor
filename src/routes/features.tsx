import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Sparkles, BookOpen, Layers, Zap } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/features")({
  head: () => ({ meta: [{ title: "Core Features — purelearn.ai" }] }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="purelearn.ai Logo" className="h-11 w-auto sm:h-12" />
          </Link>
          <Link to="/auth/sign-up" className="text-sm font-bold px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground transition">
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
            Platform Capabilities
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent mt-4">
            Custom-Built for Cognitive Diversity
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Discover a tutor platform that adapts directly to your focus parameters. No generic answers, just true conceptual mastery.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch mb-16">
          <Card className="p-8 flex flex-col bg-elevated/15 border border-border/50 rounded-2xl">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Socratic STEM Coaching</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Our AI acts as an educator. Instead of printing homework solutions, it detects underlying conceptual gaps, providing step-by-step guidance and structured hints to help you solve equations yourself.
            </p>
          </Card>

          <Card className="p-8 flex flex-col bg-elevated/15 border border-border/50 rounded-2xl">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Cognitive Accommodation Modes</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Switch layouts instantly. Whether using Bionic Reading to anchor attention for ADHD, rendering readable high-contrast OpenDyslexic spacing, or engaging low-stimulus warm sensory palettes, we prioritize accessibility.
            </p>
          </Card>

          <Card className="p-8 flex flex-col bg-elevated/15 border border-border/50 rounded-2xl">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Premium LaTeX & Code Rendering</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              View mathematical expressions and algorithms with perfect clarity. Displayed equations block layouts support double dollar sign LaTeX blocks, and pre-formatted ASCII boxes keep diagrams properly aligned.
            </p>
          </Card>

          <Card className="p-8 flex flex-col bg-elevated/15 border border-border/50 rounded-2xl">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Isolated Educator Classrooms</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Educator verification enables teachers to build sandboxes, upload syllabi, control prompting guidelines, and review student progress in full safety compliance.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
