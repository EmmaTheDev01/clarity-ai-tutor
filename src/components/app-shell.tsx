import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { CacheManager } from "@/lib/cache";
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
  AlertTriangle,
  User,
  CreditCard,
  Glasses,
  Check,
} from "lucide-react";
import { Kbd } from "./ui-kit";
import { toast } from "sonner";
import { useCognitiveMode } from "@/hooks/use-cognitive-mode";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/app/library", label: "Library", icon: Library, exact: false },
  { to: "/app/notes", label: "Notes", icon: FileText, exact: false },
  { to: "/app/flashcards", label: "Flashcards", icon: Layers, exact: false },
  { to: "/app/teasers", label: "Brain Teasers", icon: Gamepad2, exact: false },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, exact: false },
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
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCognitiveDropdown, setShowCognitiveDropdown] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  
  const { mode, setMode } = useCognitiveMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === "/") {
        e.preventDefault();
        setShortcutModalOpen((prev) => !prev);
      } else if (isMeta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const btn = document.getElementById("new-chat-button");
        if (btn) {
          btn.click();
        } else {
          toast.info("Start a new chat inside the study workspace");
        }
      } else if (isMeta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const input = document.getElementById("chat-input");
        if (input) {
          input.focus();
        }
      } else if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("global-search-input");
        if (input) {
          input.focus();
        }
      } else if (e.key === "Escape") {
        setShortcutModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  interface NotificationItem {
    id: string;
    icon: string;
    title: string;
    message: string;
    time: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    let userId = "";

    const loadProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          userId = userData.user.id;

          // Check Cache
          const cacheKey = `user_shell_data_${userId}`;
          const cached = CacheManager.get(cacheKey);
          if (cached) {
            setProfile(cached.profile);
            setTier(cached.tier);
            setNotifications(cached.notifications);
            return;
          }

          const { data: prof, error: profErr } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", userId)
            .maybeSingle();

          let finalName = "";
          let finalAvatar: string | null = null;

          if (profErr || !prof) {
            const newName = userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0] || "Student User";
            const { data: createdProf } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                name: newName,
                email: userData.user.email || "",
                role: "student",
              })
              .select("name, avatar_url")
              .maybeSingle();

            if (createdProf) {
              finalName = createdProf.name || "Student User";
              finalAvatar = createdProf.avatar_url || null;
            }
          } else {
            finalName = prof.name || "Student User";
            finalAvatar = prof.avatar_url || null;
          }
          setProfile({ name: finalName, avatarUrl: finalAvatar });

          // Fetch subscription tier
          let finalTier = "free";
          try {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("plan_tier")
              .eq("user_id", userId)
              .maybeSingle();
            if (sub) {
              finalTier = sub.plan_tier || "free";
            }
          } catch (e) {
            console.warn("Could not query subscription details in header:", e);
          }
          setTier(finalTier);

          // Fetch dynamic notifications from Supabase
          const loadedNotifications: NotificationItem[] = [];

          // 1. Fetch note share invitations
          try {
            const { data: dbShares } = await supabase
              .from("note_shares")
              .select(`
                id,
                created_at,
                notes (
                  title
                )
              `)
              .eq("shared_with_email", userData.user.email)
              .eq("status", "pending");

            if (dbShares) {
              dbShares.forEach((share: any) => {
                loadedNotifications.push({
                  id: share.id,
                  icon: "📬",
                  title: "Note Share Request",
                  message: `A classmate shared the note "${share.notes?.title || "Untitled"}" with you. Accept it from notes page!`,
                  time: "New Request",
                });
              });
            }
          } catch (e) {
            console.warn("Could not query note shares for notification:", e);
          }

          // 2. Add streak notifications if streak exists
          try {
            const { data: stdProf } = await supabase
              .from("student_profiles")
              .select("streak")
              .eq("student_id", userId)
              .maybeSingle();

            if (stdProf && Number(stdProf.streak) > 0) {
              loadedNotifications.push({
                id: "streak_alert",
                icon: "",
                title: `${stdProf.streak} Day Study Streak!`,
                message: "You are on fire! Keep learning today to maintain your streak score.",
                time: "Today",
              });
            }
          } catch (e) {
            console.warn("Could not query streak score for notification:", e);
          }

          // 3. Fallback welcome notification if empty
          if (loadedNotifications.length === 0) {
            loadedNotifications.push({
              id: "welcome_alert",
              icon: "",
              title: "Welcome to Clarity!",
              message: "Start learning by uploading a document in the study workspace.",
              time: "Just now",
            });
          }

          setNotifications(loadedNotifications);

          // Save to Cache
          CacheManager.set(cacheKey, {
            profile: { name: finalName, avatarUrl: finalAvatar },
            tier: finalTier,
            notifications: loadedNotifications
          }, 45000);
        }
      } catch (err) {
        console.warn("Could not load user profile in header:", err);
      }
    };

    loadProfile();

    // Subscribe to realtime updates on profiles table
    const channel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (userId && payload.new && payload.new.id === userId) {
            setProfile({
              name: payload.new.name || "Student User",
              avatarUrl: payload.new.avatar_url || null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showNotifications && !target.closest(".notifications-trigger-container")) {
        setShowNotifications(false);
      }
      if (showUserDropdown && !target.closest(".profile-trigger-container")) {
        setShowUserDropdown(false);
      }
      if (showCognitiveDropdown && !target.closest(".cognitive-trigger-container")) {
        setShowCognitiveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications, showUserDropdown, showCognitiveDropdown]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-border bg-background transition-all duration-300 lg:translate-x-0 ${open ? "translate-x-0 w-64" : "-translate-x-full"
          } ${isCollapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/app" className="flex items-center shrink-0">
            <img src="/logo.png" alt="Purelearn.ai Logo" className="h-6 w-auto lg:hidden" />
            <img src="/logo.png" alt="Purelearn.ai Logo" className={`h-8 w-auto hidden ${isCollapsed ? '' : 'lg:block'}`} />
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
            <span className={`truncate lg:inline ${isCollapsed ? "lg:hidden" : ""}`}>
              Upload material
            </span>
          </Link>
        </div>

        <nav className="px-2">
          <div className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate lg:block ${isCollapsed ? "lg:hidden" : ""}`}>
            Workspace
          </div>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all lg:justify-start ${isCollapsed ? "lg:justify-center" : "lg:justify-start"
                  } ${active
                    ? "bg-elevated font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className={`truncate lg:inline ${isCollapsed ? "lg:hidden" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          {/* Desktop Collapsed view */}
          <div className={`hidden lg:block ${isCollapsed ? "lg:block" : "lg:hidden"}`}>
            <Link
              to="/pricing"
              className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-elevated hover:bg-muted text-primary"
              title="Upgrade plan"
            >
              <Sparkles className={`h-4 w-4 ${tier !== "free" ? "text-amber-500 fill-current animate-pulse" : "text-primary"}`} />
            </Link>
          </div>

          {/* Mobile and Desktop Expanded view */}
          <div className={`block ${isCollapsed ? "lg:hidden" : "lg:block"}`}>
            <div className="rounded-md border border-border bg-elevated p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Sparkles className={`h-3.5 w-3.5 ${tier !== "free" ? "text-amber-500 fill-current" : ""}`} />
                <span className="capitalize">{tier} Plan</span>
              </div>
              {tier !== "free" ? (
                <p className="mt-1 text-xs text-muted-foreground">Unlimited daily queries unlocked.</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">20 / 50 daily queries used.</p>
                  <Link
                    to="/pricing"
                    className="mt-2 inline-block text-xs font-medium text-foreground underline underline-offset-2"
                  >
                    Upgrade
                  </Link>
                </>
              )}
            </div>
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
            <div className="flex items-center gap-3">
              {/* Enlarge Search input field */}
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-background/50 backdrop-blur-md px-3.5 py-2 text-sm text-muted-foreground md:flex md:w-80 lg:w-96 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  id="global-search-input"
                  type="text"
                  placeholder="Search notes, documents, quizzes..."
                  className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground/70 flex-1 min-w-0"
                />
                <Kbd className="shrink-0 bg-muted/60 text-xs px-1.5 py-0.5 rounded font-mono">cmd + K</Kbd>
              </div>

              {/* Dynamic Notification Bell Dropdown */}
              <div className="relative notifications-trigger-container">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserDropdown(false);
                  }}
                  className="relative rounded-xl border border-border p-2 hover:bg-muted bg-elevated/20 transition duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-border bg-white shadow-2xl p-4 z-40 animate-fade-in origin-top-right">
                      <div className="flex items-center justify-between pb-3 border-b border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Notifications</span>
                        <span
                          className="text-[9px] font-extrabold text-primary hover:underline cursor-pointer"
                          onClick={() => {
                            setNotifications([]);
                            toast.success("All notifications marked as read.");
                          }}
                        >
                          Mark read
                        </span>
                      </div>
                      <div className="mt-3 space-y-3 max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center flex flex-col items-center justify-center">
                            <span className="text-2xl mb-2">🔔</span>
                            <div className="text-[11px] font-bold text-foreground">All caught up!</div>
                            <p className="text-[10px] text-muted-foreground mt-1 px-4 leading-normal">
                              No new study suggestions or note invitations at this time. Go ahead and start a study session!
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div key={notification.id} className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition cursor-pointer">
                              <div className="flex gap-2.5">
                                <span className="text-sm">{notification.icon}</span>
                                <div>
                                  <div className="text-[11px] font-bold text-foreground">{notification.title}</div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{notification.message}</p>
                                  <span className="text-[8px] text-primary mt-1 block font-medium">{notification.time}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cognitive Accessibility Dropdown */}
              <div className="relative cognitive-trigger-container hidden sm:block">
                <button
                  onClick={() => {
                    setShowCognitiveDropdown(!showCognitiveDropdown);
                    setShowNotifications(false);
                    setShowUserDropdown(false);
                  }}
                  className={`relative rounded-xl border p-2 transition duration-200 ${mode !== "default" ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" : "border-border bg-elevated/20 hover:bg-muted"}`}
                  aria-label="Cognitive Mode"
                  title="Cognitive Accessibility Options"
                >
                  <Glasses className="h-4 w-4" />
                </button>

                {showCognitiveDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowCognitiveDropdown(false)} />
                    <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-border bg-white shadow-2xl p-2 z-40 animate-fade-in origin-top-right">
                      <div className="px-3 py-2 border-b border-border/40 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Cognitive Profiles</span>
                        <p className="text-[9px] text-muted-foreground mt-1">Adjust text rendering to match your processing style.</p>
                      </div>
                      
                      <div className="space-y-1">
                        <button
                          onClick={() => { setMode("default"); setShowCognitiveDropdown(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition ${mode === "default" ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted font-medium"}`}
                        >
                          <div>
                            Standard
                            <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">Default text rendering</span>
                          </div>
                          {mode === "default" && <Check className="h-3.5 w-3.5" />}
                        </button>
                        
                        <button
                          onClick={() => { setMode("adhd"); setShowCognitiveDropdown(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition ${mode === "adhd" ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted font-medium"}`}
                        >
                          <div>
                            Bionic Reading
                            <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">Optimized for ADHD (Saccadic focus)</span>
                          </div>
                          {mode === "adhd" && <Check className="h-3.5 w-3.5" />}
                        </button>

                        <button
                          onClick={() => { setMode("dyslexia"); setShowCognitiveDropdown(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition ${mode === "dyslexia" ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted font-medium"}`}
                        >
                          <div>
                            Dyslexia Support
                            <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">Wider spacing and tailored fonts</span>
                          </div>
                          {mode === "dyslexia" && <Check className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {actions}

              {/* User Dropdown Menu */}
              <div className="relative profile-trigger-container">
                <button
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotifications(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium overflow-hidden hover:opacity-90 transition duration-200"
                  aria-label="Account"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    profile?.name ? profile.name.substring(0, 2).toUpperCase() : "ST"
                  )}
                </button>

                {showUserDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowUserDropdown(false)} />
                    <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-border/80 bg-white backdrop-blur-xl shadow-2xl p-2 z-40 animate-fade-in origin-top-right">
                      <div className="px-3.5 py-2.5 border-b border-border/40">
                        <div className="text-[11px] font-bold text-foreground truncate">{profile?.name || "Scholar User"}</div>
                        <div className="text-[9px] text-muted-foreground truncate mt-0.5">Logged in User</div>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/app/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition"
                        >
                          <User className="h-3.5 w-3.5" />
                          My Profile
                        </Link>
                        <Link
                          to="/app/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Preferences
                        </Link>
                        <Link
                          to="/app/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Billing & Plan
                        </Link>
                      </div>
                      <div className="border-t border-border/40 p-1 mt-1">
                        <button
                          onClick={async () => {
                            setShowUserDropdown(false);
                            await supabase.auth.signOut();
                            localStorage.clear();
                            window.location.href = "/auth/sign-in";
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 rounded-xl transition text-left"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden px-6 py-6">{children}</main>
      </div>

      {shortcutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 p-6 shadow-2xl animate-fade-in text-center">
            <h3 className="text-sm font-bold text-foreground mb-4">Accessibility Keyboard Shortcuts</h3>
            <div className="space-y-3.5 text-xs text-muted-foreground text-left mb-6">
              <div className="flex justify-between items-center">
                <span>Show Shortcuts Help</span>
                <span className="px-1.5 py-0.5 rounded border border-border bg-muted/60 font-mono text-[10px]">Cmd + /</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Start New Chat Session</span>
                <span className="px-1.5 py-0.5 rounded border border-border bg-muted/60 font-mono text-[10px]">Cmd + N</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Focus Chat Input</span>
                <span className="px-1.5 py-0.5 rounded border border-border bg-muted/60 font-mono text-[10px]">Cmd + S</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Close Modals / Help Overlay</span>
                <span className="px-1.5 py-0.5 rounded border border-border bg-muted/60 font-mono text-[10px]">ESC</span>
              </div>
            </div>
            <button
              onClick={() => setShortcutModalOpen(false)}
              className="w-full py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
