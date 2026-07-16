import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { supabase } from "@/lib/supabase";
import {
  Upload,
  MessageSquare,
  FileCheck2,
  Sparkles,
  Plus,
  Minus,
  ArrowRight,
  Play,
  Briefcase,
  GraduationCap,
  FolderHeart,
  Brain,
} from "lucide-react";
import appMockup from "@/assets/app-mockup.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const APP = "Purelearn.ai";

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigate({ to: "/app" as any });
      }
    };
    checkSession();
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Features />
        <UseCases />
        <AppDownloadCTA />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-background/80 backdrop-blur transition-all duration-200 ${isScrolled ? "border-b border-border shadow-sm" : "border-b border-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Purelearn.ai Logo" className="h-8 w-auto sm:h-10" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/auth/sign-in"
            className="hidden rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth/sign-up"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Get the app
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-24 text-center sm:pb-32 sm:pt-32 md:pt-40">
        <span className="inline-flex items-center gap-3 rounded-full border border-border bg-elevated pl-2 pr-4 py-1.5 text-xs font-medium text-foreground">
          <div className="flex -space-x-2">
            <img
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80"
              alt="User face 1"
            />
            <img
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&h=100&q=80"
              alt="User face 2"
            />
            <img
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
              src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&h=100&q=80"
              alt="User face 3"
            />
            <img
              className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
              src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=100&h=100&q=80"
              alt="User face 4"
            />
          </div>
          <span className="flex items-center gap-1">Loved by 2,000+ learners</span>
        </span>
        <ScrollReveal animation="fade-up" duration={800}>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-7xl">
            An AI tutor <br /> made exactly for you.
          </h1>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" duration={800} delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Turn your notes, documents, and reference materials into interactive chats, summaries,
            and personalized practice exams instantly.
          </p>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" duration={800} delay={200}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth/sign-up"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Start learning — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Play className="h-4 w-4" />
              See the app
            </Link>
          </div>
        </ScrollReveal>

        {/* Video Showcase (shrunk initially, widens on scroll) */}
        <div className="mt-10 w-full video-scroll-widen sm:mt-16">
          <div className="overflow-hidden rounded-lg border border-border bg-elevated shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
            <div className="flex items-center gap-1.5 border-b border-border bg-background px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full border border-border" />
              <span className="h-2.5 w-2.5 rounded-full border border-border" />
              <span className="h-2.5 w-2.5 rounded-full border border-border" />
              <span className="ml-4 text-xs text-muted-foreground">{APP}</span>
            </div>
            <img
              src={appMockup}
              alt="Clarity AI Tutor Workspace showing documents list and interactive AI tutor chat"
              width={1600}
              height={1008}
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Upload,
    title: "Upload any medium",
    body: "Drop in PDFs, long YouTube videos, slide decks, or lecture recordings.",
  },
  {
    icon: Sparkles,
    title: "Understand key points",
    body: "Get clear summaries and quick takeaways from any source in seconds.",
  },
  {
    icon: MessageSquare,
    title: "Chat with an AI tutor",
    body: "Dive deep into complex concepts and get answers tied back to source citations.",
  },
  {
    icon: FileCheck2,
    title: "Generate targeted exams",
    body: "Build custom practice quizzes with full answer breakdowns to track mastery.",
  },
];

