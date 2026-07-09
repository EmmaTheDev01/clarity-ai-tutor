import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload,
  MessageSquare,
  FileCheck2,
  Sparkles,
  Plus,
  Minus,
  ArrowRight,
  Play,
} from "lucide-react";
import appMockup from "@/assets/app-mockup.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const APP = "tutor.vigilance.rw";

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Features />
        <UseCases />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <a href="#" className="text-sm font-bold tracking-wider text-foreground">
          {APP}
        </a>
        <div className="hidden md:flex">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Backed by Y Combinator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#signin"
            className="hidden rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex"
          >
            Sign in
          </a>
          <a
            href="#get"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Get the app
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-24 text-center sm:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" strokeWidth={2} />
          Loved by 2,000,000+ learners
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          An AI tutor made exactly for you.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Turn your notes, documents, and reference materials into interactive
          chats, summaries, and personalized practice exams — instantly.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#start"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Start learning — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <Play className="h-4 w-4" />
            Watch demo video
          </a>
        </div>

        <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-lg border border-border bg-elevated shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-1.5 border-b border-border bg-background px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full border border-border" />
            <span className="h-2.5 w-2.5 rounded-full border border-border" />
            <span className="h-2.5 w-2.5 rounded-full border border-border" />
            <span className="ml-4 text-xs text-muted-foreground">
              {APP}
            </span>
          </div>
          <img
            src={appMockup}
            alt="tutor.vigilance.rw AI tutor interface showing a chat with citations and a document library"
            width={1600}
            height={1008}
            className="block h-auto w-full"
          />
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
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Save hours. Learn smarter.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Everything you need to turn passive material into active understanding.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border">
                <f.icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </div>
              <h3 className="mt-6 text-lg font-medium text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const useCases = [
  {
    tab: "Manage projects",
    title: "Turn briefs and specs into a working knowledge base.",
    body: "Upload requirements, meeting notes, and research docs. Ask questions across every file — get answers with exact citations to the source paragraph.",
  },
  {
    tab: "Study scientific material",
    title: "Master dense papers without re-reading them five times.",
    body: "Load textbooks, journal articles, and lecture recordings. Generate structured summaries, definitions, and quizzes calibrated to your gaps.",
  },
  {
    tab: "Organize life content",
    title: "Make sense of everything you save but never revisit.",
    body: "Drop in articles, videos, and voice memos. Search by meaning, not keywords, and turn scattered notes into a personal library you actually use.",
  },
];

function UseCases() {
  const [active, setActive] = useState(0);
  const current = useCases[active];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for the way you work.
          </h2>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {useCases.map((u, i) => (
            <button
              key={u.tab}
              onClick={() => setActive(i)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active === i
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {u.tab}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-border bg-elevated p-10 text-center">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {current.title}
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {current.body}
          </p>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "This has become an integral part of my daily learning workflow. It completely changes how I process long video lectures.",
    name: "Mihir Wadekar",
    title: "Product Engineer",
  },
  {
    quote:
      "I use this tool to offer my students an alternative channel of engagement for highly complex scientific topics.",
    name: "G. Shaw Jr.",
    title: "Assistant Professor, UNC",
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
    name: "Julien Marchand",
    title: "Law Student",
  },
  {
    quote:
      "Turned a 3-hour keynote into a 10-minute briefing I could actually share with my team.",
    name: "Priya Ramanathan",
    title: "Strategy Lead",
  },
  {
    quote:
      "The generated quizzes are shockingly good. They target exactly what I don't know yet.",
    name: "Daniel Weiss",
    title: "Medical Resident",
  },
];

function Testimonials() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trusted by learners everywhere.
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-lg border border-border bg-background p-6"
            >
              <blockquote className="text-base leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.title}</div>
              </figcaption>
            </figure>
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
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions.
          </h2>
        </div>
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
                  <span className="text-base font-medium text-foreground">
                    {f.q}
                  </span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-foreground" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-foreground" />
                  )}
                </button>
                <div
                  className={`grid overflow-hidden transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                  }`}
                >
                  <p className="min-h-0 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-lg border border-border bg-elevated px-8 py-16 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your smarter study session starts now.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Join 2,000,000+ learners turning static material into interactive
            understanding.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#start"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Start learning — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Watch demo video
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="text-sm font-bold tracking-wider text-foreground">
              {APP}
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              An AI tutor made exactly for you.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={["Features", "Pricing", "Changelog"]}
          />
          <FooterCol title="Company" links={["Community", "Blog", "Contact us"]} />
          <FooterCol
            title="Legal"
            links={["Terms & conditions", "Privacy policy"]}
          />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Made for learners.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a
              href="#"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
