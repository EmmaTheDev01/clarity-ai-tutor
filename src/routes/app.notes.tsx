import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";
import { FileText, Sparkles, BookOpen, Plus, Search, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/notes")({
  head: () => ({ meta: [{ title: "Notes — tutor.vigilance.rw" }] }),
  component: NotesPage,
});

const appGuideNotes = [
  {
    id: "guide_workspace",
    title: "How to Use the AI Study Workspace",
    subject: "App Guide",
    updated: "Built in",
    content:
      "Start in Chat & Study Workspace. Add a PDF, Word document, slide deck, image, audio, video, YouTube link, web link, or text file. Select a material in the left library, then ask a focused question about a page, section, timestamp, diagram, or term.\n\nThe tutor uses your active source as context, explains ideas in clear steps, and saves useful concept summaries into this notebook.",
    isAi: true,
    readOnly: true,
  },
  {
    id: "guide_library",
    title: "How Library Uploads Work",
    subject: "App Guide",
    updated: "Built in",
    content:
      "Use Library when you want to manage all study sources in one place. Upload supported files or paste links. Files are stored in Supabase Storage and registered as materials, so the dashboard, document pages, analytics, and AI chat can all reference the same learning item.\n\nGive each upload a clear title when possible. It helps search, citations, summaries, and later review.",
    isAi: true,
    readOnly: true,
  },
  {
    id: "guide_notes",
    title: "How Notes Are Created",
    subject: "App Guide",
    updated: "Built in",
    content:
      "These App Guide notes are intentionally locked so every learner keeps a stable map of the system. Your own manual notes and AI-generated study summaries appear alongside them and can be edited, starred, and searched.\n\nA good workflow is: upload source, ask the tutor to explain one confusing point, review the saved note, then turn the note into flashcards or a quiz.",
    isAi: true,
    readOnly: true,
  },
];

type Note = {
  id: string;
  title: string;
  subject: string;
  updated: string;
  content: string;
  isAi: boolean;
  isStarred?: boolean;
  readOnly?: boolean;
};

const removedStaticNoteIds = new Set(["n1", "n2", "n3"]);

const readStoredNotes = () => {
  if (typeof window === "undefined") return appGuideNotes;
  try {
    const stored = localStorage.getItem("digital_notebook");
    const parsed = stored ? JSON.parse(stored) : [];
    const userNotes = Array.isArray(parsed)
      ? parsed.filter((note: Note) => !removedStaticNoteIds.has(note.id))
      : [];
    return [...appGuideNotes, ...userNotes];
  } catch {
    return appGuideNotes;
  }
};

