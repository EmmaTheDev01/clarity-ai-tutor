import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Download,
  Trash2,
  FileText,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  PanelLeft,
  X,
} from "lucide-react";
import {
  Stroke,
  ToolType,
  PaperStyle,
  PaperTheme,
  Scratchpad,
  SocraticStudyGuide,
} from "@/types/scratchpad";
import { ScratchpadCanvas } from "@/components/scratchpad/ScratchpadCanvas";
import { ScratchpadToolbar } from "@/components/scratchpad/ScratchpadToolbar";
import { SocraticDrawer } from "@/components/scratchpad/SocraticDrawer";
import { exportStrokesToImage } from "@/lib/scratchpad-engine";
import { analyzeScratchpadWithAI } from "@/lib/scratchpad-ai";

export const Route = createFileRoute("/app/notepad")({
  head: () => ({ meta: [{ title: "Tablet Notepad — PureLearn" }] }),
  component: ScratchpadPage,
});

function ScratchpadPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active scratchpad state
  const [scratchpadId, setScratchpadId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled Scratchpad");
  const [paperStyle, setPaperStyle] = useState<PaperStyle>("grid");
  const [paperTheme, setPaperTheme] = useState<PaperTheme>("light");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(null);

  // Drawing tools state
  const [currentTool, setCurrentTool] = useState<ToolType>("pen");
  const [currentColor, setCurrentColor] = useState("#0f172a");
  const [currentSize, setCurrentSize] = useState(4);
  const [stylusOnly, setStylusOnly] = useState(false);

  // AI & Drawer state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studyGuide, setStudyGuide] = useState<SocraticStudyGuide | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sheets Gallery / Sidebar state
  const [savedScratchpads, setSavedScratchpads] = useState<Scratchpad[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication check & initial load
  useEffect(() => {
    const initUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth/sign-in" });
        return;
      }
      const uid = data.session.user.id;
      setCurrentUserId(uid);
      loadScratchpadsList(uid);
    };
    initUser();
  }, [navigate]);

  // Load scratchpads from Supabase
  const loadScratchpadsList = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("scratchpads")
        .select("*")
        .eq("student_id", uid)
        .order("updated_at", { ascending: false });

      if (error) {
        console.debug("[Scratchpad] Fetch error:", error.message);
        return;
      }

      if (data && data.length > 0) {
        setSavedScratchpads(data as Scratchpad[]);
        // Auto-open most recent scratchpad if not already set
        if (!scratchpadId) {
          const recent = data[0] as Scratchpad;
          openScratchpad(recent);
        }
      }
    } catch (err) {
      console.debug("[Scratchpad] Load error:", err);
    }
  };

  const openScratchpad = (item: Scratchpad) => {
    setScratchpadId(item.id);
    setTitle(item.title || "Untitled Scratchpad");
    setPaperStyle(item.paper_style || "grid");
    setPaperTheme(item.paper_theme || "light");
    setStrokes(item.strokes_data || []);
    setUndoStack([]);
    setRedoStack([]);
    setLinkedNoteId(item.linked_note_id || null);
    setStudyGuide(item.ai_analysis || null);
    setSaveStatus("saved");
  };

  const createNewScratchpad = () => {
    setScratchpadId(null);
    setTitle("Untitled Scratchpad");
    setStrokes([]);
    setUndoStack([]);
    setRedoStack([]);
    setLinkedNoteId(null);
    setStudyGuide(null);
    setSaveStatus("unsaved");
    setIsSidebarOpen(false);
  };

  // Debounced auto-save to Supabase
  const triggerAutoSave = useCallback(
    (newStrokes: Stroke[]) => {
      setSaveStatus("unsaved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        if (!currentUserId) return;
        setSaveStatus("saving");

        try {
          const canvas = canvasRef.current;
          const thumbnail = canvas
            ? exportStrokesToImage(newStrokes, canvas.width, canvas.height, {
              scale: 0.3,
              mimeType: "image/jpeg",
              quality: 0.7,
            })
            : undefined;

          if (scratchpadId) {
            // Update existing
            const { error } = await supabase
              .from("scratchpads")
              .update({
                title,
                paper_style: paperStyle,
                paper_theme: paperTheme,
                strokes_data: newStrokes,
                thumbnail_url: thumbnail,
                updated_at: new Date().toISOString(),
              })
              .eq("id", scratchpadId);

            if (!error) {
              setSaveStatus("saved");
              setSavedScratchpads((prev) =>
                prev.map((s) =>
                  s.id === scratchpadId
                    ? { ...s, title, paper_style: paperStyle, paper_theme: paperTheme, strokes_data: newStrokes, thumbnail_url: thumbnail, updated_at: new Date().toISOString() }
                    : s,
                ),
              );
            }
          } else {
            // Insert new
            const { data, error } = await supabase
              .from("scratchpads")
              .insert({
                student_id: currentUserId,
                title,
                paper_style: paperStyle,
                paper_theme: paperTheme,
                strokes_data: newStrokes,
                thumbnail_url: thumbnail,
              })
              .select("id")
              .single();

            if (!error && data) {
              setScratchpadId(data.id);
              setSaveStatus("saved");
              loadScratchpadsList(currentUserId);
            }
          }
        } catch (err) {
          console.error("[Scratchpad] Auto-save failed:", err);
          setSaveStatus("unsaved");
        }
      }, 1200);
    },
    [currentUserId, scratchpadId, title, paperStyle, paperTheme],
  );

  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes(newStrokes);
    triggerAutoSave(newStrokes);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, strokes]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setStrokes(previous);
    triggerAutoSave(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setStrokes(next);
    triggerAutoSave(next);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (window.confirm("Clear all strokes on this sheet?")) {
      handleStrokesChange([]);
    }
  };

  // AI Socratic Analysis
  const handleSynthesizeAI = async () => {
    if (strokes.length === 0) {
      toast.error("Write or sketch some notes or formulas first before generating a study guide!");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsAnalyzing(true);
    toast.info("PureLearn AI Vision is inspecting your handwriting & formulas...");

    try {
      const highResSnapshot = exportStrokesToImage(strokes, canvas.width, canvas.height, {
        scale: 1.0,
        mimeType: "image/jpeg",
        quality: 0.9,
      });

      const guide = await analyzeScratchpadWithAI({
        imageBase64: highResSnapshot,
        scratchpadTitle: title,
      });

      setStudyGuide(guide);
      setIsDrawerOpen(true);

      // Save AI analysis and auto-detected subject to database
      if (scratchpadId) {
        await supabase
          .from("scratchpads")
          .update({
            ai_analysis: guide,
            subject: guide.detectedSubject || "General",
            updated_at: new Date().toISOString(),
          })
          .eq("id", scratchpadId);
      }

      toast.success("Socratic study guide successfully created!");
    } catch (err) {
      console.error("[Scratchpad] AI synthesis error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to analyze handwritten notes.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export as PNG
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = exportStrokesToImage(strokes, canvas.width, canvas.height, {
      scale: 2.0,
      mimeType: "image/png",
    });
    const link = document.createElement("a");
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}_notes.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Exported high-resolution drawing image!");
  };

  // Delete scratchpad
  const handleDeleteScratchpad = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this scratchpad?")) return;
    try {
      await supabase.from("scratchpads").delete().eq("id", id);
      setSavedScratchpads((prev) => prev.filter((p) => p.id !== id));
      if (id === scratchpadId) {
        createNewScratchpad();
      }
      toast.success("Scratchpad deleted.");
    } catch (err) {
      toast.error("Failed to delete scratchpad.");
    }
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSidebarOpen) setIsSidebarOpen(false);
        if (isDrawerOpen) setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, isDrawerOpen]);

  return (
    <AppShell title="Notepad">
      <div className="relative w-full h-[calc(100vh-3.5rem)] flex bg-background text-foreground overflow-hidden">
        {/* Full-viewport backdrop — fixed so it covers header + nav sidebar too */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
            style={{ zIndex: 9998 }}
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Full-viewport sheets sidebar — fixed, escapes the AppShell layout entirely */}
        <div
          className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-card text-card-foreground border-r border-border shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen
            ? "translate-x-0 opacity-100 pointer-events-auto shadow-[20px_0_60px_rgba(0,0,0,0.30)]"
            : "-translate-x-full opacity-0 pointer-events-none"
            }`}
          style={{ zIndex: 9999 }}
        >
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                My Sheets ({savedScratchpads.length})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={createNewScratchpad}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                title="Create New Sheet"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Close Sheets (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {savedScratchpads.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No sheets yet. Start writing on the canvas!
              </div>
            ) : (
              savedScratchpads.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => {
                    openScratchpad(sp);
                    setIsSidebarOpen(false);
                  }}
                  className={`group p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${sp.id === scratchpadId
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {sp.thumbnail_url ? (
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                        <img
                          src={sp.thumbnail_url}
                          alt={sp.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground truncate">
                        {sp.title || "Untitled Sheet"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {sp.subject || "General"} • {new Date(sp.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScratchpad(sp.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
          {/* Top Unified 1-Row Floating Control Bar */}
          <div className="absolute top-3 inset-x-3 z-30 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 pointer-events-none">
            {/* Left: Sheets toggle & Title & Save indicator */}
            <div className="flex items-center gap-2 pointer-events-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-xl border shadow-md transition-all flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md ${isSidebarOpen
                  ? "bg-primary text-primary-foreground border-primary shadow-primary/25 scale-105"
                  : "bg-card/90 text-foreground border-border hover:bg-muted"
                  }`}
                title={isSidebarOpen ? "Hide Sheets" : "Open My Sheets"}
              >
                <PanelLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sheets</span>
              </button>

              {/* Inline Title input */}
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus("unsaved");
                }}
                onBlur={() => triggerAutoSave(strokes)}
                placeholder="Untitled Sheet..."
                className="font-bold text-xs sm:text-sm bg-card/80 backdrop-blur-md border border-border rounded-xl px-3 py-1.5 focus:border-primary focus:outline-none transition-colors text-foreground max-w-[130px] sm:max-w-xs shadow-xs"
              />

              {/* Save Status Icon */}
              <div className="hidden sm:flex items-center text-xs text-muted-foreground">
                {saveStatus === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                {saveStatus === "saved" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>

            {/* Center: 1-Row Floating Apple Pencil Toolbar */}
            <div className="pointer-events-auto mx-auto order-last lg:order-none">
              <ScratchpadToolbar
                currentTool={currentTool}
                onToolChange={setCurrentTool}
                currentColor={currentColor}
                onColorChange={setCurrentColor}
                currentSize={currentSize}
                onSizeChange={setCurrentSize}
                paperStyle={paperStyle}
                onPaperStyleChange={(style) => {
                  setPaperStyle(style);
                  triggerAutoSave(strokes);
                }}
                paperTheme={paperTheme}
                onPaperThemeChange={(theme) => {
                  setPaperTheme(theme);
                  triggerAutoSave(strokes);
                }}
                stylusOnly={stylusOnly}
                onStylusOnlyChange={setStylusOnly}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                onSynthesizeAI={handleSynthesizeAI}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Right: Study Guide Drawer & Download PNG */}
            <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">


              <button
                type="button"
                onClick={handleDownloadPNG}
                title="Download Canvas PNG"
                className="p-2 rounded-xl bg-card/90 text-foreground border border-border shadow-md hover:bg-muted transition-colors backdrop-blur-md"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Engine */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            <ScratchpadCanvas
              canvasRef={canvasRef}
              strokes={strokes}
              onStrokesChange={handleStrokesChange}
              currentTool={currentTool}
              currentColor={currentColor}
              currentSize={currentSize}
              paperStyle={paperStyle}
              paperTheme={paperTheme}
              stylusOnly={stylusOnly}
            />
          </div>
        </div>

        {/* Socratic Study Guide Drawer */}
        <SocraticDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          studyGuide={studyGuide}
          thumbnailUrl={
            canvasRef.current
              ? exportStrokesToImage(strokes, canvasRef.current.width, canvasRef.current.height, {
                scale: 0.5,
                quality: 0.8,
              })
              : undefined
          }
          scratchpadId={scratchpadId || undefined}
          existingNoteId={linkedNoteId || undefined}
        />
      </div>
    </AppShell>
  );
}