function Features() {
  return (
    <section className="">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Save hours. Learn smarter.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Everything you need to turn passive material into active understanding.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
          {features.map((f, i) => (
            <ScrollReveal
              key={f.title}
              animation="crazy-reveal"
              delay={i * 150}
              className="bg-background h-full"
            >
              <div className="p-8 h-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border">
                  <f.icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 text-lg font-medium text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className="bg-elevated/20">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for the way you work.
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 items-stretch lg:grid-cols-12">
          {/* Left Column: 1 Card (Manage projects) taking 5/12 width */}
          <div className="lg:col-span-5 flex flex-col">
            <ScrollReveal animation="crazy-reveal" duration={800} className="h-full flex flex-col">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-elevated p-8 transition-all duration-300 hover:-translate-y-1 hover:border-muted-foreground/30 hover:shadow-lg">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                    <Briefcase className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span className="block mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Manage projects
                  </span>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground leading-tight">
                    Turn briefs and specs into a working knowledge base.
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Upload requirements, meeting notes, and research docs. Ask questions across
                    every file — get answers with exact citations to the source paragraph.
                  </p>
                </div>

                {/* Workspace Files preview */}
                <div className="mt-8 flex flex-col gap-2 rounded-xl bg-background/50 p-4 text-left border border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                    <span>Workspace Files</span>
                    <span className="text-emerald-500 font-medium">3 Grounded</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px]">
                      PDF
                    </span>
                    <span>Product_Requirements_V2.pdf</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px]">
                      DOCX
                    </span>
                    <span>Sprint_Brief_July.docx</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px]">
                      JSON
                    </span>
                    <span>API_Spec_Final.json</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: 2 Cards stacked vertically taking 7/12 width */}
          <div className="lg:col-span-7 flex flex-col gap-8 justify-between">
            {/* Card 2: Study scientific material */}
            <ScrollReveal animation="crazy-reveal" duration={800} delay={100}>
              <div className="flex flex-col md:flex-row gap-6 rounded-2xl border border-border bg-elevated p-8 transition-all duration-300 hover:-translate-y-1 hover:border-muted-foreground/30 hover:shadow-lg">
                <div className="flex-1">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                    <GraduationCap className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span className="block mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Study scientific material
                  </span>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground leading-tight">
                    Master dense papers without re-reading them five times.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Load textbooks, journal articles, and lecture recordings. Generate structured
                    summaries, definitions, and quizzes calibrated to your gaps.
                  </p>
                </div>

                {/* AI Quiz preview widget */}
                <div className="w-full md:w-64 flex flex-col gap-3 rounded-xl bg-background/50 p-4 text-left border border-border shrink-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-1.5">
                    <span>Quiz Preview</span>
                    <span>Linear Algebra</span>
                  </div>
                  <p className="text-[11px] font-semibold text-foreground">
                    Geometric interpretation of determinants:
                  </p>
                  <div className="flex flex-col gap-1">
                    <div className="rounded border border-primary bg-primary/5 px-2 py-1 text-[10px] text-primary font-medium">
                      ✓ Scaling factor of area/volume transformation
                    </div>
                    <div className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground bg-background">
                      ✗ The sum of diagonal eigenvalues
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3: Organize life content */}
            <ScrollReveal animation="crazy-reveal" duration={800} delay={200}>
              <div className="flex flex-col md:flex-row gap-6 rounded-2xl border border-border bg-elevated p-8 transition-all duration-300 hover:-translate-y-1 hover:border-muted-foreground/30 hover:shadow-lg">
                <div className="flex-1">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                    <FolderHeart className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span className="block mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Organize life content
                  </span>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground leading-tight">
                    Make sense of everything you save but never revisit.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Drop in articles, videos, and voice memos. Search by meaning, not keywords, and
                    turn scattered notes into a personal library you actually use.
                  </p>
                </div>

                {/* Voice Memo preview widget */}
                <div className="w-full md:w-64 flex flex-col gap-2.5 rounded-xl bg-background/50 p-4 text-left border border-border shrink-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-1.5">
                    <span>Voice Memo Snippet</span>
                    <span>01:42</span>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-[10px] text-foreground italic">
                    "...need to research whether optimal compute allocation applies to small
                    fine-tunes..."
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                    <span>Research</span>
                    <span>•</span>
                    <span>10m ago</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 shrink-0">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 shrink-0">
    <path d="M5 3.012c-.173 0-.345.04-.5.122-.497.256-.8.745-.8 1.298v15.136c0 .553.303 1.042.8 1.298.155.08.327.122.5.122.21 0 .42-.063.6-.188l13.14-8.866c.4-.27.6-.708.6-1.17 0-.46-.2-.9-.6-1.17L5.6 3.2c-.18-.125-.39-.188-.6-.188z" />
  </svg>
);

