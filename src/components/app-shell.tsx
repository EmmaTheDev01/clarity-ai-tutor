import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
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
  ShieldCheck,
  BookOpen,
  Check,
  LayoutDashboard,
  Users,
  Activity,
  GraduationCap,
  HelpCircle,
  Folder,
  Sliders,
  Cpu,
  Key,
  Loader2,
  ArrowRight,
  LogOut,
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

const adminNav = [
  { to: "/admin", tab: "overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin", tab: "demos", label: "Demo Requests", icon: Sparkles },
  { to: "/admin", tab: "users", label: "Users", icon: Users },
  { to: "/admin", tab: "materials", label: "Materials", icon: FileText },
  { to: "/admin", tab: "flashcards", label: "Flashcards", icon: Layers },
  { to: "/admin", tab: "analytics", label: "Analytics (System)", icon: BarChart3 },
  { to: "/admin", tab: "logs", label: "System Logs", icon: Activity },
  { to: "/admin", tab: "settings", label: "App Settings", icon: Settings },
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
  const location = useRouterState({ select: (r) => r.location });
  const pathname = location.pathname;
  const currentAdminTab = (location.search as Record<string, string>)?.tab || "overview";
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null } | null>(null);
  const [userRole, setUserRole] = useState<string>("student");

  useEffect(() => {
    try {
      const local = localStorage.getItem("user_profile");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.role) setUserRole(parsed.role);
      }
    } catch (e) {}
  }, []);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCognitiveDropdown, setShowCognitiveDropdown] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);

  // Dedicated Role-Based Header Search State
  interface SearchResultItem {
    id: string;
    category: string;
    title: string;
    subtitle?: string;
    badge?: string;
    icon: any;
    onSelect: () => void;
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Role-Tailored Search Execution with Deep Database Indexing
  useEffect(() => {
    let isCurrent = true;
    const executeSearch = async () => {
      const q = searchQuery.trim();
      // Derive active role accurately
      const currentRole =
        userRole === "admin" || pathname.startsWith("/admin")
          ? "admin"
          : userRole === "teacher" || pathname.startsWith("/teacher")
          ? "teacher"
          : "student";

      // If empty query, provide role-specific quick shortcuts
      if (!q) {
        if (currentRole === "admin") {
          setSearchResults([
            {
              id: "nav_overview",
              category: "Admin Portal",
              title: "System Overview & Metrics",
              subtitle: "Live database records, classrooms, and materials count",
              badge: "Overview",
              icon: LayoutDashboard,
              onSelect: () => { navigate({ to: "/admin", search: { tab: "overview" } as any }); setIsSearchOpen(false); },
            },
            {
              id: "nav_users",
              category: "Admin Portal",
              title: "User Directory & Verification",
              subtitle: "Index all students, educators, and admin accounts",
              badge: "Users",
              icon: Users,
              onSelect: () => { navigate({ to: "/admin", search: { tab: "users" } as any }); setIsSearchOpen(false); },
            },
            {
              id: "nav_materials",
              category: "Admin Portal",
              title: "Whole System Study Materials",
              subtitle: "Directory of all course documents and files",
              badge: "Materials",
              icon: BookOpen,
              onSelect: () => { navigate({ to: "/admin", search: { tab: "materials" } as any }); setIsSearchOpen(false); },
            },
            {
              id: "nav_flashcards",
              category: "Admin Portal",
              title: "System Flashcard Decks",
              subtitle: "Active recall study decks created across platform",
              badge: "Flashcards",
              icon: Layers,
              onSelect: () => { navigate({ to: "/admin", search: { tab: "flashcards" } as any }); setIsSearchOpen(false); },
            },
            {
              id: "nav_logs",
              category: "Admin Portal",
              title: "Weekly Telemetry & Activity Logs",
              subtitle: "Index and search user queries, logins, and audit logs",
              badge: "Logs",
              icon: Activity,
              onSelect: () => { navigate({ to: "/admin", search: { tab: "logs" } as any }); setIsSearchOpen(false); },
            },
            {
              id: "nav_settings",
              category: "Admin Portal",
              title: "Global Gemini API Key & App Settings",
              subtitle: "Configure default AI models, temperature, and keys",
              badge: "Settings",
              icon: Settings,
              onSelect: () => { navigate({ to: "/admin", search: { tab: "settings" } as any }); setIsSearchOpen(false); },
            },
          ]);
        } else if (currentRole === "teacher") {
          setSearchResults([
            {
              id: "t_classrooms",
              category: "Teacher Portal",
              title: "My Classrooms & Student Cohorts",
              subtitle: "Manage student enrollments and assignments",
              badge: "Classrooms",
              icon: GraduationCap,
              onSelect: () => { navigate({ to: "/teacher" }); setIsSearchOpen(false); },
            },
            {
              id: "t_materials",
              category: "Teacher Portal",
              title: "Study Documents & Materials Library",
              subtitle: "Upload and publish syllabus materials",
              badge: "Library",
              icon: Library,
              onSelect: () => { navigate({ to: "/app/library" }); setIsSearchOpen(false); },
            },
            {
              id: "t_ai_tutor",
              category: "AI Workspace",
              title: "Open AI Study Workspace",
              subtitle: "Interactive tutoring and automated synthesis",
              badge: "AI Tutor",
              icon: Sparkles,
              onSelect: () => { navigate({ to: "/app" }); setIsSearchOpen(false); },
            },
            {
              id: "t_analytics",
              category: "Teacher Portal",
              title: "Student Analytics & Progress",
              subtitle: "Monitor learning velocity and quiz scores",
              badge: "Analytics",
              icon: BarChart3,
              onSelect: () => { navigate({ to: "/app/analytics" }); setIsSearchOpen(false); },
            },
          ]);
        } else {
          // Student default shortcuts
          setSearchResults([
            {
              id: "s_tutor",
              category: "Study Workspace",
              title: "AI Cognitive Study Workspace",
              subtitle: "Ask questions, review documents, and explore concepts",
              badge: "AI Tutor",
              icon: Sparkles,
              onSelect: () => { navigate({ to: "/app" }); setIsSearchOpen(false); },
            },
            {
              id: "s_notes",
              category: "Study Workspace",
              title: "Digital Notebook & Notes",
              subtitle: "Access markdown notes, flashcard tags, and takeaways",
              badge: "Notes",
              icon: FileText,
              onSelect: () => { navigate({ to: "/app/notes" }); setIsSearchOpen(false); },
            },
            {
              id: "s_flashcards",
              category: "Study Workspace",
              title: "Spaced Retrieval Flashcard Sets",
              subtitle: "Practice active recall with spaced repetitions",
              badge: "Flashcards",
              icon: Layers,
              onSelect: () => { navigate({ to: "/app/flashcards" }); setIsSearchOpen(false); },
            },
            {
              id: "s_library",
              category: "Study Workspace",
              title: "Materials & Course Library",
              subtitle: "Access syllabus documents, PDFs, and guides",
              badge: "Library",
              icon: Library,
              onSelect: () => { navigate({ to: "/app/library" }); setIsSearchOpen(false); },
            },
            {
              id: "s_teasers",
              category: "Study Workspace",
              title: "Brain Teasers & Daily Challenges",
              subtitle: "Adaptive problem solving and cognitive puzzles",
              badge: "Challenges",
              icon: Gamepad2,
              onSelect: () => { navigate({ to: "/app/teasers" }); setIsSearchOpen(false); },
            },
          ]);
        }
        setIsSearching(false);
        setSelectedSearchIndex(0);
        return;
      }

      // Live Database Search
      setIsSearching(true);
      const results: SearchResultItem[] = [];
      const cleanQ = q.replace(/[%_]/g, "");

      try {
        if (currentRole === "admin") {
          // 1. Index & Search Users in Database
          const [usersByName, usersByEmail] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, name, email, role, approval_status")
              .ilike("name", `%${cleanQ}%`)
              .limit(5),
            supabase
              .from("profiles")
              .select("id, name, email, role, approval_status")
              .ilike("email", `%${cleanQ}%`)
              .limit(5),
          ]);

          const userMap = new Map<string, any>();
          (usersByName.data || []).forEach((u) => userMap.set(u.id, u));
          (usersByEmail.data || []).forEach((u) => userMap.set(u.id, u));

          userMap.forEach((u) => {
            results.push({
              id: `u_${u.id}`,
              category: "Indexed Users",
              title: u.name || "User Account",
              subtitle: `${u.email} · Role: ${u.role} (${u.approval_status || "approved"})`,
              badge: u.role,
              icon: User,
              onSelect: () => {
                navigate({ to: "/admin", search: { tab: "users" } as any });
                setIsSearchOpen(false);
              },
            });
          });

          // 2. Index & Search System Materials in Database
          const { data: mats } = await supabase
            .from("materials")
            .select("id, title, type, source_kind, content")
            .or(`title.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%`)
            .limit(5);

          if (mats) {
            mats.forEach((m) => {
              results.push({
                id: `m_${m.id}`,
                category: "Indexed Materials",
                title: m.title,
                subtitle: `Format: ${m.type} · Source: ${m.source_kind || "file"}`,
                badge: m.type,
                icon: BookOpen,
                onSelect: () => {
                  navigate({ to: "/admin", search: { tab: "materials" } as any });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 3. Index & Search Telemetry & Audit Logs
          const { data: logs } = await supabase
            .from("user_logs")
            .select("id, action_type, details, created_at")
            .or(`action_type.ilike.%${cleanQ}%,details.ilike.%${cleanQ}%`)
            .order("created_at", { ascending: false })
            .limit(4);

          if (logs) {
            logs.forEach((l) => {
              results.push({
                id: `log_${l.id}`,
                category: "System Audit Logs",
                title: l.details || l.action_type,
                subtitle: `Action: ${l.action_type} · ${new Date(l.created_at).toLocaleDateString()}`,
                badge: "Log",
                icon: Activity,
                onSelect: () => {
                  navigate({ to: "/admin", search: { tab: "logs" } as any });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 4. Index & Search Flashcards
          const { data: decks } = await supabase
            .from("flashcard_decks")
            .select("id, title, subject")
            .or(`title.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%`)
            .limit(4);

          if (decks) {
            decks.forEach((d) => {
              results.push({
                id: `d_${d.id}`,
                category: "Flashcard Decks",
                title: d.title,
                subtitle: `Subject: ${d.subject || "General"}`,
                badge: "Deck",
                icon: Layers,
                onSelect: () => {
                  navigate({ to: "/admin", search: { tab: "flashcards" } as any });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 5. Index & Search Classrooms
          const { data: classrooms } = await supabase
            .from("classrooms")
            .select("id, name, subject")
            .or(`name.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%`)
            .limit(3);

          if (classrooms) {
            classrooms.forEach((c) => {
              results.push({
                id: `c_${c.id}`,
                category: "Classrooms",
                title: c.name,
                subtitle: `Subject: ${c.subject || "General"}`,
                badge: "Classroom",
                icon: GraduationCap,
                onSelect: () => {
                  navigate({ to: "/admin", search: { tab: "overview" } as any });
                  setIsSearchOpen(false);
                },
              });
            });
          }
        } else if (currentRole === "teacher") {
          // 1. Search Classrooms
          const { data: classrooms } = await supabase
            .from("classrooms")
            .select("id, name, subject")
            .or(`name.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%`)
            .limit(4);

          if (classrooms) {
            classrooms.forEach((c) => {
              results.push({
                id: `tc_${c.id}`,
                category: "My Classrooms",
                title: c.name,
                subtitle: `Subject: ${c.subject || "General"}`,
                badge: "Cohort",
                icon: GraduationCap,
                onSelect: () => {
                  navigate({ to: "/teacher" });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 2. Search Teaching Materials
          const { data: mats } = await supabase
            .from("materials")
            .select("id, title, type")
            .ilike("title", `%${cleanQ}%`)
            .limit(4);

          if (mats) {
            mats.forEach((m) => {
              results.push({
                id: `tm_${m.id}`,
                category: "Course Materials",
                title: m.title,
                subtitle: `Format: ${m.type}`,
                badge: m.type,
                icon: BookOpen,
                onSelect: () => {
                  navigate({ to: "/app/library" });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 3. Search Quizzes
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id, title")
            .ilike("title", `%${cleanQ}%`)
            .limit(4);

          if (quizzes) {
            quizzes.forEach((qz) => {
              results.push({
                id: `tq_${qz.id}`,
                category: "Assessments",
                title: qz.title,
                subtitle: "Student evaluation quiz",
                badge: "Quiz",
                icon: FileText,
                onSelect: () => {
                  navigate({ to: "/teacher" });
                  setIsSearchOpen(false);
                },
              });
            });
          }
        } else {
          // Normal User (Student) Search: Notes, Flashcards, Library Materials, Quizzes
          // 1. Search Notes
          const { data: notes } = await supabase
            .from("notes")
            .select("id, title, subject, content")
            .or(`title.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%`)
            .limit(5);

          if (notes) {
            notes.forEach((n) => {
              results.push({
                id: `sn_${n.id}`,
                category: "My Notes",
                title: n.title,
                subtitle: `Subject: ${n.subject || "Personal Note"}`,
                badge: "Note",
                icon: FileText,
                onSelect: () => {
                  navigate({ to: "/app/notes" });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 2. Search Flashcards
          const { data: decks } = await supabase
            .from("flashcard_decks")
            .select("id, title, subject")
            .or(`title.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%`)
            .limit(5);

          if (decks) {
            decks.forEach((d) => {
              results.push({
                id: `sd_${d.id}`,
                category: "My Flashcards",
                title: d.title,
                subtitle: `Subject: ${d.subject || "General"}`,
                badge: "Deck",
                icon: Layers,
                onSelect: () => {
                  navigate({ to: "/app/flashcards" });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 3. Search Library Materials
          const { data: mats } = await supabase
            .from("materials")
            .select("id, title, type, content")
            .or(`title.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%`)
            .limit(5);

          if (mats) {
            mats.forEach((m) => {
              results.push({
                id: `sm_${m.id}`,
                category: "Library Materials",
                title: m.title,
                subtitle: `Type: ${m.type}`,
                badge: m.type,
                icon: BookOpen,
                onSelect: () => {
                  navigate({ to: "/app/library" });
                  setIsSearchOpen(false);
                },
              });
            });
          }

          // 4. Search Brain Teasers & Quizzes
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id, title")
            .ilike("title", `%${cleanQ}%`)
            .limit(4);

          if (quizzes) {
            quizzes.forEach((qz) => {
              results.push({
                id: `sq_${qz.id}`,
                category: "Practice Challenges",
                title: qz.title,
                subtitle: "Interactive evaluation test",
                badge: "Quiz",
                icon: Gamepad2,
                onSelect: () => {
                  navigate({ to: "/app/teasers" });
                  setIsSearchOpen(false);
                },
              });
            });
          }
        }

        if (isCurrent) {
          setSearchResults(results);
          setSelectedSearchIndex(0);
        }
      } catch (err) {
      } finally {
        if (isCurrent) setIsSearching(false);
      }
    };

    const timer = setTimeout(executeSearch, 150);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery, userRole, pathname]);

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
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setShortcutModalOpen(false);
        setIsSearchOpen(false);
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
            .select("name, avatar_url, role, approval_status")
            .eq("id", userId)
            .maybeSingle();

          if (prof?.approval_status === "banned") {
            await supabase.auth.signOut();
            localStorage.removeItem("user_profile");
            toast.error("Your account has been suspended by an administrator.");
            navigate({ to: "/auth/sign-in" as any });
            return;
          }

          let finalName = "";
          let finalAvatar: string | null = null;

          if (profErr || !prof) {
            const newName = userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0] || "Student User";
            const newAvatar = userData.user.user_metadata?.avatar_url || userData.user.user_metadata?.picture || null;
            const { data: createdProf } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                name: newName,
                email: userData.user.email || "",
                role: "student",
                avatar_url: newAvatar,
              })
              .select("name, avatar_url, role")
              .maybeSingle();

            if (createdProf) {
              finalName = createdProf.name || "Student User";
              finalAvatar = createdProf.avatar_url || null;
              if (createdProf.role) setUserRole(createdProf.role);
            }
          } else {
            finalName = prof.name || "Student User";
            finalAvatar = prof.avatar_url || null;
            if (prof.role) setUserRole(prof.role);
            
            // Backfill avatar if missing in DB but exists in auth metadata
            const metaAvatar = userData.user.user_metadata?.avatar_url || userData.user.user_metadata?.picture;
            if (!finalAvatar && metaAvatar) {
              finalAvatar = metaAvatar;
              await supabase.from("profiles").update({ avatar_url: finalAvatar }).eq("id", userId);
            }
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
          }
          setTier(finalTier);

          // Fetch dynamic notifications from Supabase
          const loadedNotifications: NotificationItem[] = [];
          const isAdmin = prof?.role === "admin";

          // 1. Fetch live activity logs as notifications (Admin gets all, users get their own)
          try {
            let logsQuery = supabase
              .from("user_logs")
              .select("id, action_type, details, created_at, user_id, profiles(name, email)")
              .order("created_at", { ascending: false })
              .limit(isAdmin ? 30 : 15);

            if (!isAdmin) {
              logsQuery = logsQuery.eq("user_id", userId);
            }

            const { data: dbLogs } = await logsQuery;

            if (dbLogs) {
              dbLogs.forEach((log: any) => {
                const profileName = log.profiles?.name || (log.profiles?.email ? log.profiles.email.split("@")[0] : null);
                const userPrefix = isAdmin && profileName ? `${profileName}: ` : "";
                
                let icon = "activity";
                let title = "Platform Activity";
                let message = log.details || "Activity recorded in database.";

                switch (log.action_type) {
                  case "ai_tutor_query":
                    icon = "ai_tutor";
                    title = isAdmin ? `${userPrefix}AI Tutor Query` : "AI Tutor Session";
                    message = "Completed an adaptive cognitive tutoring session.";
                    break;
                  case "quiz_submission":
                    icon = "quiz";
                    title = isAdmin ? `${userPrefix}Quiz Submitted` : "Quiz Completed";
                    message = "Evaluation quiz submitted with confidence rating.";
                    break;
                  case "flashcard_review":
                    icon = "flashcard";
                    title = isAdmin ? `${userPrefix}Flashcard Review` : "Flashcard Session";
                    message = "Completed active recall spaced retrieval review.";
                    break;
                  case "note_created":
                    icon = "note";
                    title = isAdmin ? `${userPrefix}Note Saved` : "Note Saved";
                    message = "Recorded new study notes in digital notebook.";
                    break;
                  case "material_viewed":
                    icon = "material";
                    title = isAdmin ? `${userPrefix}Material Opened` : "Study Material Viewed";
                    message = "Accessed course module and learning materials.";
                    break;
                  case "confidence_logged":
                    icon = "confidence";
                    title = isAdmin ? `${userPrefix}Telemetry Logged` : "Confidence Rating Logged";
                    message = "Logged self-rated understanding metric.";
                    break;
                  case "voice_tutor_call":
                    icon = "voice";
                    title = isAdmin ? `${userPrefix}Voice Call` : "Voice Tutor Session";
                    message = "Interactive AI voice conversation completed.";
                    break;
                  case "login":
                    icon = "login";
                    title = isAdmin ? `${userPrefix}User Login` : "Successful Login";
                    message = "Account session authenticated.";
                    break;
                  case "student_registered":
                    icon = "user";
                    title = isAdmin ? `${userPrefix}New Registration` : "Account Created";
                    message = "Student profile registered on platform.";
                    break;
                  default:
                    icon = "activity";
                    title = isAdmin ? `${userPrefix}${log.action_type.replace(/_/g, " ")}` : log.action_type.replace(/_/g, " ");
                    break;
                }

                // Relative time formatting
                const diffMs = Date.now() - new Date(log.created_at).getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                let timeStr = "Just now";
                if (diffDays > 0) timeStr = `${diffDays}d ago`;
                else if (diffHours > 0) timeStr = `${diffHours}h ago`;
                else if (diffMins > 0) timeStr = `${diffMins}m ago`;

                loadedNotifications.push({
                  id: `log_${log.id}`,
                  icon,
                  title,
                  message,
                  time: timeStr,
                });
              });
            }
          } catch (e) {
          }

          // 2. Fetch persistent direct notifications from notifications table
          try {
            const { data: dbNotifications } = await supabase
              .from("notifications")
              .select("id, title, message, icon, created_at, type")
              .eq("user_id", userId)
              .eq("is_read", false)
              .order("created_at", { ascending: false });

            if (dbNotifications) {
              dbNotifications.forEach((n: any) => {
                loadedNotifications.unshift({
                  id: n.id,
                  icon: "bell",
                  title: n.title,
                  message: n.message,
                  time: new Date(n.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                });
              });
            }
          } catch (e) {
          }

          // 3. Fetch note share invitations
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
                loadedNotifications.unshift({
                  id: share.id,
                  icon: "share",
                  title: "Note Share Request",
                  message: `A classmate shared the note "${share.notes?.title || "Untitled"}" with you. Accept it from notes page!`,
                  time: "New Request",
                });
              });
            }
          } catch (e) {
          }

          // 4. Add streak notifications if streak exists
          try {
            const { data: stdProf } = await supabase
              .from("student_profiles")
              .select("xp")
              .eq("student_id", userId)
              .maybeSingle();

            if (stdProf && Number(stdProf.xp) > 0) {
              loadedNotifications.push({
                id: "xp_status",
                icon: "activity",
                title: `${stdProf.xp} Total XP!`,
                message: "You are making strong progress across your adaptive learning tracks.",
                time: "Level Info",
              });
            }
          } catch (e) {
          }

          // 5. Fallback welcome notification if empty
          if (loadedNotifications.length === 0) {
            loadedNotifications.push({
              id: "welcome_alert",
              icon: "ai_tutor",
              title: "Welcome to Purelearn!",
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
          }, 30000);
        }
      } catch (err) {
      }
    };

    loadProfile();

    // Subscribe to realtime updates on profiles & user_logs table safely
    const channelId = `shell-realtime-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_logs",
        },
        () => {
          // Re-load latest notifications when new activity occurs
          void loadProfile();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
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
            <img src="/logo.png" alt="Purelearn.ai Logo" className="h-7 sm:h-8 w-auto lg:hidden" />
            <img src="/logo.png" alt="Purelearn.ai Logo" className={`h-10 w-auto hidden ${isCollapsed ? '' : 'lg:block'}`} />
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

        <nav className="px-2 space-y-4">
          {(userRole === "admin" || pathname.startsWith("/admin")) && (
            <div>
              <div className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate lg:block ${isCollapsed ? "lg:hidden" : ""}`}>
                Admin Management
              </div>
              {adminNav.map((item) => {
                const active = pathname.startsWith("/admin") && currentAdminTab === item.tab;
                return (
                  <Link
                    key={item.tab}
                    to={item.to}
                    search={{ tab: item.tab }}
                    onClick={() => setOpen(false)}
                    className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-all lg:justify-start ${
                      isCollapsed ? "lg:justify-center" : "lg:justify-start"
                    } ${
                      active
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
                    <span className={`truncate lg:inline ${isCollapsed ? "lg:hidden" : ""}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {userRole === "teacher" && !pathname.startsWith("/admin") && (
            <Link
              to="/teacher"
              onClick={() => setOpen(false)}
              className={`mb-3 flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all border border-border bg-foreground text-background ${
                isCollapsed ? "lg:justify-center" : "lg:justify-start"
              }`}
              title="Educator Portal"
            >
              <BookOpen className="h-4 w-4 shrink-0 text-background" />
              <span className={`truncate lg:inline ${isCollapsed ? "lg:hidden" : ""}`}>
                Educator Portal
              </span>
            </Link>
          )}

          <div>
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
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
                <span className={`truncate lg:inline ${isCollapsed ? "lg:hidden" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          </div>
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
              {/* Functional Role-Based Search Input & Command Palette */}
              <div ref={searchContainerRef} className="relative">
                <div
                  onClick={() => {
                    setIsSearchOpen(true);
                    searchInputRef.current?.focus();
                  }}
                  className={`hidden items-center gap-2 rounded-xl border border-border bg-background/60 backdrop-blur-md px-3.5 py-2 text-sm text-muted-foreground md:flex md:w-80 lg:w-96 cursor-text transition-all duration-200 ${
                    isSearchOpen
                      ? "ring-2 ring-primary/40 border-primary/60 shadow-lg"
                      : "hover:border-border/80 focus-within:border-primary/50"
                  }`}
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    ref={searchInputRef}
                    id="global-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!isSearchOpen) setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedSearchIndex((prev) =>
                          searchResults.length > 0 ? (prev + 1) % searchResults.length : 0
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedSearchIndex((prev) =>
                          searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0
                        );
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (searchResults[selectedSearchIndex]) {
                          searchResults[selectedSearchIndex].onSelect();
                        }
                      } else if (e.key === "Escape") {
                        setIsSearchOpen(false);
                      }
                    }}
                    placeholder={
                      userRole === "admin" || pathname.startsWith("/admin")
                        ? "Search users, materials, telemetry logs, settings..."
                        : userRole === "teacher" || pathname.startsWith("/teacher")
                        ? "Search classrooms, materials, quizzes..."
                        : "Search notes, flashcards, documents, quizzes..."
                    }
                    className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground/70 flex-1 min-w-0"
                  />
                  {isSearching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                  ) : searchQuery ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    <Kbd className="shrink-0 bg-muted/60 text-xs px-1.5 py-0.5 rounded font-mono text-[10px]">
                      cmd + K
                    </Kbd>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && (
                  <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[480px] max-w-lg rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-border/40 p-2 z-50 animate-fade-in origin-top-left">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>
                        {searchQuery
                          ? `Search Results for "${searchQuery}"`
                          : `Quick Actions (${(userRole === "admin" || pathname.startsWith("/admin") ? "ADMIN" : userRole === "teacher" || pathname.startsWith("/teacher") ? "TEACHER" : "STUDENT")})`}
                      </span>
                      <span className="font-mono lowercase text-[9px] text-muted-foreground/70">
                        {searchResults.length} {searchResults.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className="mt-1 max-h-80 overflow-y-auto space-y-1 p-1">
                      {searchResults.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center">
                          <Search className="h-6 w-6 text-muted-foreground/50 mb-2" />
                          <div className="text-xs font-bold text-foreground">No matching items found</div>
                          <p className="text-[11px] text-muted-foreground mt-1 px-4">
                            Try searching for different keywords or explore your main workspace.
                          </p>
                        </div>
                      ) : (
                        searchResults.map((item, idx) => {
                          const IconComp = item.icon || Search;
                          const isSelected = idx === selectedSearchIndex;
                          return (
                            <div
                              key={item.id}
                              onClick={() => item.onSelect()}
                              onMouseEnter={() => setSelectedSearchIndex(idx)}
                              className={`flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? "bg-primary/15 border border-primary/20 text-foreground"
                                  : "hover:bg-muted/60 border border-transparent text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                    isSelected
                                      ? "bg-primary/20 border-primary/40 text-primary"
                                      : "bg-muted border-border text-muted-foreground"
                                  }`}
                                >
                                  <IconComp className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold truncate text-foreground">
                                      {item.title}
                                    </span>
                                    {item.badge && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-extrabold bg-muted text-muted-foreground border border-border shrink-0">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  {item.subtitle && (
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ArrowRight
                                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
                                  isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground/40"
                                }`}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="px-3 py-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono">
                      <span>Navigate: <kbd className="bg-muted px-1 py-0.5 rounded text-[9px]">↑</kbd> <kbd className="bg-muted px-1 py-0.5 rounded text-[9px]">↓</kbd></span>
                      <span>Select: <kbd className="bg-muted px-1 py-0.5 rounded text-[9px]">Enter</kbd></span>
                      <span>Close: <kbd className="bg-muted px-1 py-0.5 rounded text-[9px]">Esc</kbd></span>
                    </div>
                  </div>
                )}
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
                    <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] low-light:shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-border/40 p-4 z-40 animate-fade-in origin-top-right">
                      <div className="flex items-center justify-between pb-3 border-b border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Notifications</span>
                        <span
                          className="text-[9px] font-extrabold text-primary hover:underline cursor-pointer"
                          onClick={async () => {
                            setNotifications([]);
                            toast.success("All notifications marked as read.");
                            try {
                              const { data: userData } = await supabase.auth.getUser();
                              if (userData?.user) {
                                await supabase
                                  .from("notifications")
                                  .update({ is_read: true })
                                  .eq("user_id", userData.user.id);
                              }
                            } catch { /* ignored */ }
                          }}
                        >
                          Mark read
                        </span>
                      </div>
                      <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center flex flex-col items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 border border-border mb-2 text-muted-foreground">
                              <Bell className="h-5 w-5" />
                            </div>
                            <div className="text-[11px] font-bold text-foreground">All caught up!</div>
                            <p className="text-[10px] text-muted-foreground mt-1 px-4 leading-normal">
                              No new study suggestions or note invitations at this time. Go ahead and start a study session!
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const getNotificationIcon = (type: string) => {
                              switch (type) {
                                case "ai_tutor":
                                  return <Sparkles className="h-3.5 w-3.5 text-primary" />;
                                case "quiz":
                                  return <FileText className="h-3.5 w-3.5 text-blue-500" />;
                                case "flashcard":
                                  return <Layers className="h-3.5 w-3.5 text-amber-500" />;
                                case "note":
                                  return <FileText className="h-3.5 w-3.5 text-purple-500" />;
                                case "material":
                                  return <BookOpen className="h-3.5 w-3.5 text-emerald-500" />;
                                case "user":
                                  return <User className="h-3.5 w-3.5 text-indigo-500" />;
                                case "login":
                                  return <Key className="h-3.5 w-3.5 text-cyan-500" />;
                                case "share":
                                  return <Folder className="h-3.5 w-3.5 text-pink-500" />;
                                case "bell":
                                  return <Bell className="h-3.5 w-3.5 text-primary" />;
                                case "activity":
                                case "confidence":
                                case "voice":
                                default:
                                  return <Activity className="h-3.5 w-3.5 text-primary" />;
                              }
                            };

                            return (
                              <div
                                key={notification.id}
                                className="p-2.5 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/80 transition cursor-pointer"
                              >
                                <div className="flex gap-2.5 items-start">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/80 shadow-xs mt-0.5">
                                    {getNotificationIcon(notification.icon)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-bold text-foreground truncate">
                                      {notification.title}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                                      {notification.message}
                                    </p>
                                    <span className="text-[9px] text-primary mt-1 block font-medium">
                                      {notification.time}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
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
                    <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-64 max-w-xs rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] low-light:shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-border/40 p-2 z-40 animate-fade-in origin-top-right">
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
                    <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-56 max-w-xs rounded-xl border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-border/30 p-1.5 z-40 animate-fade-in origin-top-right">

                      {/* User identity header */}
                      <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                        <div className="text-sm font-semibold text-foreground truncate">{profile?.name || "Scholar User"}</div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">Logged in</div>
                      </div>

                      {/* Nav items */}
                      <div className="space-y-0.5">
                        <Link
                          to="/app/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          My Profile
                        </Link>
                        <Link
                          to="/app/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                          Preferences
                        </Link>
                        <Link
                          to="/app/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          Billing &amp; Plan
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-border/50 mt-1 pt-1">
                        <button
                          onClick={async () => {
                            setShowUserDropdown(false);
                            await supabase.auth.signOut();
                            localStorage.clear();
                            window.location.href = "/auth/sign-in";
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
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
