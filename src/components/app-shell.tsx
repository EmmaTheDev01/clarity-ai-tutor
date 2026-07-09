import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Library,
  Settings,
  Sparkles,
  Search,
  Bell,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { Kbd } from "./ui-kit";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/app/library", label: "Library", icon: Library, exact: false },
  { to: "/app/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppShell({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-background transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link to="/app" className="text-sm font-bold tracking-wider">
            tutor.vigilance.rw
          </Link>
          <button
            className="rounded-md p-1.5 hover:bg-muted lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <Link
            to="/app/library"
            className="flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Upload material
          </Link>
        </div>

        <nav className="px-3">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-elevated font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-border p-4">
          <div className="rounded-md border border-border bg-elevated p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Free plan
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              20 / 50 daily queries used.
            </p>
            <Link
              to="/app/settings"
              className="mt-2 inline-block text-xs font-medium text-foreground underline underline-offset-2"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-md p-1.5 hover:bg-muted lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground md:flex">
                <Search className="h-3.5 w-3.5" />
                <span>Search…</span>
                <Kbd>⌘K</Kbd>
              </div>
              <button className="rounded-md border border-border p-2 hover:bg-muted" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              {actions}
              <Link
                to="/app/settings"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium"
                aria-label="Account"
              >
                AJ
              </Link>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
