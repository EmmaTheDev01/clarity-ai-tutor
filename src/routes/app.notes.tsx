import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";
import {
  FileText,
  Sparkles,
  BookOpen,
  Plus,
  Search,
  Calendar,
  Pin,
  PinOff,
  MoreHorizontal,
  Share2,
  Trash2,
  X,
  Check,
  ArrowRight,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CacheManager } from "@/lib/cache";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/markdown";
import { RichEditor } from "@/components/rich-editor";
import { useCognitiveMode } from "@/hooks/use-cognitive-mode";
import { ListSkeleton, TextSkeleton } from "@/components/ui/data-skeleton";

export const Route = createFileRoute("/app/notes")({
  head: () => ({ meta: [{ title: "Notes — tutor.vigilance.rw" }] }),
  component: NotesPage,
});

type Note = {
  id: string;
  title: string;
  subject: string;
  updated: string;
  content: string;
  isAi: boolean;
  isStarred?: boolean;
  pinned?: boolean;
  readOnly?: boolean;
  sharedByEmail?: string;
  sharedByName?: string;
  images?: string[];
};

type NoteShareRequest = {
  id: string;
  note_title: string;
  note_subject: string;
  sender_email: string;
  sender_name: string;
};

const appGuideNotes: Note[] = [
  {
    id: "history_guide_note",
    title: "Key Events of the 20th Century",
    subject: "Modern History",
    updated: "Built in",
    content: `### Key Turning Points of the 20th Century

Modern history is shaped by major geopolitical conflicts, ideological struggles, and technological revolutions that redefined global boundaries.

---

### Major Epochs and Conflicts

#### 1. World War I (1914–1918)
Also known as the Great War, WWI was triggered by the assassination of Archduke Franz Ferdinand and grew into a global conflict due to complex alliances.
*   **Key Outcome:** Collapse of major empires (Ottoman, Austro-Hungarian, Russian, German) and creation of the League of Nations.

#### 2. World War II (1939–1945)
The deadliest conflict in human history, sparked by fascist expansionism in Europe and Asia.
*   **Key Outcome:** Rise of the United States and the Soviet Union as global Superpowers, beginning the Cold War, and the founding of the United Nations.

#### 3. The Cold War (1947–1991)
An era of geopolitical tension between the US-led Western Bloc and the Soviet-led Eastern Bloc.
*   **Key Event:** Fall of the Berlin Wall (1989) and the dissolution of the USSR (1991).

---

### Important Concepts for Historians

*   **Imperialism:** Extending a country's power and influence through diplomacy or military force.
*   **Decolonization:** Process by which colonies become independent of the colonizing country, accelerating after WWII.
*   **Globalization:** Growing interdependence of the world's economies, cultures, and populations.`,
    isAi: true,
    readOnly: true,
    pinned: false,
  },
];

