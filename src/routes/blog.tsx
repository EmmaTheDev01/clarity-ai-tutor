import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — purelearn.ai" }] }),
  component: BlogPage,
});

function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const posts = [
    {
      id: "socratic-friction",
      title: "Socratic Method vs. Direct Answers: Why STEM Education Needs Friction",
      excerpt: "Why copy-pasting homework answers is harming student comprehension, and how adaptive AI coaching builds resilient mental models.",
      date: "July 12, 2026",
      readTime: "12 min read",
      content: `The Socratic Method has been the cornerstone of deep intellectual inquiry for over two millennia. Yet, in the digital age, we have prioritised immediate answers over conceptual comprehension. When students use search engines or basic LLMs to complete homework assignments, they copy and paste the end product of another entity's processing.

This shortcut bypasses the cognitive struggle—the vital friction that forms long-term neural connections. In the short term, students get the right answer and pass the assignment. In the long term, they arrive at exams or practical applications completely unequipped to solve novel problems because they never built the underlying mental models.

At purelearn.ai, we believe education fundamentally needs structural friction. If a system does all the heavy lifting, the brain atrophy is inevitable. That is why our AI tutor acts as an active, relentless coach rather than an automated answer key.

When presented with a complex physics problem or a multi-step calculus equation, purelearn.ai doesn't just print out the final derivation. Instead, it analyzes the user's current understanding and asks targeted, step-by-step questions: "What is your next integration variable?" or "What conservation law applies here?".

By scaffolding hints, the system encourages students to bridge their own logic gaps. This is significantly harder than reading an answer, but the cognitive load is exactly what triggers neuroplasticity.

Research in cognitive science consistently shows that 'desirable difficulties' enhance learning and retention. If a task feels too easy, the brain assumes the information isn't important enough to store in long-term memory. When a student has to wrestle with a concept, the brain flags it as critical.

Our platform tracks where students hesitate and which hints eventually unlock their understanding. By doing this, we create a personalized 'forgetting curve' model that knows exactly when to re-test the student on that specific concept.

Furthermore, we've implemented safeguards against prompt-injection. A common issue with generic AI tools is that students can simply command the AI to "just give me the answer and skip the explanation." Our architecture prevents this, forcing the Socratic loop to complete.

Educators who use purelearn.ai in their classrooms report that students aren't just getting better grades; they are asking vastly better questions. They are shifting from "How do I solve this?" to "Why does this specific theorem apply instead of this other one?"

In the end, the goal of education isn't to produce a correct homework sheet. It's to produce a capable, independent thinker. By reintroducing friction into the digital learning process, we are protecting the future of STEM innovation.`
    },
    {
      id: "adhd-bionic-reading",
      title: "Designing Software for ADHD Focus: The Power of Bionic Reading Anchors",
      excerpt: "How slight typographical modifications and high-contrast word highlights change reading performance for learners with ADHD.",
      date: "June 28, 2026",
      readTime: "10 min read",
      content: `Cognitive accessibility is not a secondary checkbox; it is a foundational architectural element. For readers with ADHD, navigating dense technical documentation or long academic texts can be an exhausting exercise in focus regulation.

Traditional paragraph layouts offer no visual anchors. A standard block of text is visually monotonous, leading to rapid cognitive fatigue. The eye wanders, loses its place, and the reader is forced into a cycle of constant rereading, which inevitably destroys momentum and motivation.

Bionic Reading addresses this by bolding the initial segments of words. This bolding triggers the brain's pattern-matching systems, acting as a visual anchor. The eye is guided from word to word, reducing search time and allowing readers to absorb content dynamically.

When the first few letters of a word are highlighted, the brain intuitively completes the rest of the word. This taps into the brain's natural predictive processing capabilities, effectively offloading some of the cognitive burden from active concentration to subconscious pattern recognition.

At purelearn.ai, we conducted extensive beta testing with neurodivergent students using our platform. The results were immediate and striking. Students using the enhanced typographical settings were able to sustain reading sessions for 40% longer without self-reporting fatigue.

But typography is only one part of the equation. We also examined word spacing parameters and line-height. By slightly increasing the tracking (letter spacing) and leading (line spacing), we reduced the 'crowding effect' that often triggers visual stress.

Color theory plays a crucial role as well. Stark black text on a pure white background can create a glaring, overwhelming contrast. We introduced pastel sepia theme filters and low-stimulus dark modes that reduce eye strain and calm the visual cortex.

Another critical feature we developed is 'Focus Mode', which dims all UI elements except the specific paragraph the student is currently reading. For a user with ADHD, a screen full of sidebars, navigation links, and notification badges is a minefield of distractions.

We also integrated a Pomodoro-style pacing system directly into the reading interface. It breaks long texts into manageable chunks, giving the brain permission to rest and consolidate information before moving on to the next section.

Designing for ADHD isn't just about making accommodations; it's about building fundamentally better software. When we create interfaces that reduce cognitive friction, we don't just help neurodivergent users—we create a smoother, more intuitive learning experience for everyone.`
    }
  ];

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="purelearn.ai Logo" className="h-11 w-auto sm:h-12" />
          </Link>
            <button
              onClick={() => setSelectedPost(null)}
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition"
            >
              Back to Blog
            </button>
          </div>
        </header>

        {/* Dynamic Article Detail Content */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-16">
          <div className="flex gap-4 items-center text-[10px] text-muted-foreground font-semibold uppercase mb-6">
            <span>{selectedPost.date}</span>
            <span>•</span>
            <span>{selectedPost.readTime}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground mb-8 leading-snug">
            {selectedPost.title}
          </h1>
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-sm space-y-6">
            {selectedPost.content.split("\n\n").map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/80 bg-background/50">
          <div className="mx-auto max-w-3xl px-6 py-8 flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
          <img src="/logo.png" alt="purelearn.ai Logo" className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="purelearn.ai Logo" className="h-11 w-auto sm:h-12" />
          </Link>
          <Link to="/auth/sign-in" className="text-sm font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            The Socratic Mind
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Explorations into cognitive accessibility, AI safety, and modern learning patterns.
          </p>
        </div>

        {/* Blog Post Grid */}
        <div className="space-y-8">
          {posts.map((post, index) => (
            <Card key={index} className="p-8 bg-elevated/10 border border-border/50 rounded-2xl flex flex-col hover:border-primary/30 transition duration-300">
              <div className="flex gap-4 items-center text-[10px] text-muted-foreground font-semibold uppercase mb-3">
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h3
                onClick={() => setSelectedPost(post)}
                className="text-lg font-bold text-foreground mb-3 leading-snug hover:text-primary transition duration-200 cursor-pointer"
              >
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {post.excerpt}
              </p>
              <button
                onClick={() => setSelectedPost(post)}
                className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline text-left"
              >
                Read full article
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
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
