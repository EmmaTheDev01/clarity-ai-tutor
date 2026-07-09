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
  FileText,
  Layers,
  BarChart3,
  Gamepad2,
} from "lucide-react";
import { Kbd } from "./ui-kit";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/app/library", label: "Library", icon: Library, exact: false },
  { to: "/app/notes", label: "Notes", icon: FileText, exact: false },
  { to: "/app/flashcards", label: "Flashcards", icon: Layers, exact: false },
  { to: "/app/teasers", label: "Brain Teasers", icon: Gamepad2, exact: false },
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-border bg-background transition-all duration-300 lg:translate-x-0 ${
          open ? "translate-x-0 w-64" : "-translate-x-full"
        } ${
          isCollapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/app" className="text-sm font-bold tracking-wider truncate">
            {isCollapsed ? "Clarity" : "tutor.vigilance.rw"}
          </Link>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md p-1.5 hover:bg-muted lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              className="hidden lg:block rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <Link
            to="/app/library"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all"
            title="Upload material"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Upload material</span>}
          </Link>
        </div>

        <nav className="px-2">
          {!isCollapsed && (
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Workspace
            </div>
          )}
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-elevated font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          {isCollapsed ? (
            <Link
              to="/app/settings"
              className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-elevated hover:bg-muted text-primary"
              title="Upgrade plan"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </Link>
          ) : (
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
          )}
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
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
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
                <Kbd>Ctrl K</Kbd>
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

        <main className="flex-1 min-h-0 overflow-hidden px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