function NotesPage() {
  const { mode: cognitiveProfile } = useCognitiveMode();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sharing states
  const [shareTargetNote, setShareTargetNote] = useState<Note | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [pendingShares, setPendingShares] = useState<NoteShareRequest[]>([]);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Menu states
  const [noteMenu, setNoteMenu] = useState<{ x: number; y: number; note: Note } | null>(null);

  // Renaming states
  const [renameTargetNote, setRenameTargetNote] = useState<Note | null>(null);
  const [renameNoteValue, setRenameNoteValue] = useState("");
  const [isRenamingNote, setIsRenamingNote] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteMenuRef = useRef<HTMLDivElement | null>(null);
  const [noteMenuPos, setNoteMenuPos] = useState<{ left: number; top: number } | null>(null);

  const computeSafeMenuPos = (requestedLeft: number, requestedTop: number, estWidth = 240, estHeight = 140) => {
    const margin = 8;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    let left = requestedLeft;
    let top = requestedTop;
    if (left > vw - estWidth) left = Math.max(margin, vw - estWidth - margin);
    if (top > vh - estHeight) top = Math.max(margin, requestedTop - estHeight - margin);
    return { left, top };
  };

  // Auth Guard: redirect to login if unauthenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth/sign-in" });
      }
    };
    checkAuth();
  }, [navigate]);

  // ─── Global Keyboard Shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape — close any open modal / menu in priority order
      if (e.key === "Escape") {
        if (activeLightboxImage) { setActiveLightboxImage(null); return; }
        if (shareTargetNote) { setShareTargetNote(null); setShareEmail(""); return; }
        if (renameTargetNote) { setRenameTargetNote(null); return; }
        if (noteMenu) { setNoteMenu(null); return; }
        if (searchQuery) { setSearchQuery(""); searchInputRef.current?.blur(); return; }
        return;
      }

      // Ctrl/Cmd + K — focus search input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxImage, shareTargetNote, renameTargetNote, noteMenu, searchQuery]);
  // ─────────────────────────────────────────────────────────────────────────────

  // Sync selectedNote initially
  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);



  const fetchSupabaseNotes = async (uid?: string) => {
    setLoading(true);
    try {
      // Use provided uid, or try to get it from current session/user
      let currentUid = uid;
      if (!currentUid) {
        // Try getSession first (synchronous localStorage read), then getUser as fallback
        const { data: sessionData } = await supabase.auth.getSession();
        currentUid = sessionData?.session?.user?.id;
        if (!currentUid) {
          const { data: userData } = await supabase.auth.getUser();
          currentUid = userData?.user?.id;
        }
      }

      if (!currentUid) {
        console.warn("[Notes] No authenticated user found, skipping fetch.");
        setNotes([]);
        setSelectedNote(null);
        return;
      }
      setCurrentUserId(currentUid);

      // Debug: log session and user info
      try {
        const { data: u } = await supabase.auth.getUser();
        console.debug("[Notes][DEBUG] supabase.auth.getUser():", u);
      } catch (e) {
        console.debug("[Notes][DEBUG] getUser failed:", e);
      }

      // 1. Check cache first to avoid flicker/stale UI
      const cacheKey = `notes_data_${currentUid}`;
      const cached = CacheManager.get(cacheKey);
      if (cached && cached.notes) {
        console.debug("[Notes][DEBUG] Using cached notes for user", currentUid);
        setNotes(cached.notes);
        // Keep selected note in sync
        if (!selectedNote && cached.notes.length > 0) setSelectedNote(cached.notes[0]);
        return;
      }

      // Fetch ONLY this user's notes from Supabase
      const notesRes = await supabase
        .from("notes")
        .select("*")
        .eq("student_id", currentUid)
        .order("created_at", { ascending: false });

      console.debug("[Notes][DEBUG] notes select result:", notesRes);

      const { data: dbNotes, error: notesError } = notesRes as any;

      if (notesError) {
        console.error("[Notes] Fetch error:", notesError);
      }

      console.log(`[Notes] Fetched ${dbNotes?.length ?? 0} notes for user ${currentUid}`);

      // 2. Safely fetch pending share invitations in independent block
      try {
        const { data: pendingSharesDb } = await supabase
          .from("note_shares")
          .select(`
            id,
            notes (
              title,
              subject
            ),
            profiles:shared_by (
              email,
              name
            )
          `)
          .eq("shared_with", currentUid)
          .eq("status", "pending");

        const mappedPending: NoteShareRequest[] = (pendingSharesDb || []).map((s: any) => ({
          id: s.id,
          note_title: s.notes?.title || "Untitled Note",
          note_subject: s.notes?.subject || "General",
          sender_email: s.profiles?.email || "Unknown user",
          sender_name: s.profiles?.name || "Someone",
        }));
        setPendingShares(mappedPending);
      } catch (shareErr) {
        console.warn("Could not load note shares:", shareErr);
      }

      // 3. Map database notes
      const mappedDbNotes = (dbNotes || []).map((n: any) => ({
        id: n.id,
        title: n.title || "Untitled Note",
        subject: n.subject || "General",
        content: n.content || "",
        isAi: Boolean(n.is_ai_generated),
        isStarred: Boolean(n.is_starred),
        pinned: Boolean(n.pinned),
        updated: n.updated_at
          ? new Date(n.updated_at).toLocaleDateString()
          : n.created_at
          ? new Date(n.created_at).toLocaleDateString()
          : "Recent",
        readOnly: false,
        images: Array.isArray(n.images) ? n.images : undefined,
      }));

      // 4. Merge with local digital_notebook items if present
      let localNotes: Note[] = [];
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("digital_notebook") : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localNotes = parsed.filter(
              (ln: any) => !mappedDbNotes.some((dn) => dn.id === ln.id || dn.title === ln.title)
            );
          }
        }
      } catch {
        // Best effort local storage read
      }

      const allUserNotes = [...mappedDbNotes, ...localNotes];
      setNotes(allUserNotes);

      // Keep selection or select first user note
      if (allUserNotes.length > 0) {
        if (selectedNote) {
          const current = allUserNotes.find((item) => item.id === selectedNote.id);
          if (current) setSelectedNote(current);
          else setSelectedNote(allUserNotes[0]);
        } else {
          setSelectedNote(allUserNotes[0]);
        }
      } else {
        setSelectedNote(null);
      }

      CacheManager.set(`notes_data_${currentUid}`, {
        notes: allUserNotes,
      }, 30000);
    } catch (err) {
      console.warn("Failed to fetch notes from Supabase:", err);
    }
    setLoading(false);
  };

  // Load from Supabase on mount — use onAuthStateChange as primary driver
  // so we always have a valid session before fetching
  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const uid = session?.user?.id;
      if (uid) {
        fetchSupabaseNotes(uid);
      } else {
        setNotes([]);
        setSelectedNote(null);
      }
    });

    // Also attempt an immediate fetch using getSession (in case onAuthStateChange
    // already fired before listener was registered — common with persisted sessions)
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const uid = data?.session?.user?.id;
      if (uid) {
        fetchSupabaseNotes(uid);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Listen for external notifications that notes were updated elsewhere
  useEffect(() => {
    const handler = () => {
      fetchSupabaseNotes(currentUserId || undefined);
    };
    window.addEventListener("notes:updated", handler);
    return () => window.removeEventListener("notes:updated", handler);
  }, [currentUserId]);

  const handleAddNote = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error("Please log in to add notes.");
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          student_id: userData.user.id,
          title: "New Study Note",
          subject: "General",
          content: "Type your notes here...",
          is_ai_generated: false,
          pinned: false,
        })
        .select("*")
        .single();

      if (error) throw error;

      CacheManager.invalidate("notes_data_");
      toast.success("Note created successfully!");
      await fetchSupabaseNotes();

      const newMappedNote = {
        id: data.id,
        title: data.title,
        subject: data.subject || "General",
        content: data.content,
        isAi: data.is_ai_generated,
        isStarred: data.is_starred,
        pinned: data.pinned,
        updated: new Date(data.updated_at).toLocaleDateString(),
        images: data.images || undefined,
      };
      setSelectedNote(newMappedNote);

      await supabase.from("user_logs").insert({
        user_id: userData.user.id,
        action_type: "note_created",
        details: `Created manual note: "${data.title}"`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create note.");
    }
  };

  const handleEditNoteContent = (content: string) => {
    if (!selectedNote) return;
    if (selectedNote.readOnly) return;
    const updated = notes.map((n) => (n.id === selectedNote.id ? { ...n, content } : n));
    setNotes(updated);
    setSelectedNote({ ...selectedNote, content });

    // Supabase background transaction
    (async () => {
      setIsSavingNote(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (!selectedNote.id.toString().includes("guide")) {
            await supabase.from("notes").update({ content }).eq("id", selectedNote.id);
            CacheManager.invalidate("notes_data_");
          }
        }
      } catch (err) {
        console.warn("Supabase background note content update failure:", err);
      } finally {
        setTimeout(() => setIsSavingNote(false), 500);
      }
    })();
  };

  const handleEditNoteTitle = (title: string) => {
    if (!selectedNote) return;
    if (selectedNote.readOnly) return;
    const updated = notes.map((n) => (n.id === selectedNote.id ? { ...n, title } : n));
    setNotes(updated);
    setSelectedNote({ ...selectedNote, title });

    // Supabase background transaction
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (!selectedNote.id.toString().includes("guide")) {
            await supabase.from("notes").update({ title }).eq("id", selectedNote.id);
            CacheManager.invalidate("notes_data_");
          }
        }
      } catch (err) {
        console.warn("Supabase background note title update failure:", err);
      }
    })();
  };

  const handleToggleFavorite = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target || target.readOnly) return;

    const nextStarred = !target.isStarred;
    const updated = notes.map((n) => (n.id === noteId ? { ...n, isStarred: nextStarred } : n));
    setNotes(updated);
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, isStarred: nextStarred });
    }

    // Supabase background transaction
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (!noteId.toString().includes("guide")) {
            await supabase.from("notes").update({ is_starred: nextStarred }).eq("id", noteId);
            CacheManager.invalidate("notes_data_");
          }
          await supabase.from("user_logs").insert({
            user_id: userData.user.id,
            action_type: nextStarred ? "note_starred" : "note_unstarred",
            details: `Toggled star status on note: "${target.title}"`,
          });
        }
      } catch (err) {
        console.warn("Supabase background favorite toggle failure:", err);
      }
    })();
  };

  const handleTogglePin = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const nextPinned = !target.pinned;

    // Optimistic state update
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, pinned: nextPinned } : n)));
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote((prev) => prev ? { ...prev, pinned: nextPinned } : null);
    }

    try {
      if (noteId.toString().includes("guide")) {
        toast.success(nextPinned ? "Pinned default note" : "Unpinned default note");
        return;
      }

      const { error } = await supabase.from("notes").update({ pinned: nextPinned }).eq("id", noteId);
      if (error) throw error;
      CacheManager.invalidate("notes_data_");
      toast.success(nextPinned ? "Note pinned!" : "Note unpinned!");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle pin.");
      // Rollback
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, pinned: !nextPinned } : n)));
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote((prev) => prev ? { ...prev, pinned: !nextPinned } : null);
      }
    }
  };

  const handleRenameNoteSubmit = async () => {
    if (!renameTargetNote || !renameNoteValue.trim()) return;
    setIsRenamingNote(true);
    const newTitle = renameNoteValue.trim();

    try {
      if (renameTargetNote.id.toString().includes("guide")) {
        setNotes((prev) => prev.map((n) => (n.id === renameTargetNote.id ? { ...n, title: newTitle } : n)));
        if (selectedNote && selectedNote.id === renameTargetNote.id) {
          setSelectedNote((prev) => prev ? { ...prev, title: newTitle } : null);
        }
        toast.success(`Note renamed to "${newTitle}"`);
        setRenameTargetNote(null);
        return;
      }

      const { error } = await supabase
        .from("notes")
        .update({ title: newTitle })
        .eq("id", renameTargetNote.id);

      if (error) throw error;

      CacheManager.invalidate("notes_data_");
      toast.success(`Note renamed to "${newTitle}"`);
      setNotes((prev) => prev.map((n) => (n.id === renameTargetNote.id ? { ...n, title: newTitle } : n)));
      if (selectedNote && selectedNote.id === renameTargetNote.id) {
        setSelectedNote((prev) => prev ? { ...prev, title: newTitle } : null);
      }
      setRenameTargetNote(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename note.");
    } finally {
      setIsRenamingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target || target.readOnly) {
      toast.error("Default notes cannot be deleted.");
      return;
    }

    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;

      CacheManager.invalidate("notes_data_");
      toast.success("Note deleted successfully.");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete note.");
    }
  };

  const handleShareSubmit = async () => {
    if (!shareTargetNote || !shareEmail.trim()) return;
    setIsSharing(true);

    try {
      // Find the student profile by email
      const { data: recipientProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", shareEmail.trim())
        .limit(1);

      if (profileErr || !recipientProfile || recipientProfile.length === 0) {
        toast.error("Could not find a student with that email address.");
        setIsSharing(false);
        return;
      }

      const recipientId = recipientProfile[0].id;
      if (recipientId === currentUserId) {
        toast.error("You cannot share a note with yourself.");
        setIsSharing(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { error } = await supabase.from("note_shares").insert({
        note_id: shareTargetNote.id,
        shared_by: userData.user.id,
        shared_with_email: shareEmail.trim(),
        shared_with: recipientId,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already shared this note with this user.");
        } else {
          throw error;
        }
      } else {
        toast.success(`Note shared with ${shareEmail.trim()}!`);
        setShareTargetNote(null);
        setShareEmail("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to share note.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleAcceptShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from("note_shares")
        .update({ status: "accepted" })
        .eq("id", shareId);

      if (error) throw error;
      CacheManager.invalidate("notes_data_");
      CacheManager.invalidate("user_shell_data_");
      toast.success("Note invitation accepted!");
      await fetchSupabaseNotes();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept note share.");
    }
  };

  const handleRejectShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from("note_shares")
        .update({ status: "rejected" })
        .eq("id", shareId);

      if (error) throw error;
      CacheManager.invalidate("notes_data_");
      CacheManager.invalidate("user_shell_data_");
      toast.success("Note invitation declined.");
      setPendingShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err: any) {
      toast.error(err.message || "Failed to decline note share.");
    }
  };

  const handleEscalateToTutor = (note: Note) => {
    localStorage.setItem("escalated_note_context", JSON.stringify({
      title: note.title,
      subject: note.subject,
      content: note.content,
      images: note.images || [],
    }));
    toast.success("Note context prepared. Loading Socratic AI Tutor...");
    navigate({ to: "/app" as any });
  };

  // Close context menu on window click
  useEffect(() => {
    const handleWindowClick = () => setNoteMenu(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Ensure the floating context menu fits in the viewport when opened
  useEffect(() => {
    if (!noteMenu) {
      setNoteMenuPos(null);
      return;
    }

    const computePosition = () => {
      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const requestedLeft = noteMenu.x;
      const requestedTop = noteMenu.y;

      let left = requestedLeft;
      let top = requestedTop;

      const el = noteMenuRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const width = rect.width || 240;
        const height = rect.height || 140;

        if (left + width + margin > vw) {
          left = Math.max(margin, vw - width - margin);
        }

        if (top + height + margin > vh) {
          // position above the click point if it would overflow
          top = Math.max(margin, requestedTop - height - margin);
        }
      } else {
        // No measurement yet — provide safe fallbacks
        if (requestedLeft > vw - 240) left = Math.max(margin, vw - 240 - margin);
        if (requestedTop > vh - 160) top = Math.max(margin, requestedTop - 160 - margin);
      }

      setNoteMenuPos({ left, top });
    };

    // Defer to next paint so ref is attached
    const raf = requestAnimationFrame(computePosition);
    const onResize = () => requestAnimationFrame(computePosition);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [noteMenu]);

  const filteredNotes = notes.filter(
    (n) =>
      (n.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (n.subject || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const regularNotes = filteredNotes.filter((n) => !n.pinned);

  const renderNoteCard = (note: Note) => {
    const isSelected = selectedNote?.id === note.id;
    return (
      <Card
        key={note.id}
        onClick={() => setSelectedNote(note)}
        onContextMenu={(e: React.MouseEvent) => {
          e.preventDefault();
          const pos = computeSafeMenuPos(e.clientX, e.clientY);
          setNoteMenuPos(pos);
          setNoteMenu({ x: e.clientX, y: e.clientY, note });
        }}
        className={`cursor-pointer p-4 transition text-left border relative group ${isSelected ? "border-primary ring-2 ring-primary/40 bg-primary/10 shadow-sm" : "border-border hover:bg-muted/40"
          }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {note.subject}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {note.sharedByEmail && (
              <Pill className="text-[9px] bg-sky-500/5 border border-sky-500/20 text-sky-600">
                Shared
              </Pill>
            )}
            {note.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
            {note.isStarred && <span className="text-yellow-500 text-xs">★</span>}
            {note.isAi && (
              <Pill className="text-[9px] bg-primary/5 border border-primary/20 text-primary flex items-center gap-1">
                Note
              </Pill>
            )}
          </div>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-foreground break-words whitespace-normal pr-6 leading-snug">
          {note.title}
        </h3>
        <div className="mt-1 text-xs text-muted-foreground line-clamp-2 pointer-events-none notes-sidebar-preview break-words">
          <MarkdownRenderer content={note.content} cognitiveProfile={cognitiveProfile} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>Updated {note.updated}</span>
          </div>
          {note.sharedByEmail && (
            <span className="text-[9px] italic text-sky-600 truncate max-w-28">
              From {note.sharedByName || note.sharedByEmail}
            </span>
          )}
        </div>

        {/* 3-Dot context trigger */}
        <button
          type="button"
            onClick={(e) => {
            e.stopPropagation();
            const pos = computeSafeMenuPos(e.clientX, e.clientY);
            setNoteMenuPos(pos);
            setNoteMenu({ x: e.clientX, y: e.clientY, note });
          }}
          className="absolute right-2.5 bottom-2.5 rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition"
          aria-label="Note options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </Card>
    );
  };

  // Active note to render in the detail pane. Use selectedNote or fall back to the first note.
  const activeNote: Note | null = selectedNote ?? (notes && notes.length > 0 ? notes[0] : null);

  return (
    <AppShell title="Notes & Summaries">
      <style dangerouslySetInnerHTML={{
        __html: `
        .notes-sidebar-preview * {
          display: inline !important;
          font-size: 0.75rem !important;
          font-weight: normal !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
        }
        .notes-sidebar-preview strong {
          font-weight: bold !important;
        }
        .notes-sidebar-preview em {
          font-style: italic !important;
        }
        .notes-sidebar-preview code {
          font-family: monospace !important;
          background: rgba(0, 0, 0, 0.05) !important;
          padding: 1px 3px !important;
          border-radius: 3px !important;
        }
      ` }} />
      {/* Context Menu */}
      {noteMenu && (
        <div
            ref={(el) => (noteMenuRef.current = el)}
            className="fixed z-[60] min-w-32 rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur"
            style={{ left: noteMenuPos?.left ?? noteMenu.x, top: noteMenuPos?.top ?? noteMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
          <button
            onClick={() => {
              handleTogglePin(noteMenu.note.id);
              setNoteMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted"
          >
            {noteMenu.note.pinned ? (
              <>
                <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                Unpin Note
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5 text-primary" />
                Pin Note
              </>
            )}
          </button>
          {!noteMenu.note.readOnly && (
            <>
              <button
                onClick={() => {
                  setShareTargetNote(noteMenu.note);
                  setNoteMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted"
              >
                <Share2 className="h-3.5 w-3.5 text-sky-500" />
                Share Note
              </button>
              <button
                onClick={() => {
                  setRenameTargetNote(noteMenu.note);
                  setRenameNoteValue(noteMenu.note.title);
                  setNoteMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Rename Note
              </button>
              <button
                onClick={() => {
                  handleDeleteNote(noteMenu.note.id);
                  setNoteMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-500 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Note
              </button>
            </>
          )}
        </div>
      )}

      {/* Sharing Dialog Modal */}
      {shareTargetNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/20">
                <UserPlus className="h-5 w-5 text-sky-500" />
              </div>
              <button
                onClick={() => setShareTargetNote(null)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Share Note</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Share <span className="font-semibold text-foreground">"{shareTargetNote.title}"</span> with another student. They will receive an invitation to accept the shared note.
            </p>
            <div className="mt-4">
              <label htmlFor="share-email-input" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Recipient Email Address
              </label>
              <input
                id="share-email-input"
                type="email"
                placeholder="student@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && shareEmail.trim() && !isSharing) {
                    e.preventDefault();
                    handleShareSubmit();
                  }
                  if (e.key === "Escape") { setShareTargetNote(null); setShareEmail(""); }
                }}
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShareTargetNote(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleShareSubmit}
                disabled={isSharing || !shareEmail.trim()}
                className="rounded-xl bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-xs font-extrabold transition flex items-center gap-1.5"
              >
                Share Note
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/60 italic text-right">Enter to share · Esc to cancel</p>
          </div>
        </div>
      )}

      {/* Rename Dialog Modal */}
      {renameTargetNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              <button
                onClick={() => setRenameTargetNote(null)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Rename Note</h3>
            <div className="mt-4">
              <label htmlFor="rename-note-input" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Note Title
              </label>
              <input
                id="rename-note-input"
                type="text"
                autoFocus
                value={renameNoteValue}
                onChange={(e) => setRenameNoteValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameNoteValue.trim() && !isRenamingNote) {
                    e.preventDefault();
                    handleRenameNoteSubmit();
                  }
                  if (e.key === "Escape") setRenameTargetNote(null);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRenameTargetNote(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameNoteSubmit}
                disabled={isRenamingNote || !renameNoteValue.trim()}
                className="rounded-xl bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-xs font-extrabold transition flex items-center gap-1.5"
              >
                {isRenamingNote ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Renaming...
                  </>
                ) : (
                  "Rename Note"
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/60 italic text-right">Enter to rename · Esc to cancel</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:h-[calc(100vh-120px)] lg:overflow-hidden">
        {/* Left Side: Notes List */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col max-h-[320px] lg:max-h-none lg:h-full overflow-hidden space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes… (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setSearchQuery(""); (e.target as HTMLInputElement).blur(); }
                }}
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-ring focus:outline-none"
              />
            </div>
            <button
              onClick={handleAddNote}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90"
              title="Add Note"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Pending Invitations Banner / List */}
          {pendingShares.length > 0 && (
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-sky-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600">Pending Shared Notes</h4>
              </div>
              <div className="space-y-2">
                {pendingShares.map((req) => (
                  <div key={req.id} className="bg-background rounded-lg border border-border/60 p-2.5 text-xs">
                    <p className="font-semibold text-foreground">{req.note_title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Shared by {req.sender_email}</p>
                    <div className="mt-2.5 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRejectShare(req.id)}
                        className="rounded px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptShare(req.id)}
                        className="rounded bg-sky-500 text-white px-2 py-1 text-[10px] font-black transition flex items-center gap-1 hover:bg-sky-600"
                      >
                        <Check className="h-3 w-3" /> Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List display */}
            <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4 hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden notes-container">
              {loading ? (
                <ListSkeleton rows={6} />
              ) : null}
              {/* Pinned Notes section */}
              {!loading && pinnedNotes.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Pinned Notes
                </div>
                {pinnedNotes.map(renderNoteCard)}
              </div>
            )}

              {/* Other Notes section */}
              {!loading && regularNotes.length > 0 && (
              <div className="space-y-2">
                {pinnedNotes.length > 0 && (
                  <div className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-2">
                    All Notes
                  </div>
                )}
                {regularNotes.map(renderNoteCard)}
              </div>
            )}
              {!loading && filteredNotes.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No study notes match your search.
                </div>
              )}
          </div>
        </div>

        {/* Right Side: Selected Note Detail */}
        <div className="flex-1 min-w-0 h-[500px] lg:h-full flex flex-col overflow-hidden pb-4">
            {loading ? (
              <Card className="p-6 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
                <TextSkeleton lines={8} />
              </Card>
            ) : activeNote ? (
            <Card className="p-6 md:p-8 flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {activeNote.subject}
                    </span>
                    {activeNote.sharedByEmail && (
                      <Pill className="bg-sky-500/5 border border-sky-500/20 text-sky-600">
                        Shared by {activeNote.sharedByEmail}
                      </Pill>
                    )}
                    {activeNote.isAi && (
                      <Pill className="bg-primary/5 border border-primary/20 text-primary flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Note
                      </Pill>
                    )}
                  </div>
                  <textarea
                    rows={1}
                    value={activeNote.title}
                    onChange={(e) => {
                      handleEditNoteTitle(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }
                    }}
                    disabled={activeNote.readOnly}
                    className="mt-2 text-2xl font-bold text-foreground bg-transparent border-0 focus:ring-0 focus:outline-none w-full resize-none overflow-hidden break-words whitespace-pre-wrap leading-tight"
                    placeholder="Note Title..."
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <button
                    onClick={() => handleEscalateToTutor(activeNote)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold transition mr-2"
                    title="Escalate note context to Socratic AI Tutor thread"
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    <span>Ask Tutor</span>
                  </button>
                  <button
                    onClick={() => handleTogglePin(activeNote.id)}
                    className="text-lg hover:opacity-80"
                    title={activeNote.pinned ? "Unpin Note" : "Pin Note"}
                  >
                    {activeNote.pinned ? (
                      <Pin className="h-4 w-4 text-primary" />
                    ) : (
                      <PinOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleFavorite(activeNote.id)}
                    disabled={activeNote.readOnly}
                    className="text-lg hover:opacity-80"
                    title={activeNote.isStarred ? "Unfavorite" : "Favorite"}
                  >
                    {activeNote.isStarred ? "★" : "☆"}
                  </button>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Updated {activeNote.updated}</span>
                  </div>
                </div>
              </div>

              {/* Note Images List (if any) */}
              {activeNote.images && activeNote.images.length > 0 && (
                <div className="mt-4 flex flex-col gap-1.5 border-b border-border pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Attached Context Images
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeNote.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveLightboxImage(img)}
                        className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted cursor-pointer hover:opacity-80 transition"
                      >
                        <img
                          src={img}
                          alt={`Attached note context ${idx}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Content — WYSIWYG Rich Editor with toolbar */}
              <div className="mt-6 flex-1 text-sm leading-relaxed text-foreground flex flex-col overflow-y-auto overflow-x-hidden pr-1 hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden notes-container notes-editor-container">
                {activeNote.readOnly ? (
                    <div className="text-foreground min-h-[300px] flex-1 rounded-2xl border border-border/80 bg-elevated/30 p-6 md:p-8 shadow-sm break-words overflow-x-hidden min-w-0">
                      <MarkdownRenderer content={activeNote.content} cognitiveProfile={cognitiveProfile} />
                    </div>
                ) : (
                    <RichEditor
                      key={activeNote.id}
                      value={activeNote.content}
                      onChange={handleEditNoteContent}
                      onSave={() => toast.success("Note saved")}
                      isSaving={isSavingNote}
                      readOnly={activeNote.readOnly}
                      placeholder="Start writing your notes..."
                    />
                )}
                  {activeNote.readOnly && (
                  <div className="mt-4 rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted-foreground">
                    This note is read-only.
                  </div>
                )}
                  {activeNote.isAi && !activeNote.readOnly && (
                  <div className="mt-8 rounded-lg border border-border bg-elevated p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <BookOpen className="h-4 w-4" /> Study Guidelines
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground list-disc list-inside">
                      <li>
                        Review this summary alongside the original source document for citation
                        details.
                      </li>
                      <li>
                        Try taking a custom Quiz generated from these topics to test your recall.
                      </li>
                      <li>
                        Review flashcards periodically to lock in the key concepts and formulas.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center bg-elevated/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No notes yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Create your first study note to start writing or review notes generated during your AI tutoring sessions.
              </p>
              <button
                onClick={handleAddNote}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-sm"
              >
                <Plus className="h-4 w-4" /> Create Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-all duration-300 animate-fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition cursor-pointer"
            onClick={() => setActiveLightboxImage(null)}
            aria-label="Close image overlay"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={activeLightboxImage}
            alt="Context view"
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl animate-scale-up"
          />
        </div>
      )}
    </AppShell>
  );
}
