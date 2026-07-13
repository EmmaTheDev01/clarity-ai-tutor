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
      readTime: "5 min read",
      content: `The Socratic Method has been the cornerstone of deep intellectual inquiry for over two millennia. Yet, in the digital age, we have prioritised immediate answers over conceptual comprehension. When students use search engines or basic LLMs to complete homework assignments, they copy and paste the end product of another entity's processing. This shortcut bypasses the cognitive struggle—the vital struggle that forms long-term neural connections.

At purelearn.ai, we believe education needs structural friction. Our AI tutor acts as an active coach. When presented with a complex physics problem or a multi-step calculus equation, it doesn't print out the final derivation. Instead, it asks targeted, step-by-step questions: "What is your next integration variable?" or "What conservation law applies here?". By scaffolding hints, the system encourages students to bridge their own logic gaps, reinforcing deep mathematical models.`
    },
    {
      id: "adhd-bionic-reading",
      title: "Designing Software for ADHD Focus: The Power of Bionic Reading Anchors",
      excerpt: "How slight typographical modifications and high-contrast word highlights change reading performance for learners with ADHD.",
      date: "June 28, 2026",
      readTime: "8 min read",
      content: `Cognitive accessibility is not a secondary checkbox; it is a foundational architectural element. For readers with ADHD, navigating dense technical documentation can be an exhausting exercise in focus regulation. Traditional paragraph layouts offer no visual anchors, leading to rapid cognitive fatigue and reread cycles.

Bionic Reading addresses this by bolding the initial segments of words. This bolding triggers the brain's pattern-matching systems, acting as a visual anchor. The eye is guided from word to word, reducing search time and allowing readers with ADHD to absorb content dynamically. In this article, we examine how mapping typographies, word spacing parameters, and pastel sepia theme filters can elevate educational reading experiences.`
    }
  ];

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-1.5 font-serif">
              purelearn.ai
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
          <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-muted-foreground">
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
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-1.5 font-serif">
            <Brain className="h-5 w-5 text-primary" />
            purelearn.ai
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
