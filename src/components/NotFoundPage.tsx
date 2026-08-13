import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-primary/20">
      {/* Minimal Header with Logo */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="inline-block transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="purelearn.ai" className="h-8 sm:h-9 w-auto" />
        </Link>
      </header>

      {/* Minimal Main Card / Section */}
      <main className="w-full max-w-md mx-auto text-center my-auto py-12">
        <h1 className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-foreground/90 select-none">
          404
        </h1>
        
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Page not found
        </h2>
        
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} purelearn.ai
      </footer>
    </div>
  );
}
