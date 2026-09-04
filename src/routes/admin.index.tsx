import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui-kit";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Users,
  FileText,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Search,
  Sparkles,
  Download,
  Layers,
  Ban,
  Trash2,
  Shield,
  Sliders,
  Database,
  Key,
  FileUp,
  Save,
  Check,
  Zap,
  Activity,
  AlertTriangle,
  Globe,
  Settings as SettingsIcon,
  X,
  Loader2,
  Mail,
  Calendar,
  Building,
  MessageSquare,
} from "lucide-react";
import {
  saveSystemApiKeyToDb,
  fetchSystemApiKeyFromDb,
} from "@/lib/gemini";

type AdminMenuTab = "overview" | "demos" | "users" | "materials" | "flashcards" | "analytics" | "logs" | "settings";

type AdminSearch = {
  tab?: AdminMenuTab;
};

export const Route = createFileRoute("/admin/")({
  validateSearch: (search: Record<string, unknown>): AdminSearch => {
    return {
      tab: (search.tab as AdminMenuTab) || "overview",
    };
  },
  head: () => ({ meta: [{ title: "System Admin Dashboard — purelearn.ai" }] }),
  component: AdminPortal,
});

// Utility function to export database tables to CSV format
const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  try {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${String(field || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename} successfully!`);
  } catch (err: any) {
    toast.error("Could not generate CSV export.");
  }
};

const ITEMS_PER_PAGE = 20;

export function AdminPortal() {
  const navigate = useNavigate();

  // Reactive URL Search tab synchronization via TanStack Router
  const search = Route.useSearch();
  const activeTab: AdminMenuTab = search.tab && ["overview", "demos", "users", "materials", "flashcards", "analytics", "logs", "settings"].includes(search.tab)
    ? search.tab
    : "overview";

  // System-wide live Database metrics (ZERO MOCK DATA)
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [activeClassrooms, setActiveClassrooms] = useState<number>(0);
  const [materialsCount, setMaterialsCount] = useState<number>(0);
  const [quizzesCount, setQuizzesCount] = useState<number>(0);
  const [quizAttemptsCount, setQuizAttemptsCount] = useState<number>(0);
  const [pendingTeacherCount, setPendingTeacherCount] = useState<number>(0);

  // Live Database lists
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");

  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>("all");

  const [flashcardDecksList, setFlashcardDecksList] = useState<any[]>([]);
  const [flashcardSearchQuery, setFlashcardSearchQuery] = useState<string>("");

  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>("all");

  // Demo Requests States
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [demosCount, setDemosCount] = useState<number>(0);
  const [pendingDemosCount, setPendingDemosCount] = useState<number>(0);
  const [demoSearchQuery, setDemoSearchQuery] = useState<string>("");
  const [demoStatusFilter, setDemoStatusFilter] = useState<string>("all");
  const [demosPage, setDemosPage] = useState<number>(1);
  const [selectedDemoDetail, setSelectedDemoDetail] = useState<any | null>(null);
  const [isUpdatingDemoStatus, setIsUpdatingDemoStatus] = useState<string | null>(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState<string>("");

  // Table Pagination States
  const [usersPage, setUsersPage] = useState(1);
  const [materialsPage, setMaterialsPage] = useState(1);
  const [flashcardsPage, setFlashcardsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  // System Settings States (Synced directly to Supabase system_settings table)
  const [systemApiKey, setSystemApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [aiTemperature, setAiTemperature] = useState("0.7");

  const [teacherApprovalMode, setTeacherApprovalMode] = useState("manual");
  const [defaultCognitiveProfile, setDefaultCognitiveProfile] = useState("standard");
  const [maxClassEnrollment, setMaxClassEnrollment] = useState("50");

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxUploadSize, setMaxUploadSize] = useState("25");
  const [loggingLevel, setLoggingLevel] = useState("standard");

  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Modal Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText?: string;
    variant: "danger" | "warning" | "primary";
    icon: "trash" | "ban" | "alert" | "check";
    onConfirm: () => Promise<void> | void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    icon: "alert",
    onConfirm: () => {},
    isLoading: false,
  });

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
  };

  // Reset pagination pages on filter changes
  useEffect(() => {
    setUsersPage(1);
  }, [userRoleFilter, userSearchQuery]);

  useEffect(() => {
    setMaterialsPage(1);
  }, [materialTypeFilter]);

  useEffect(() => {
    setFlashcardsPage(1);
  }, [flashcardSearchQuery]);

  useEffect(() => {
    setLogsPage(1);
  }, [logFilter]);

  // Load all live system-wide database statistics and system_settings
  const fetchWholeSystemData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch User Profiles metrics & full directory
      const { count: uCount, data: uData } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (uCount !== null) setTotalUsers(uCount);
      if (uData) {
        setUsersList(uData);
        const sCount = uData.filter((u) => u.role === "student").length;
        const tCount = uData.filter((u) => u.role === "teacher").length;
        const pCount = uData.filter((u) => u.role === "teacher" && u.approval_status === "pending").length;
        setStudentCount(sCount);
        setTeacherCount(tCount);
        setPendingTeacherCount(pCount);
      }

      // 2. Fetch Classrooms metric
      const { count: cCount } = await supabase
        .from("classrooms")
        .select("*", { count: "exact", head: true });
      if (cCount !== null) setActiveClassrooms(cCount);

      // 3. Fetch Materials metric & directory across the ENTIRE system
      const { count: mCount, data: mData } = await supabase
        .from("materials")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (mCount !== null) setMaterialsCount(mCount);
      if (mData) setMaterialsList(mData);

      // 4. Fetch Flashcard Decks across the system (graceful fallback if table is omitted)
      let fcData: any[] | null = null;
      try {
        const { data } = await supabase
          .from("flashcard_decks")
          .select("*, profiles(name, email)")
          .order("created_at", { ascending: false });
        fcData = data;
      } catch {
        // Table not provisioned in current schema — fall back to AI note flashcards
      }

      const { data: notesData } = await supabase
        .from("notes")
        .select("id, title, subject, created_at, student_id, content, profiles(name, email)")
        .order("created_at", { ascending: false });

      const combinedDecks: any[] = [];
      if (fcData) {
        fcData.forEach((d) => {
          combinedDecks.push({
            id: d.id,
            title: d.title,
            subject: d.subject || "General",
            cardsCount: Array.isArray(d.cards) ? d.cards.length : 0,
            authorName: d.profiles?.name || "User",
            authorEmail: d.profiles?.email || "N/A",
            created_at: d.created_at,
            source: "Database Deck",
          });
        });
      }

      if (notesData) {
        notesData.forEach((n) => {
          if (n.content && n.content.includes("[FLASHCARDS]")) {
            const profileObj = Array.isArray(n.profiles) ? n.profiles[0] : n.profiles;
            combinedDecks.push({
              id: `note_${n.id}`,
              title: n.title,
              subject: n.subject || "Study Note",
              cardsCount: (n.content.match(/Q:/g) || []).length || 5,
              authorName: (profileObj as any)?.name || "Student",
              authorEmail: (profileObj as any)?.email || "N/A",
              created_at: n.created_at,
              source: "AI Note Deck",
            });
          }
        });
      }
      setFlashcardDecksList(combinedDecks);

      // 5. Fetch Quizzes & Quiz Attempts metrics for System Analytics
      const { count: qCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true });
      if (qCount !== null) setQuizzesCount(qCount);

      const { count: qaCount } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true });
      if (qaCount !== null) setQuizAttemptsCount(qaCount);

      // 6. Fetch User Audit Logs (Up to 1000 recent logs for live weekly analytics)
      const { data: lData } = await supabase
        .from("user_logs")
        .select("id, action_type, details, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (lData) setUserLogs(lData);

      // 7. Fetch Institutional & User Demo Requests
      try {
        const { count: dCount, data: dData } = await supabase
          .from("demo_requests")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (dCount !== null) setDemosCount(dCount);
        if (dData) {
          setDemoRequests(dData);
          setPendingDemosCount(dData.filter((d) => d.status === "pending").length);
        }
      } catch (dErr) {
        console.warn("Could not fetch demo requests:", dErr);
      }

      // 8. Fetch Global System Gemini API Key & App Settings from Supabase system_settings
      const dbKey = await fetchSystemApiKeyFromDb();
      setSystemApiKey(dbKey || import.meta.env.VITE_GEMINI_API_KEY || "");

      const { data: settingsData } = await supabase.from("system_settings").select("key, value");
      if (settingsData) {
        settingsData.forEach((s) => {
          if (s.key === "system_api_key" && s.value) setSystemApiKey(s.value);
          if (s.key === "ai_model") setAiModel(s.value);
          if (s.key === "ai_temperature") setAiTemperature(s.value);
          if (s.key === "teacher_approval_mode") setTeacherApprovalMode(s.value);
          if (s.key === "default_cognitive_profile") setDefaultCognitiveProfile(s.value);
          if (s.key === "max_class_enrollment") setMaxClassEnrollment(s.value);
          if (s.key === "maintenance_mode") setMaintenanceMode(s.value === "true");
          if (s.key === "max_upload_size") setMaxUploadSize(s.value);
          if (s.key === "logging_level") setLoggingLevel(s.value);
        });
      }
    } catch (err: any) {
      console.warn("Error loading system-wide admin data:", err);
      toast.error("Failed to load database records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWholeSystemData();
  }, []);

  // Modal-driven Prompt for Delete User with Instant Optimistic UI + Database Execution
  const promptDeleteUser = (user: { id: string; name?: string; email?: string; role?: string }) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently Delete User",
      description: `Are you sure you want to permanently delete "${user.name || "User"}" (${user.email || "No email"})? All associated student records, note shares, and study telemetry will be removed from the system.`,
      confirmText: "Delete User",
      cancelText: "Cancel",
      variant: "danger",
      icon: "trash",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isLoading: true }));
        
        // 1. Instant Optimistic UI Update
        setUsersList((prev) => prev.filter((u) => u.id !== user.id));
        setTotalUsers((prev) => Math.max(0, prev - 1));
        if (user.role === "student") setStudentCount((prev) => Math.max(0, prev - 1));
        if (user.role === "teacher") setTeacherCount((prev) => Math.max(0, prev - 1));

        try {
          // Try RPC first for clean cascade
          const { error: rpcErr } = await supabase.rpc("admin_delete_user", {
            target_user_id: user.id,
          });

          if (rpcErr) {
            // Fallback direct delete
            await supabase.from("classroom_students").delete().eq("student_id", user.id);
            await supabase.from("quiz_attempts").delete().eq("student_id", user.id);
            await supabase.from("notes").delete().eq("student_id", user.id);
            await supabase.from("flashcard_decks").delete().eq("user_id", user.id);
            await supabase.from("materials").delete().eq("uploaded_by", user.id);
            await supabase.from("user_logs").delete().eq("user_id", user.id);
            const { error: directErr } = await supabase.from("profiles").delete().eq("id", user.id);
            if (directErr) throw directErr;
          }

          toast.success(`User "${user.name || "User"}" permanently deleted.`);
          closeConfirmModal();
          void fetchWholeSystemData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user account.");
          setConfirmModal((p) => ({ ...p, isLoading: false }));
          // Re-sync on failure
          void fetchWholeSystemData();
        }
      },
    });
  };

  // Modal-driven Prompt for Ban / Unban User with Instant Optimistic UI + Database Execution
  const promptBanUser = (user: { id: string; name?: string; email?: string; approval_status?: string }) => {
    const isBanned = user.approval_status === "banned";
    const nextStatus = isBanned ? "approved" : "banned";

    setConfirmModal({
      isOpen: true,
      title: isBanned ? "Unban User Account" : "Ban User Account",
      description: isBanned
        ? `Restore full platform access for "${user.name || "User"}" (${user.email || ""})? They will be able to log in and participate in classrooms again.`
        : `Are you sure you want to ban "${user.name || "User"}" (${user.email || ""})? The account will be immediately blocked from signing in or accessing the AI tutor.`,
      confirmText: isBanned ? "Unban Account" : "Ban Account",
      cancelText: "Cancel",
      variant: isBanned ? "primary" : "warning",
      icon: "ban",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isLoading: true }));

        // 1. Instant Optimistic UI Update
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, approval_status: nextStatus } : u
          )
        );

        try {
          // Try RPC first
          const { error: rpcErr } = await supabase.rpc("admin_set_user_status", {
            target_user_id: user.id,
            new_status: nextStatus,
          });

          if (rpcErr) {
            // Direct update fallback
            const { error: directErr } = await supabase
              .from("profiles")
              .update({ approval_status: nextStatus, updated_at: new Date().toISOString() })
              .eq("id", user.id);

            if (directErr) throw directErr;
          }

          toast.success(`User account ${isBanned ? "unbanned" : "banned"} successfully!`);
          closeConfirmModal();
          void fetchWholeSystemData();
        } catch (err: any) {
          toast.error(err.message || "Failed to update ban status.");
          setConfirmModal((p) => ({ ...p, isLoading: false }));
          void fetchWholeSystemData();
        }
      },
    });
  };

  // Modal-driven Prompt for Verify Teacher
  const promptVerifyTeacher = (teacher: { id: string; name?: string; email?: string }, status: "approved" | "rejected") => {
    const isApprove = status === "approved";
    setConfirmModal({
      isOpen: true,
      title: isApprove ? "Approve Educator Verification" : "Reject Educator Verification",
      description: isApprove
        ? `Grant educator privileges to "${teacher.name || "Teacher"}" (${teacher.email || ""})? They will be able to create classrooms, assign quizzes, and view student telemetry.`
        : `Reject educator application for "${teacher.name || "Teacher"}" (${teacher.email || ""})?`,
      confirmText: isApprove ? "Approve Educator" : "Reject Educator",
      cancelText: "Cancel",
      variant: isApprove ? "primary" : "warning",
      icon: isApprove ? "check" : "alert",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isLoading: true }));
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ approval_status: status })
            .eq("id", teacher.id);

          if (error) throw error;
          toast.success(`Educator account ${status}!`);
          closeConfirmModal();
          fetchWholeSystemData();
        } catch (err: any) {
          toast.error(err.message || "Failed to update educator status.");
          setConfirmModal((p) => ({ ...p, isLoading: false }));
        }
      },
    });
  };

  // Modal-driven Prompt for Material Deletion
  const promptDeleteMaterial = (mat: { id: string; title: string }) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Study Material",
      description: `Are you sure you want to permanently delete "${mat.title}"? Classrooms and students will no longer be able to access this resource.`,
      confirmText: "Delete Material",
      cancelText: "Cancel",
      variant: "danger",
      icon: "trash",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isLoading: true }));
        try {
          const { error } = await supabase
            .from("materials")
            .delete()
            .eq("id", mat.id);

          if (error) throw error;
          toast.success(`Material "${mat.title}" deleted.`);
          closeConfirmModal();
          fetchWholeSystemData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete study material.");
          setConfirmModal((p) => ({ ...p, isLoading: false }));
        }
      },
    });
  };

  // Modal-driven Prompt for Flashcard Deck Deletion
  const promptDeleteFlashcard = (deck: { id: string; title: string }) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Flashcard Deck",
      description: `Are you sure you want to permanently delete flashcard deck "${deck.title}"?`,
      confirmText: "Delete Deck",
      cancelText: "Cancel",
      variant: "danger",
      icon: "trash",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isLoading: true }));
        try {
          if (deck.id.startsWith("note_")) {
            const noteId = deck.id.replace("note_", "");
            const { error } = await supabase.from("notes").delete().eq("id", noteId);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("flashcard_decks").delete().eq("id", deck.id);
            if (error) throw error;
          }
          toast.success(`Deck "${deck.title}" deleted.`);
          closeConfirmModal();
          fetchWholeSystemData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete flashcard deck.");
          setConfirmModal((p) => ({ ...p, isLoading: false }));
        }
      },
    });
  };

  // Handle saving global Gemini API key to Supabase system_settings
  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    const res = await saveSystemApiKeyToDb(systemApiKey);
    setIsSavingKey(false);

    if (res.success) {
      toast.success("Global System API Key updated in database!");
      fetchWholeSystemData();
    } else {
      toast.error(`Save error: ${res.error || "Failed to update database key."}`);
    }
  };

  // Handle saving ALL Application Settings live to Supabase system_settings database
  const handleSaveAllSettings = async () => {
    setIsSavingSettings(true);
    try {
      const settingsPayload = [
        { key: "system_api_key", value: systemApiKey },
        { key: "ai_model", value: aiModel },
        { key: "ai_temperature", value: aiTemperature },
        { key: "teacher_approval_mode", value: teacherApprovalMode },
        { key: "default_cognitive_profile", value: defaultCognitiveProfile },
        { key: "max_class_enrollment", value: maxClassEnrollment },
        { key: "maintenance_mode", value: String(maintenanceMode) },
        { key: "max_upload_size", value: maxUploadSize },
        { key: "logging_level", value: loggingLevel },
      ];

      for (const item of settingsPayload) {
        await supabase.from("system_settings").upsert({
          key: item.key,
          value: item.value,
          updated_at: new Date().toISOString(),
        });
      }

      if (systemApiKey.trim()) {
        await saveSystemApiKeyToDb(systemApiKey.trim());
      }

      toast.success("All Application Settings saved live to Supabase database!");
    } catch (err: any) {
      toast.error("Could not save settings to database.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filtered Users List & Paginated Data
  const filteredUsers = usersList.filter((user) => {
    const matchesRole =
      userRoleFilter === "all"
        ? true
        : userRoleFilter === "pending"
        ? user.role === "teacher" && user.approval_status === "pending"
        : userRoleFilter === "banned"
        ? user.approval_status === "banned"
        : user.role === userRoleFilter;

    const matchesSearch =
      !userSearchQuery.trim() ||
      (user.name && user.name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase()));

    return matchesRole && matchesSearch;
  });

  const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);

  // Filtered Materials List & Paginated Data
  const filteredMaterials = materialsList.filter((mat) => {
    if (materialTypeFilter === "all") return true;
    return mat.type === materialTypeFilter || mat.source_kind === materialTypeFilter;
  });

  const totalMaterialsPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE) || 1;
  const paginatedMaterials = filteredMaterials.slice((materialsPage - 1) * ITEMS_PER_PAGE, materialsPage * ITEMS_PER_PAGE);

  // Filtered Flashcards List & Paginated Data
  const filteredFlashcards = flashcardDecksList.filter((fc) => {
    if (!flashcardSearchQuery.trim()) return true;
    const q = flashcardSearchQuery.toLowerCase();
    return (
      (fc.title && fc.title.toLowerCase().includes(q)) ||
      (fc.subject && fc.subject.toLowerCase().includes(q)) ||
      (fc.authorName && fc.authorName.toLowerCase().includes(q))
    );
  });

  const totalFlashcardsPages = Math.ceil(filteredFlashcards.length / ITEMS_PER_PAGE) || 1;
  const paginatedFlashcards = filteredFlashcards.slice((flashcardsPage - 1) * ITEMS_PER_PAGE, flashcardsPage * ITEMS_PER_PAGE);

  // Filtered Logs List & Paginated Data
  const filteredLogs = userLogs.filter((log) => {
    if (logFilter === "all") return true;
    return log.action_type === logFilter;
  });

  const totalLogsPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice((logsPage - 1) * ITEMS_PER_PAGE, logsPage * ITEMS_PER_PAGE);

  // Filtered Demo Requests & Paginated Data
  const filteredDemos = demoRequests.filter((d) => {
    if (demoStatusFilter !== "all" && d.status !== demoStatusFilter) return false;
    if (!demoSearchQuery.trim()) return true;
    const q = demoSearchQuery.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.organization && d.organization.toLowerCase().includes(q)) ||
      (d.role && d.role.toLowerCase().includes(q)) ||
      (d.use_case && d.use_case.toLowerCase().includes(q))
    );
  });

  const totalDemosPages = Math.ceil(filteredDemos.length / ITEMS_PER_PAGE) || 1;
  const paginatedDemos = filteredDemos.slice((demosPage - 1) * ITEMS_PER_PAGE, demosPage * ITEMS_PER_PAGE);

  // Update Demo Request Status
  const handleUpdateDemoStatus = async (id: string, newStatus: string) => {
    setIsUpdatingDemoStatus(id);
    setDemoRequests((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    try {
      const { error } = await supabase
        .from("demo_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Demo marked as "${newStatus}"`);
      setPendingDemosCount(demoRequests.filter((d) => (d.id === id ? newStatus : d.status) === "pending").length);
    } catch (e) {
      toast.error("Failed to update demo status");
      fetchWholeSystemData();
    } finally {
      setIsUpdatingDemoStatus(null);
    }
  };

  // Save Admin Notes on Demo Request
  const handleSaveDemoNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("demo_requests")
        .update({ admin_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      setDemoRequests((prev) =>
        prev.map((d) => (d.id === id ? { ...d, admin_notes: notes } : d))
      );
      if (selectedDemoDetail && selectedDemoDetail.id === id) {
        setSelectedDemoDetail({ ...selectedDemoDetail, admin_notes: notes });
      }
      toast.success("Admin notes saved successfully!");
    } catch (e) {
      toast.error("Failed to save admin notes");
    }
  };

  // Delete Demo Request Prompt
  const promptDeleteDemo = (demo: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Demo Request",
      description: `Are you sure you want to delete the demo request from "${demo.name}" (${demo.email})?`,
      confirmText: "Delete Request",
      cancelText: "Cancel",
      variant: "danger",
      icon: "trash",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isLoading: true }));
        setDemoRequests((prev) => prev.filter((d) => d.id !== demo.id));
        setDemosCount((prev) => Math.max(0, prev - 1));
        try {
          const { error } = await supabase.from("demo_requests").delete().eq("id", demo.id);
          if (error) throw error;
          toast.success("Demo request deleted.");
        } catch (e) {
          toast.error("Failed to delete demo request.");
          fetchWholeSystemData();
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  // DYNAMIC WEEKLY ACTIVITY STRICTLY DERIVED FROM REAL LIVE USER LOGS (NO MOCK DATA)
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
  userLogs.forEach((log) => {
    if (log.created_at) {
      const d = new Date(log.created_at).getDay();
      dayCounts[d] += 1;
    }
  });

  const realWeeklyData = [
    { day: "Mon", count: dayCounts[1] },
    { day: "Tue", count: dayCounts[2] },
    { day: "Wed", count: dayCounts[3] },
    { day: "Thu", count: dayCounts[4] },
    { day: "Fri", count: dayCounts[5] },
    { day: "Sat", count: dayCounts[6] },
    { day: "Sun", count: dayCounts[0] },
  ];
  const maxWeekly = Math.max(...realWeeklyData.map((d) => d.count), 1);

  // DYNAMIC PIE CHART CONIC GRADIENT FOR USER ROLE RATIO
  const studentPercent = totalUsers > 0 ? Math.round((studentCount / totalUsers) * 100) : 0;
  const teacherPercent = totalUsers > 0 ? Math.round((teacherCount / totalUsers) * 100) : 0;
  const pendingPercent = totalUsers > 0 ? Math.round((pendingTeacherCount / totalUsers) * 100) : 0;

  const pieConicGradient = totalUsers > 0
    ? `conic-gradient(
        currentColor 0% ${studentPercent}%,
        #888888 ${studentPercent}% ${studentPercent + teacherPercent}%,
        #f59e0b ${studentPercent + teacherPercent}% 100%
      )`
    : `#e5e7eb`;

  // Export CSV functions for current active tab
  const handleExportCurrentTab = () => {
    if (activeTab === "users" || activeTab === "overview") {
      exportToCsv(
        `purelearn_users_${new Date().toISOString().slice(0, 10)}.csv`,
        ["User ID", "Name", "Email", "Role", "Approval Status", "Created Date"],
        filteredUsers.map((u) => [u.id, u.name || "User", u.email, u.role, u.approval_status || "approved", u.created_at]),
      );
    } else if (activeTab === "materials") {
      exportToCsv(
        `purelearn_materials_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Material ID", "Title", "Type", "Source Kind", "Uploaded Date"],
        filteredMaterials.map((m) => [m.id, m.title, m.type, m.source_kind || "file", m.created_at]),
      );
    } else if (activeTab === "flashcards") {
      exportToCsv(
        `purelearn_flashcard_decks_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Deck ID", "Title", "Subject", "Cards Count", "Author", "Created Date"],
        filteredFlashcards.map((fc) => [fc.id, fc.title, fc.subject, fc.cardsCount, fc.authorName, fc.created_at]),
      );
    } else if (activeTab === "demos") {
      exportToCsv(
        `purelearn_demo_requests_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Request ID", "Name", "Email", "Role", "Organization", "Learners", "Preferred Date", "Status", "Notes", "Submitted Date"],
        filteredDemos.map((d) => [d.id, d.name, d.email, d.role, d.organization || "Independent", d.team_size || "", d.preferred_date || "", d.status, d.admin_notes || "", d.created_at]),
      );
    } else if (activeTab === "logs") {
      exportToCsv(
        `purelearn_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Log ID", "Timestamp", "Action Type", "User ID", "Details"],
        filteredLogs.map((l) => [l.id, l.created_at, l.action_type, l.user_id || "System", l.details || ""]),
      );
    } else if (activeTab === "analytics") {
      exportToCsv(
        `purelearn_analytics_summary_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Metric Name", "Value", "Description"],
        [
          ["Total System Users", totalUsers, "All registered user accounts"],
          ["Demo Requests", demosCount, "Total institutional and user demo requests"],
          ["Pending Demos", pendingDemosCount, "Demo requests awaiting response"],
          ["Students Count", studentCount, "Enrolled student accounts"],
          ["Teachers Count", teacherCount, "Verified teacher accounts"],
          ["Pending Verification", pendingTeacherCount, "Teacher accounts awaiting admin review"],
          ["Active Classrooms", activeClassrooms, "Created classroom instances"],
          ["System Study Materials", materialsCount, "Uploaded learning documents"],
          ["Flashcard Decks", flashcardDecksList.length, "System-wide flashcard study decks"],
          ["Quizzes Created", quizzesCount, "Published evaluation quizzes"],
          ["Quiz Attempts", quizAttemptsCount, "Student quiz submissions"],
        ],
      );
    } else {
      toast.info("Select Demos, Users, Materials, Flashcards, Analytics, or Logs to export CSV data.");
    }
  };

  return (
    <AppShell title="System Admin Dashboard">
      {/* Full width container with uniform design system & typography */}
      <div className="space-y-6 w-full">
        {/* Main Content Action Toolbar (Above Stats Cards) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
              {activeTab === "overview" && "System Overview"}
              {activeTab === "demos" && "Institutional & User Demo Requests"}
              {activeTab === "users" && "User Directory & Management"}
              {activeTab === "materials" && "Platform Study Materials"}
              {activeTab === "flashcards" && "System Flashcard Decks"}
              {activeTab === "analytics" && "System Telemetry & Analytics"}
              {activeTab === "logs" && "System Security & Audit Logs"}
              {activeTab === "settings" && "Global Application Settings"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live database records fetched directly from Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchWholeSystemData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-colors shadow-sm"
              title="Refresh database records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={handleExportCurrentTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-foreground text-background hover:opacity-90 text-xs font-bold transition-opacity shadow-sm"
              title="Export CSV data"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── 1. OVERVIEW MENU TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6 w-full">
            {/* System Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Total System Users
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {totalUsers}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground flex justify-between">
                  <span>Students: {studentCount}</span>
                  <span>Teachers: {teacherCount}</span>
                </div>
              </Card>

              {/* Demo Inquiries Card */}
              <Card
                className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors cursor-pointer group"
                onClick={() => navigate({ to: "/admin", search: { tab: "demos" } })}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        Demo Requests
                      </p>
                      {pendingDemosCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {pendingDemosCount} New
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {demosCount}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Pending: {pendingDemosCount}</span>
                  <span className="font-semibold text-primary group-hover:underline">View Demos →</span>
                </div>
              </Card>

              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Active Classrooms
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {activeClassrooms}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  Classrooms active in database
                </div>
              </Card>

              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      System Flashcards
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {flashcardDecksList.length}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  Whole system flashcard sets
                </div>
              </Card>

              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Pending Approvals
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {pendingTeacherCount}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  {pendingTeacherCount > 0 ? "Pending verification action" : "All educators verified"}
                </div>
              </Card>
            </div>

            {/* System Charts Row — Live Activity Bar Chart & Donut Pie Chart for User Ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Chart 1: System Activity & Query Trends (Real Database Data) */}
              <Card className="lg:col-span-2 p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      Weekly System Telemetry & Activity (Live Data)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Platform queries, AI tutor calls, and user actions logged in database.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-foreground">
                    Live Logs: {userLogs.length}
                  </span>
                </div>

                {/* Slim & Sleek Dynamic Monochrome Bar Chart */}
                <div className="h-48 pt-6 flex items-end justify-between gap-2 px-4">
                  {realWeeklyData.map((d) => {
                    const heightPercent = maxWeekly > 0 ? Math.round((d.count / maxWeekly) * 100) : 0;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="text-[10px] font-mono font-bold text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.count}
                        </div>
                        <div
                          className="w-7 sm:w-9 bg-muted border border-border/80 rounded-t-md overflow-hidden flex items-end justify-center transition-all group-hover:border-foreground shadow-sm"
                          style={{ height: `${Math.max(15, heightPercent)}%` }}
                        >
                          <div className="w-full bg-foreground/40 group-hover:bg-foreground h-full transition-all" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Chart 2: User Role Ratio PIE CHART */}
              <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    User Role Ratio (Pie Chart)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live platform composition across roles.
                  </p>
                </div>

                {/* High-Contrast Donut Pie Chart */}
                <div className="py-2 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 rounded-full flex items-center justify-center border border-border/80 shadow-sm transition-all">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: pieConicGradient }}
                    />
                    {/* Donut Hole */}
                    <div className="relative z-10 w-20 h-20 rounded-full bg-background flex flex-col items-center justify-center border border-border shadow-inner">
                      <span className="text-xl font-black font-mono text-foreground">{totalUsers}</span>
                      <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-muted-foreground">Total</span>
                    </div>
                  </div>
                </div>

                {/* Pie Chart Legend */}
                <div className="space-y-2 pt-2 text-xs border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-foreground shrink-0" />
                      Students ({studentCount})
                    </span>
                    <span className="font-mono font-bold">{studentPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 shrink-0" />
                      Teachers ({teacherCount})
                    </span>
                    <span className="font-mono font-bold">{teacherPercent}%</span>
                  </div>
                  {pendingTeacherCount > 0 && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                        Pending ({pendingTeacherCount})
                      </span>
                      <span className="font-mono font-bold">{pendingPercent}%</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Users Table in Overview Tab */}
            <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    Registered System Users Directory ({usersList.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live records fetched directly from Supabase database <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">profiles</code> table.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search name or email..."
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                      <th className="pb-3 font-semibold">User Name</th>
                      <th className="pb-3 font-semibold">Email Address</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Registered Date</th>
                      <th className="pb-3 font-semibold text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No users found matching search query.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 font-bold text-foreground">{user.name || "User"}</td>
                          <td className="py-3 text-muted-foreground font-mono">{user.email}</td>
                          <td className="py-3 font-mono uppercase font-bold text-[11px] text-foreground">
                            {user.role}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                user.approval_status === "banned"
                                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-extrabold"
                                  : user.approval_status === "approved"
                                  ? "bg-foreground/10 border-foreground text-foreground"
                                  : user.approval_status === "rejected"
                                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {user.approval_status || "approved"}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {user.role === "teacher" && user.approval_status === "pending" && (
                                <button
                                  onClick={() => promptVerifyTeacher(user, "approved")}
                                  className="px-2.5 py-1 rounded bg-foreground text-background text-[11px] font-bold hover:opacity-90 transition-opacity"
                                >
                                  Approve
                                </button>
                              )}

                              {/* Ban / Unban User Button */}
                              <button
                                onClick={() => promptBanUser(user)}
                                className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-colors flex items-center gap-1 ${
                                  user.approval_status === "banned"
                                    ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                                    : "bg-background border-border text-foreground hover:bg-muted"
                                }`}
                                title={user.approval_status === "banned" ? "Unban user" : "Ban user"}
                              >
                                <Ban className="h-3 w-3" />
                                {user.approval_status === "banned" ? "Unban" : "Ban"}
                              </button>

                              {/* Delete User Button */}
                              <button
                                onClick={() => promptDeleteUser(user)}
                                className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="Delete user permanently"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users Table Pagination Controls */}
              {filteredUsers.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                  <div className="text-muted-foreground font-mono">
                    Showing {(usersPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(usersPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="font-mono text-muted-foreground px-2">
                      Page {usersPage} of {totalUsersPages}
                    </span>
                    <button
                      onClick={() => setUsersPage((p) => Math.min(totalUsersPages, p + 1))}
                      disabled={usersPage >= totalUsersPages}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── 2. INSTITUTIONAL & USER DEMO REQUESTS TAB ── */}
        {activeTab === "demos" && (
          <div className="space-y-6 w-full">
            {/* Quick Metrics Bar for Demos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 bg-background border border-border rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Inquiries</p>
                <p className="text-2xl font-black text-foreground mt-1">{demosCount}</p>
              </Card>
              <Card className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-wider text-primary">Pending Review</p>
                <p className="text-2xl font-black text-primary mt-1">{pendingDemosCount}</p>
              </Card>
              <Card className="p-4 bg-muted/40 border border-border rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {demoRequests.filter((d) => d.status === "scheduled").length}
                </p>
              </Card>
              <Card className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-wider text-primary">Completed</p>
                <p className="text-2xl font-black text-primary mt-1">
                  {demoRequests.filter((d) => d.status === "completed").length}
                </p>
              </Card>
            </div>

            {/* Main Demos Table Card */}
            <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    Institutional Demo Requests ({demoRequests.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Prospective school, university, and student walk-through requests submitted from the landing page.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={demoSearchQuery}
                      onChange={(e) => setDemoSearchQuery(e.target.value)}
                      placeholder="Search requester or org..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </div>

                  <select
                    value={demoStatusFilter}
                    onChange={(e) => setDemoStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="all">All Statuses ({demoRequests.length})</option>
                    <option value="pending">Pending ({pendingDemosCount})</option>
                    <option value="contacted">Contacted ({demoRequests.filter((d) => d.status === "contacted").length})</option>
                    <option value="scheduled">Scheduled ({demoRequests.filter((d) => d.status === "scheduled").length})</option>
                    <option value="completed">Completed ({demoRequests.filter((d) => d.status === "completed").length})</option>
                    <option value="cancelled">Cancelled ({demoRequests.filter((d) => d.status === "cancelled").length})</option>
                  </select>
                </div>
              </div>

              {filteredDemos.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-border rounded-xl">
                  <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No demo requests found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    When prospective educators and students click "Get demo" on the landing page, their walk-through requests will populate here in real-time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-[11px] font-mono uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Requester</th>
                        <th className="px-4 py-3">Role & Audience</th>
                        <th className="px-4 py-3">Organization</th>
                        <th className="px-4 py-3">Preferred Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedDemos.map((demo) => (
                        <tr key={demo.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{demo.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{demo.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-foreground border border-border">
                              {demo.role || "Educator"}
                            </span>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {demo.team_size || "1–50"} learners
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{demo.organization || "Independent"}</div>
                            {demo.use_case && (
                              <button
                                onClick={() => {
                                  setSelectedDemoDetail(demo);
                                  setAdminNotesDraft(demo.admin_notes || "");
                                }}
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5 text-left line-clamp-1"
                              >
                                View note / use case →
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                            {demo.preferred_date || "Flexible"}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={demo.status}
                              disabled={isUpdatingDemoStatus === demo.id}
                              onChange={(e) => handleUpdateDemoStatus(demo.id, e.target.value)}
                              className={`text-[10px] font-bold rounded-md px-2 py-1 border transition-colors ${
                                demo.status === "pending"
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : demo.status === "scheduled"
                                  ? "bg-primary/5 text-primary border-primary/20"
                                  : demo.status === "contacted"
                                  ? "bg-muted text-foreground border-border"
                                  : demo.status === "completed"
                                  ? "bg-primary/15 text-primary border-primary/40"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                            {demo.created_at ? new Date(demo.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedDemoDetail(demo);
                                  setAdminNotesDraft(demo.admin_notes || "");
                                }}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                                title="View Details & Notes"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={`mailto:${demo.email}?subject=PureLearn%20Demo%20Walkthrough&body=Hello%20${encodeURIComponent(demo.name)},%0A%0AThank%20you%20for%20requesting%20a%20demo%20of%20PureLearn.ai.%20We%20would%20love%20to%20schedule%20a%20walkthrough...`}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors inline-flex items-center"
                                title="Email requester"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                              <button
                                onClick={() => promptDeleteDemo(demo)}
                                className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Delete request"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Demos Pagination Bar */}
              {totalDemosPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <span>
                    Page {demosPage} of {totalDemosPages} ({filteredDemos.length} requests)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDemosPage((p) => Math.max(1, p - 1))}
                      disabled={demosPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setDemosPage((p) => Math.min(totalDemosPages, p + 1))}
                      disabled={demosPage >= totalDemosPages}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── 3. USERS MENU TAB WITH PAGINATION ── */}
        {activeTab === "users" && (
          <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  System User Directory ({usersList.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage registered students, educators, ban abusive users, or delete accounts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  <option value="all">All Roles & Statuses</option>
                  <option value="student">Students ({studentCount})</option>
                  <option value="teacher">Teachers ({teacherCount})</option>
                  <option value="pending">Pending Approval ({pendingTeacherCount})</option>
                  <option value="banned">Banned Users</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <th className="pb-3 font-semibold">User Name</th>
                    <th className="pb-3 font-semibold">Email Address</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Joined Date</th>
                    <th className="pb-3 font-semibold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No user accounts found matching selected criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 font-bold text-foreground">{user.name || "User"}</td>
                        <td className="py-3.5 text-muted-foreground font-mono">{user.email}</td>
                        <td className="py-3.5 font-mono uppercase font-bold text-[11px] text-foreground">
                          {user.role}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                              user.approval_status === "banned"
                                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-extrabold"
                                : user.approval_status === "approved"
                                ? "bg-foreground/10 border-foreground text-foreground"
                                : user.approval_status === "rejected"
                                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {user.approval_status || "approved"}
                          </span>
                        </td>
                        <td className="py-3.5 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.role === "teacher" && user.approval_status === "pending" && (
                              <button
                                onClick={() => promptVerifyTeacher(user, "approved")}
                                className="px-2.5 py-1 rounded bg-foreground text-background text-[11px] font-bold hover:opacity-90 transition-opacity"
                              >
                                Approve
                              </button>
                            )}

                            {/* Ban / Unban User Button */}
                            <button
                              onClick={() => promptBanUser(user)}
                              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-colors flex items-center gap-1 ${
                                user.approval_status === "banned"
                                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                                  : "bg-background border-border text-foreground hover:bg-muted"
                              }`}
                              title={user.approval_status === "banned" ? "Unban user" : "Ban user"}
                            >
                              <Ban className="h-3 w-3" />
                              {user.approval_status === "banned" ? "Unban" : "Ban"}
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => promptDeleteUser(user)}
                              className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold transition-colors flex items-center gap-1"
                              title="Delete user permanently"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Users Directory Pagination Controls */}
            {filteredUsers.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <div className="text-muted-foreground font-mono">
                  Showing {(usersPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(usersPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-muted-foreground px-2">
                    Page {usersPage} of {totalUsersPages}
                  </span>
                  <button
                    onClick={() => setUsersPage((p) => Math.min(totalUsersPages, p + 1))}
                    disabled={usersPage >= totalUsersPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── 3. MATERIALS MENU TAB WITH PAGINATION ── */}
        {activeTab === "materials" && (
          <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  Whole System Study Materials ({materialsCount})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All study materials and documents uploaded across the entire platform.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={materialTypeFilter}
                  onChange={(e) => setMaterialTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  <option value="all">All Material Types</option>
                  <option value="PDF">PDF Documents</option>
                  <option value="Word">Word Documents</option>
                  <option value="Notes">Lecture Notes</option>
                  <option value="File">Uploaded Files</option>
                  <option value="Text">Raw Text</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto pt-2 hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden materials-container">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <th className="pb-3 font-semibold">Material Title</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Source Kind</th>
                    <th className="pb-3 font-semibold">Uploaded Date</th>
                    <th className="pb-3 font-semibold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No materials found matching selected filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 font-bold text-foreground break-words whitespace-normal max-w-[280px]">{mat.title}</td>
                        <td className="py-3.5 font-mono uppercase font-bold text-[11px] text-foreground">
                          {mat.type}
                        </td>
                        <td className="py-3.5 text-muted-foreground font-mono text-[11px]">
                          {mat.source_kind || "file"}
                        </td>
                        <td className="py-3.5 text-muted-foreground">
                          {new Date(mat.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => promptDeleteMaterial(mat)}
                            className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                            title="Delete material permanently"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Materials Table Pagination Controls */}
            {filteredMaterials.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <div className="text-muted-foreground font-mono">
                  Showing {(materialsPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(materialsPage * ITEMS_PER_PAGE, filteredMaterials.length)} of {filteredMaterials.length} materials
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMaterialsPage((p) => Math.max(1, p - 1))}
                    disabled={materialsPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-muted-foreground px-2">
                    Page {materialsPage} of {totalMaterialsPages}
                  </span>
                  <button
                    onClick={() => setMaterialsPage((p) => Math.min(totalMaterialsPages, p + 1))}
                    disabled={materialsPage >= totalMaterialsPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── 4. FLASHCARDS MENU TAB WITH PAGINATION ── */}
        {activeTab === "flashcards" && (
          <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  System Flashcards & Study Decks ({flashcardDecksList.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All flashcard sets created by students, educators, and AI study notes across the platform.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={flashcardSearchQuery}
                    onChange={(e) => setFlashcardSearchQuery(e.target.value)}
                    placeholder="Search deck title or author..."
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <th className="pb-3 font-semibold">Deck Title</th>
                    <th className="pb-3 font-semibold">Subject / Source</th>
                    <th className="pb-3 font-semibold">Cards Count</th>
                    <th className="pb-3 font-semibold">Created By</th>
                    <th className="pb-3 font-semibold">Created Date</th>
                    <th className="pb-3 font-semibold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredFlashcards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No flashcard decks found in system database.
                      </td>
                    </tr>
                  ) : (
                    paginatedFlashcards.map((fc) => (
                      <tr key={fc.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 font-bold text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                          {fc.title}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-muted-foreground">
                          {fc.subject}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-foreground">
                          {fc.cardsCount} Cards
                        </td>
                        <td className="py-3.5 text-foreground">
                          <span className="font-semibold">{fc.authorName}</span>
                          <span className="text-[10px] block text-muted-foreground font-mono">{fc.authorEmail}</span>
                        </td>
                        <td className="py-3.5 text-muted-foreground font-mono text-[11px]">
                          {new Date(fc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => promptDeleteFlashcard(fc)}
                            className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                            title="Delete deck permanently"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Flashcard Decks Pagination Controls */}
            {filteredFlashcards.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <div className="text-muted-foreground font-mono">
                  Showing {(flashcardsPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(flashcardsPage * ITEMS_PER_PAGE, filteredFlashcards.length)} of {filteredFlashcards.length} decks
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFlashcardsPage((p) => Math.max(1, p - 1))}
                    disabled={flashcardsPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-muted-foreground px-2">
                    Page {flashcardsPage} of {totalFlashcardsPages}
                  </span>
                  <button
                    onClick={() => setFlashcardsPage((p) => Math.min(totalFlashcardsPages, p + 1))}
                    disabled={flashcardsPage >= totalFlashcardsPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── 5. ANALYTICS (OF WHOLE SYSTEM) MENU TAB WITH DYNAMIC CHARTS ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6 w-full">
            {/* Top Metrics Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  System Quizzes Created
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {quizzesCount}
                </h3>
                <p className="mt-3 text-xs text-muted-foreground border-t border-border/60 pt-2">
                  Total published quizzes in database
                </p>
              </Card>

              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Student Quiz Attempts
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {quizAttemptsCount}
                </h3>
                <p className="mt-3 text-xs text-muted-foreground border-t border-border/60 pt-2">
                  Total student evaluations submitted
                </p>
              </Card>

              <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Whole System Study Materials
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {materialsCount}
                </h3>
                <p className="mt-3 text-xs text-muted-foreground border-t border-border/60 pt-2">
                  Total study resources uploaded across all classrooms
                </p>
              </Card>
            </div>

            {/* Analytics Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Analytics Chart 1: Daily Activity & Evaluation Trends (Dynamic Live Database Data) */}
              <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      Platform Telemetry Activity (Live Data)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Weekly volume of student quizzes & AI study sessions.
                    </p>
                  </div>
                </div>

                <div className="h-44 pt-4 flex items-end justify-between gap-2 px-2">
                  {realWeeklyData.map((d) => {
                    const heightPercent = maxWeekly > 0 ? Math.round((d.count / maxWeekly) * 100) : 0;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="text-[10px] font-mono font-bold text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.count}
                        </div>
                        <div
                          className="w-7 bg-muted border border-border/80 rounded-t-md overflow-hidden flex items-end justify-center transition-all group-hover:border-foreground shadow-sm"
                          style={{ height: `${Math.max(15, heightPercent)}%` }}
                        >
                          <div className="w-full bg-foreground/40 group-hover:bg-foreground h-full transition-all" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Analytics Chart 2: User Role Ratio PIE CHART */}
              <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    User Role Ratio (Pie Chart)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live platform composition across roles.
                  </p>
                </div>

                <div className="py-2 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 rounded-full flex items-center justify-center border border-border/80 shadow-sm transition-all">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: pieConicGradient }}
                    />
                    {/* Donut Hole */}
                    <div className="relative z-10 w-20 h-20 rounded-full bg-background flex flex-col items-center justify-center border border-border shadow-inner">
                      <span className="text-xl font-black font-mono text-foreground">{totalUsers}</span>
                      <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-muted-foreground">Total</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-foreground shrink-0" />
                      Students ({studentCount})
                    </span>
                    <span className="font-mono font-bold">{studentPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 shrink-0" />
                      Teachers ({teacherCount})
                    </span>
                    <span className="font-mono font-bold">{teacherPercent}%</span>
                  </div>
                  {pendingTeacherCount > 0 && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                        Pending ({pendingTeacherCount})
                      </span>
                      <span className="font-mono font-bold">{pendingPercent}%</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Platform Telemetry Summary */}
            <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                System Telemetry & Platform Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border/60 rounded-lg space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-foreground">
                    Active User Ratio
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {totalUsers > 0 ? Math.round((studentCount / totalUsers) * 100) : 0}% Students
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {studentCount} Students, {teacherCount} Teachers out of {totalUsers} total registered accounts.
                  </p>
                </div>

                <div className="p-4 border border-border/60 rounded-lg space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-foreground">
                    Content Density
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {activeClassrooms > 0 ? (materialsCount / activeClassrooms).toFixed(1) : 0} Items/Class
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average study materials uploaded per active classroom.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── 6. SYSTEM LOGS MENU TAB WITH PAGINATION ── */}
        {activeTab === "logs" && (
          <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  Live System Audit Logs ({userLogs.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time security events, user logins, and AI query telemetry.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  <option value="all">All Actions</option>
                  <option value="chat_query_submitted">Chat Queries</option>
                  <option value="user_login">User Sign-ins</option>
                  <option value="document_uploaded">Document Uploads</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Action Type</th>
                    <th className="pb-3 font-semibold">User ID</th>
                    <th className="pb-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No audit logs available in database matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 text-muted-foreground font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 font-mono font-bold text-foreground">
                          {log.action_type}
                        </td>
                        <td className="py-3 text-muted-foreground font-mono text-[11px]">
                          {log.user_id ? `${log.user_id.substring(0, 8)}...` : "System"}
                        </td>
                        <td className="py-3 text-muted-foreground line-clamp-1">
                          {log.details || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Audit Logs Table Pagination Controls */}
            {filteredLogs.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <div className="text-muted-foreground font-mono">
                  Showing {(logsPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(logsPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                    disabled={logsPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-muted-foreground px-2">
                    Page {logsPage} of {totalLogsPages}
                  </span>
                  <button
                    onClick={() => setLogsPage((p) => Math.min(totalLogsPages, p + 1))}
                    disabled={logsPage >= totalLogsPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── 7. APP SETTINGS MENU TAB (INTENTIONAL HIGH-AESTHETIC SYSTEM CONFIGURATION) ── */}
        {activeTab === "settings" && (
          <div className="space-y-6 w-full">
            {/* Global Settings Hero Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-background border border-border rounded-xl shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background">
                    System Control
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border border-border bg-muted text-foreground">
                    Supabase Live Sync
                  </span>
                </div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Global System Settings & Database Configuration
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  Changes made here update the <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">system_settings</code> table in your Supabase database in real-time.
                </p>
              </div>

              <button
                onClick={handleSaveAllSettings}
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2 shadow-sm"
              >
                {isSavingSettings ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save All Settings Live
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Card 1: Gemini AI Engine & API Key */}
              <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                        Gemini AI Engine & API Key
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Global key and model parameters powering the cognitive AI tutor.
                      </p>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-foreground underline font-sans shrink-0"
                    >
                      Google AI Studio →
                    </a>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                        Global Gemini API Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={systemApiKey}
                          onChange={(e) => setSystemApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                        <button
                          onClick={handleSaveApiKey}
                          disabled={isSavingKey}
                          className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
                        >
                          {isSavingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                          Save Key
                        </button>
                      </div>
                      {systemApiKey && (
                        <p className="text-[11px] mt-1.5 font-mono text-muted-foreground flex items-center gap-1">
                          {systemApiKey.trim().startsWith("AIzaSy") ? (
                            <span className="text-foreground font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-foreground" /> Verified Google AI Studio API Key format
                            </span>
                          ) : (
                            <span>⚠️ Note: Official Google Gemini keys start with "AIzaSy".</span>
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                        AI Tutor Model Architecture
                      </label>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended & Fast)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning & Analysis)</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash Experimental</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                        AI Response Creativity & Temperature
                      </label>
                      <select
                        value={aiTemperature}
                        onChange={(e) => setAiTemperature(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                      >
                        <option value="0.2">0.2 — Strict & Deterministic (Academic & Exact)</option>
                        <option value="0.7">0.7 — Balanced Tutor (Standard Recommendation)</option>
                        <option value="0.9">0.9 — Creative & Conversational</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 2: Educator Access & Approval Policy */}
              <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      Educator Access & Registration Policy
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define approval workflows and classroom capacity limits for registered educators.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                        Teacher Signup Approval Workflow
                      </label>
                      <select
                        value={teacherApprovalMode}
                        onChange={(e) => setTeacherApprovalMode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                      >
                        <option value="manual">Manual Admin Verification Required (Pending Queue)</option>
                        <option value="auto">Auto-Approve All Educator Signups Immediately</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                        Default Student Cognitive Profile Preset
                      </label>
                      <select
                        value={defaultCognitiveProfile}
                        onChange={(e) => setDefaultCognitiveProfile(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                      >
                        <option value="standard">Standard Cognitive Learning</option>
                        <option value="adhd">ADHD Focused (Visual Pacing & High Contrast)</option>
                        <option value="dyslexia">Dyslexia Friendly (OpenDyslexic & Spacing)</option>
                        <option value="sensory">Sensory Friendly (Calm Palette)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                        Classroom Enrollment Capacity Limit
                      </label>
                      <select
                        value={maxClassEnrollment}
                        onChange={(e) => setMaxClassEnrollment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                      >
                        <option value="30">30 Students per Classroom</option>
                        <option value="50">50 Students per Classroom (Default)</option>
                        <option value="100">100 Students per Classroom</option>
                        <option value="unlimited">Unlimited Capacity</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 3: Platform Maintenance & Safety Controls */}
              <Card className="p-6 bg-background border border-border rounded-xl space-y-4 shadow-sm lg:col-span-2">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    System Maintenance & Security Policy Controls
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage platform maintenance mode banners, document upload limits, and audit log telemetry.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                  <div className="p-4 border border-border/80 rounded-xl space-y-2 bg-muted/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-foreground">Maintenance Mode</span>
                        <input
                          type="checkbox"
                          checked={maintenanceMode}
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                          className="h-4 w-4 accent-foreground rounded border-border cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                        {maintenanceMode ? "⚠️ Enabled — Non-admin users see maintenance notice banner." : "Normal Operation — Platform is fully accessible."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                      Max Document Upload Size
                    </label>
                    <select
                      value={maxUploadSize}
                      onChange={(e) => setMaxUploadSize(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                    >
                      <option value="10">10 MB Max per Document</option>
                      <option value="25">25 MB Max per Document (Default)</option>
                      <option value="50">50 MB Max per Document</option>
                      <option value="100">100 MB Max per Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground block mb-1.5">
                      Audit Security Logging Detail
                    </label>
                    <select
                      value={loggingLevel}
                      onChange={(e) => setLoggingLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                    >
                      <option value="standard">Standard Security Audit</option>
                      <option value="verbose">Verbose Query & Telemetry Logging</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-border/60">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Database Target: <code className="px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">public.system_settings</code>
                  </span>

                  <button
                    onClick={handleSaveAllSettings}
                    disabled={isSavingSettings}
                    className="px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                  >
                    {isSavingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save All Settings Live
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ── DEMO REQUEST DETAIL & NOTES MODAL ── */}
      {selectedDemoDetail && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDemoDetail(null);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Demo Walkthrough Request
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  {selectedDemoDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDemoDetail(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border">
                <span className="text-[10px] text-muted-foreground block">Email</span>
                <a href={`mailto:${selectedDemoDetail.email}`} className="font-mono font-semibold text-primary hover:underline truncate block">
                  {selectedDemoDetail.email}
                </a>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border">
                <span className="text-[10px] text-muted-foreground block">Role</span>
                <span className="font-semibold text-foreground">{selectedDemoDetail.role || "Educator"}</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border">
                <span className="text-[10px] text-muted-foreground block">Organization</span>
                <span className="font-semibold text-foreground">{selectedDemoDetail.organization || "Independent"}</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border">
                <span className="text-[10px] text-muted-foreground block">Audience Size</span>
                <span className="font-semibold text-foreground">{selectedDemoDetail.team_size || "1–50 learners"}</span>
              </div>
            </div>

            {selectedDemoDetail.preferred_date && (
              <div className="text-xs rounded-lg bg-muted/30 p-2.5 border border-border">
                <span className="text-[10px] text-muted-foreground block font-mono uppercase">Preferred Date / Time</span>
                <span className="font-medium text-foreground">{selectedDemoDetail.preferred_date}</span>
              </div>
            )}

            {selectedDemoDetail.use_case && (
              <div className="text-xs rounded-lg bg-muted/30 p-3 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground block font-mono uppercase">Goals & Learning Challenges</span>
                <p className="text-muted-foreground leading-relaxed italic">
                  "{selectedDemoDetail.use_case}"
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Internal Admin Notes</span>
                <span className="text-[10px] font-normal text-muted-foreground">Visible to admins only</span>
              </label>
              <textarea
                rows={3}
                placeholder="Log outreach notes, call times, follow-up dates..."
                value={adminNotesDraft}
                onChange={(e) => setAdminNotesDraft(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <a
                href={`mailto:${selectedDemoDetail.email}?subject=PureLearn%20Demo%20Walkthrough`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                Email Requester
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDemoDetail(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDemoNotes(selectedDemoDetail.id, adminNotesDraft)}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM CONFIRMATION ACTION MODAL ── */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !confirmModal.isLoading) {
              closeConfirmModal();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !confirmModal.isLoading) {
              e.preventDefault();
              void confirmModal.onConfirm();
            }
            if (e.key === "Escape" && !confirmModal.isLoading) {
              e.preventDefault();
              closeConfirmModal();
            }
          }}
          tabIndex={-1}
        >
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-popover text-popover-foreground p-6 shadow-2xl ring-1 ring-border/40">
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                  confirmModal.variant === "danger"
                    ? "border-red-500/30 bg-red-500/10 text-red-500"
                    : confirmModal.variant === "warning"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    : "border-primary/30 bg-primary/10 text-primary"
                }`}
              >
                {confirmModal.icon === "trash" && <Trash2 className="h-6 w-6" />}
                {confirmModal.icon === "ban" && <Ban className="h-6 w-6" />}
                {confirmModal.icon === "check" && <CheckCircle2 className="h-6 w-6" />}
                {confirmModal.icon === "alert" && <AlertTriangle className="h-6 w-6" />}
              </div>
              <button
                onClick={closeConfirmModal}
                disabled={confirmModal.isLoading}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-4 text-base font-black uppercase tracking-wider text-foreground">
              {confirmModal.title}
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {confirmModal.description}
            </p>

            <p className="mt-2 text-[10px] text-muted-foreground/60 italic">
              Press Enter to confirm · Esc to cancel
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={confirmModal.isLoading}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {confirmModal.cancelText || "Cancel"}
              </button>

              <button
                type="button"
                onClick={() => void confirmModal.onConfirm()}
                disabled={confirmModal.isLoading}
                autoFocus
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition shadow-sm disabled:opacity-60 ${
                  confirmModal.variant === "danger"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                    : confirmModal.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {confirmModal.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