const persistUserNotes = (notes: Note[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("digital_notebook", JSON.stringify(notes.filter((note) => !note.readOnly)));
};

function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(readStoredNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync selectedNote initially
  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  // Load from Supabase on mount
  useEffect(() => {
    const fetchSupabaseNotes = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: dbNotes } = await supabase
            .from("notes")
            .select("*")
            .eq("student_id", userData.user.id)
            .order("created_at", { ascending: false });

          if (dbNotes && dbNotes.length > 0) {
            const mapped = dbNotes.map((n) => ({
              id: n.id,
              title: n.title,
              subject: n.subject || "General",
              content: n.content,
              isAi: n.is_ai_generated,
              isStarred: n.is_starred,
              updated: new Date(n.updated_at).toLocaleDateString(),
            }));
            setNotes([...appGuideNotes, ...mapped]);
            setSelectedNote(mapped[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch notes from Supabase, fallback to local storage active.", err);
      }
    };
    fetchSupabaseNotes();
  }, []);

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddNote = () => {
    const newNote = {
      id: "note_" + Date.now(),
      title: "New Study Note",
      subject: "General",
      updated: "Just now",
      content: "Type your notes here...",
      isAi: false,
      isStarred: false,
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setSelectedNote(newNote);
    persistUserNotes(updated);

    // Supabase background transaction
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("notes").insert({
            student_id: userData.user.id,
            title: newNote.title,
            subject: newNote.subject,
            content: newNote.content,
            is_ai_generated: false,
          });

          await supabase.from("user_logs").insert({
            user_id: userData.user.id,
            action_type: "note_created",
            details: `Created manual note: "${newNote.title}"`,
          });
        }
      } catch (err) {
        console.warn("Supabase background note insert failure:", err);
      }
    })();
  };

  const handleEditNoteContent = (content: string) => {
    if (!selectedNote) return;
    if (selectedNote.readOnly) return;
    const updated = notes.map((n) => (n.id === selectedNote.id ? { ...n, content } : n));
    setNotes(updated);
    setSelectedNote({ ...selectedNote, content });
    persistUserNotes(updated);

    // Supabase background transaction
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (selectedNote.id.toString().includes("-")) {
            await supabase.from("notes").update({ content }).eq("id", selectedNote.id);
          }
        }
      } catch (err) {
        console.warn("Supabase background note content update failure:", err);
      }
    })();
  };

  const handleEditNoteTitle = (title: string) => {
    if (!selectedNote) return;
    if (selectedNote.readOnly) return;
    const updated = notes.map((n) => (n.id === selectedNote.id ? { ...n, title } : n));
    setNotes(updated);
    setSelectedNote({ ...selectedNote, title });
    persistUserNotes(updated);

    // Supabase background transaction
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (selectedNote.id.toString().includes("-")) {
            await supabase.from("notes").update({ title }).eq("id", selectedNote.id);
          }
        }
      } catch (err) {
        console.warn("Supabase background note title update failure:", err);
      }
    })();
  };

  const handleToggleFavorite = (noteId: string) => {
    if (notes.find((n) => n.id === noteId)?.readOnly) return;
    const updated = notes.map((n) => (n.id === noteId ? { ...n, isStarred: !n.isStarred } : n));
    setNotes(updated);
    const target = notes.find((n) => n.id === noteId);
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, isStarred: !selectedNote.isStarred });
    }
    persistUserNotes(updated);

    // Supabase background transaction
    if (target) {
      (async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            if (noteId.toString().includes("-")) {
              await supabase
                .from("notes")
                .update({ is_starred: !target.isStarred })
                .eq("id", noteId);
            }
            await supabase.from("user_logs").insert({
              user_id: userData.user.id,
              action_type: !target.isStarred ? "note_starred" : "note_unstarred",
              details: `Toggled star status on note: "${target.title}"`,
            });
          }
        } catch (err) {
          console.warn("Supabase background favorite toggle failure:", err);
        }
      })();
    }
  };

  return (
    <AppShell title="Notes & Summaries">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Side: Notes List */}
        <div className="w-full lg:w-96 shrink-0 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`cursor-pointer p-4 transition text-left border ${
                  selectedNote?.id === note.id ? "border-foreground ring-1 ring-foreground" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {note.subject}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {note.isStarred && <span className="text-yellow-500 text-xs">★</span>}
                    {note.isAi && (
                      <Pill className="text-[9px] bg-primary/5 border border-primary/20 text-primary flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> AI Summary
                      </Pill>
                    )}
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground truncate">
                  {note.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {note.updated}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Side: Selected Note Detail */}
        <div className="flex-1 min-w-0">
          {selectedNote ? (
            <Card className="p-6 md:p-8 min-h-[500px] flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedNote.subject}
                    </span>
                    {selectedNote.isAi && (
                      <Pill className="bg-primary/5 border border-primary/20 text-primary flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> AI Generated Summary
                      </Pill>
                    )}
                  </div>
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleEditNoteTitle(e.target.value)}
                    disabled={selectedNote.readOnly}
                    className="mt-2 text-2xl font-bold text-foreground bg-transparent border-0 focus:ring-0 focus:outline-none w-full"
                    placeholder="Note Title..."
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <button
                    onClick={() => handleToggleFavorite(selectedNote.id)}
                    disabled={selectedNote.readOnly}
                    className="text-lg hover:opacity-80"
                    title={selectedNote.isStarred ? "Unfavorite" : "Favorite"}
                  >
                    {selectedNote.isStarred ? "★" : "☆"}
                  </button>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Updated {selectedNote.updated}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex-1 text-sm leading-relaxed text-foreground flex flex-col">
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => handleEditNoteContent(e.target.value)}
                  readOnly={selectedNote.readOnly}
                  className="w-full flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none min-h-[300px] text-foreground leading-relaxed"
                  placeholder="Start typing or let the AI take summaries..."
                />
                {selectedNote.readOnly && (
                  <div className="mt-4 rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted-foreground">
                    This app guide note is generated from the current UI structure and cannot be
                    edited.
                  </div>
                )}
                {selectedNote.isAi && (
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
            <div className="flex min-h-[500px] items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              Select or create a study note to view details.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
