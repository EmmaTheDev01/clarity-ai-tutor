import { Link } from "@tanstack/react-router";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Upload, Brain, FileCheck2, Sparkles } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Grounded Multimodal Ingestion",
      tagline: "Zero Hallucinations",
      description:
        "Drop in 200-page textbooks, lecture audio recordings, YouTube links, or slide decks. PureLearn parses concepts into grounded vector nodes with exact source citations.",
      icon: Upload,
      preview: (
        <div className="rounded-xl border border-border bg-background/70 p-4 space-y-2.5 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
            <span className="font-mono text-[10px]">INGESTION PIPELINE</span>
            <span className="text-emerald-500 font-semibold text-[10px] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Grounded
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">PDF</span>
            <span>Neuroscience_Principles_Ch4.pdf</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
              #SynapticPlasticity
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
              #LTP_Induction
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
              #DendriticSpines
            </span>
          </div>
        </div>
      ),
    },
    {
      step: "02",
      title: "Adaptive Socratic Dialogue",
      tagline: "Cognitive Scaffolding",
      description:
        "Instead of handing you passive answers, PureLearn asks targeted probing questions. It adapts pacing to your cognitive profile—supporting ADHD focus and dyslexia spacing.",
      icon: Brain,
      preview: (
        <div className="rounded-xl border border-border bg-background/70 p-4 space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-border pb-1.5">
            <span className="font-mono">SOCRATIC INQUIRY</span>
            <span className="text-primary font-semibold">Active Recall</span>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 text-[11px] text-foreground">
            <p className="font-semibold text-primary mb-1 text-[10px] uppercase font-mono">Tutor Inquiry</p>
            "Why does calcium entry through NMDA receptors trigger spine enlargement, but not through AMPA receptors?"
          </div>
          <div className="rounded-lg bg-muted/60 p-2 text-[11px] text-muted-foreground">
            <p className="font-semibold text-foreground text-[10px] mb-0.5">Learner Response</p>
            "Because AMPA receptors are blocked by magnesium at rest?"
          </div>
        </div>
      ),
    },
    {
      step: "03",
      title: "Precision Mastery & Exam Synthesis",
      tagline: "Continuous Telemetry",
      description:
        "Generate custom quizzes calibrated directly to your weak points. Track mastery curves, review step-by-step rationales, and close gaps before exam day.",
      icon: FileCheck2,
      preview: (
        <div className="rounded-xl border border-border bg-background/70 p-4 space-y-3 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-1.5">
            <span className="font-mono text-[10px]">MASTERY TELEMETRY</span>
            <span className="text-primary font-bold text-xs">88% Ready</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-foreground font-medium">Cellular Electrophysiology</span>
              <span className="text-emerald-500 font-bold">94%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-foreground font-medium">Receptor Subunit Kinetics</span>
              <span className="text-amber-500 font-bold">62%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[62%]" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="border-t border-border/60 bg-elevated/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal animation="fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              The PureLearn Architecture
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              How PureLearn works.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              A closed-loop cognitive cycle designed to convert static study materials into deep, permanent conceptual mastery.
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <ScrollReveal
              key={s.step}
              animation="crazy-reveal"
              delay={i * 180}
              className="h-full"
            >
              <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl group">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-muted-foreground/50 group-hover:text-primary transition-colors">
                      {s.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                      <s.icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  </div>

                  <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-wider text-primary">
                    {s.tagline}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-foreground tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>

                <div className="mt-8">
                  {s.preview}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Institutional Demo Callout Banner */}
        <ScrollReveal animation="fade-up" delay={200} className="mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border bg-elevated p-8 sm:p-10 shadow-sm">
            <div className="text-center sm:text-left">
              <h4 className="text-xl font-bold text-foreground">
                Deploying PureLearn for your school or classroom?
              </h4>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
                Experience institutional gradebooks, multi-student cognitive isolation, and automated curriculum quiz generation with a personalized walk-through.
              </p>
            </div>
            <Link
              to="/request-demo"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Request Live Demo
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
