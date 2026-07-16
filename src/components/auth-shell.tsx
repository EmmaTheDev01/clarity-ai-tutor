import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-8 py-5">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Purelearn.ai Logo" className="h-9 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Back to site
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>

      {/* Right: editorial panel */}
      <div className="hidden border-l border-border bg-elevated lg:block">
        <div className="flex h-full flex-col justify-between p-12">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Learn & Create learning materials easily.
          </div>
          <div>
            <p className="text-2xl font-semibold leading-snug tracking-tight text-foreground">
              &ldquo;This has become an integral part of my daily learning workflow. It completely
              changes how I process long video lectures.&rdquo;
            </p>
            <div className="mt-6 border-t border-border pt-4">
              <div className="text-sm font-medium text-foreground">Jackson Dushime</div>
              <div className="text-sm text-muted-foreground">Product Engineer</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} purelearn.ai</span>
            <span>Kigali · Rwanda</span>
          </div>
        </div>
      </div>
    </div>
  );
}