function AppDownloadCTA() {
  return (
    <section className="bg-white text-neutral-900 py-24 text-center border-none shadow-none relative">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollReveal animation="crazy-reveal" duration={800}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 border border-neutral-200/50">
            Clarity Anywhere
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-neutral-900 leading-tight">
            Learn on the go. <br className="hidden sm:inline" /> Download the PureLearn app.
          </h2>
          <p className="mt-4 text-sm md:text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            Available on iOS, Android, macOS, and Windows. Sync your documents, highlight citations,
            and review study cards seamlessly across all your devices.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 hover:scale-[1.03] duration-250 active:scale-[0.98]"
            >
              <AppleIcon />
              Download for iOS
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 hover:scale-[1.03] duration-250 active:scale-[0.98]"
            >
              <PlayStoreIcon />
              Download for Android
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "This has become an integral part of my daily learning workflow. It completely changes how I process long video lectures.",
    name: "Jackson Dushime",
    title: "Product Engineer",
  },
  {
    quote:
      "I use this tool to offer my students an alternative channel of engagement for highly complex scientific topics.",
    name: "Leon Ntabomvura",
    title: "Professor, UR",
  },
  {
    quote:
      "The citations back to source material are what sold me. I can trust the answers and go verify them in one click.",
    name: "Amelia Okafor",
    title: "PhD Candidate, Molecular Biology",
  },
  {
    quote:
      "I dropped in a semester of readings and had a study guide by dinner. It's the study partner I never had.",
    name: "Joy Ingabire",
    title: "Law Student",
  },
  {
    quote: "Turned a 3-hour keynote into a 10-minute briefing I could actually share with my team.",
    name: "JB Mukeshimana",
    title: "Strategy Lead",
  },
  {
    quote: "The generated quizzes are shockingly good. They target exactly what I don't know yet.",
    name: "Daniel Weiss",
    title: "Medical Resident",
  },
];

function Testimonials() {
  return (
    <section className="">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trusted by learners everywhere.
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} animation="crazy-reveal" delay={(i % 3) * 150} className="flex">
              <figure className="flex flex-col justify-between rounded-lg border border-border bg-background p-6 w-full">
                <blockquote className="text-base leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4">
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.title}</div>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "What formats are supported?",
    a: "You can seamlessly upload PDF files, plain text documents, YouTube links, slide decks, and audio recordings. More formats are added regularly.",
  },
  {
    q: "Is there a free tier available?",
    a: "Yes. The core setup is free to use with daily allocation limits for document parsing and chat queries. Upgrade any time for higher limits.",
  },
  {
    q: "How accurate are the answers?",
    a: "Every answer links back to the exact source paragraph it was drawn from, so you can verify accuracy in one click before trusting it.",
  },
  {
    q: "Is my data private?",
    a: "Your uploaded materials are only used to power your workspace. We never train shared models on your content.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes — the web app is fully responsive and works on any modern browser, desktop or mobile.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions.
          </h2>
        </div>
        <ScrollReveal animation="crazy-reveal">
          <div className="mt-12 border-t border-border">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="border-b border-border">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-medium text-foreground">{f.q}</span>
                    {isOpen ? (
                      <Minus className="h-4 w-4 shrink-0 text-foreground" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-foreground" />
                    )}
                  </button>
                  <div
                    className={`grid overflow-hidden transition-all duration-300 ${isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                      }`}
                  >
                    <p className="min-h-0 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <ScrollReveal animation="crazy-reveal">
          <div className="rounded-lg border border-border bg-elevated px-8 py-16 text-center">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your smarter study session starts now.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Join 2,000+ learners turning static material into interactive understanding.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Start learning — it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                See the app
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-white via-neutral-50 to-neutral-100/50 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 items-start">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="Purelearn.ai Logo" className="h-10 w-auto" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              An adaptive Socratic learning engine designed for cognitive diversity, visual preference mapping, and conceptual STEM mastery.
            </p>
          </div>
          <FooterCol title="Product" links={["Features", "Pricing", "Changelog"]} />
          <FooterCol title="Company" links={["Community", "Blog", "Contact us"]} />
          <FooterCol title="Legal" links={["Terms & conditions", "Privacy policy", "GDPR"]} />
        </div>
        
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/80 pt-8 sm:flex-row">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {APP}. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground/60">
              Adapting education loops, note syntheses, and quizzes dynamically.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
            <span className="hover:text-primary transition cursor-pointer">Twitter</span>
            <span className="text-border">•</span>
            <span className="hover:text-primary transition cursor-pointer">GitHub</span>
            <span className="text-border">•</span>
            <span className="hover:text-primary transition cursor-pointer">Discord</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  const routeMap: Record<string, string> = {
    "features": "/features",
    "pricing": "/pricing",
    "changelog": "/changelog",
    "community": "/community",
    "blog": "/blog",
    "contact us": "/contact",
    "terms & conditions": "/terms",
    "privacy policy": "/privacy",
    "gdpr": "/gdpr",
  };

  return (
    <div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => {
          const path = routeMap[l.toLowerCase()];
          return (
            <li key={l}>
              {path ? (
                <Link to={path as any} className="text-sm text-muted-foreground transition hover:text-foreground">
                  {l}
                </Link>
              ) : (
                <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">
                  {l}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
