import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  Settings,
  HelpCircle,
  Upload,
  Plus,
  Trash2,
  FileCheck2,
  Lock,
  Unlock,
  MessageSquare,
  LogOut,
  Brain,
  Layers,
} from "lucide-react";
import { uploadLearningMaterial } from "@/lib/learning-materials";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Educator Portal — purelearn.ai" }] }),
  component: TeacherPortal,
});

// Mock Students data enrolled in Dr. Sarah Adeyemi's Class (Linear Algebra & ML)
const mockStudents = [
  {
    id: "s1",
    name: "Alex Johnson",
    email: "alex@school.edu",
    grade: "88%",
    profile: "ADHD Focus",
    activity: "Active 2h ago",
  },
  {
    id: "s2",
    name: "Aisha Keza",
    email: "aisha@school.edu",
    grade: "94%",
    profile: "Dyslexia Friendly",
    activity: "Active 10m ago",
  },
  {
    id: "s3",
    name: "Jean-Luc Munyaneza",
    email: "jl.m@school.edu",
    grade: "76%",
    profile: "Standard Mode",
    activity: "Active Yesterday",
  },
  {
    id: "s4",
    name: "Deborah Umutoni",
    email: "deborah@school.edu",
    grade: "91%",
    profile: "Sensory Low-Stimulus",
    activity: "Active 3d ago",
  },
];

type PublishedMaterial = {
  title: string;
  type: string;
  quiz: boolean;
  cards: number;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

function TeacherPortal() {
  const navigate = useNavigate();

  const [profileStatus, setProfileStatus] = useState<"loading" | "approved" | "pending" | "rejected">("loading");
  const [userEmail, setUserEmail] = useState("");
  const [educatorName, setEducatorName] = useState("Dr. Sarah Adeyemi");
  const [institutionName, setInstitutionName] = useState("University of Rwanda");

  useEffect(() => {
    const checkApproval = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          const localProfile = localStorage.getItem("user_profile");
          if (localProfile) {
            const parsed = JSON.parse(localProfile);
            setUserEmail(parsed.email || "");
            setEducatorName(parsed.name || "Dr. Sarah Adeyemi");
            setInstitutionName(parsed.institution || "University of Rwanda");

            const { data: dbProf } = await supabase
              .from("profiles")
              .select("*")
              .eq("email", parsed.email)
              .maybeSingle();
            if (dbProf && (dbProf as any).approval_status) {
              setProfileStatus((dbProf as any).approval_status);
            } else {
              setProfileStatus("approved");
            }
          } else {
            setProfileStatus("approved");
          }
          return;
        }
        setUserEmail(userData.user.email || "");
        const { data: dbProf } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (dbProf) {
          if (dbProf.name) setEducatorName(dbProf.name);
          setProfileStatus(((dbProf as any).approval_status || "approved") as any);
        } else {
          setProfileStatus("approved");
        }
      } catch (err) {
        setProfileStatus("approved");
      }
    };
    checkApproval();
  }, []);

  // States for Class, Materials & Quiz loop
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState("PDF");
  const [materialContent, setMaterialContent] = useState("");

  // Quiz creation inputs
  const [quizAttached, setQuizAttached] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  // Flashcards creation inputs
  const [flashcardAttached, setFlashcardAttached] = useState(false);
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");

  // AI Prompt custom sandbox rules
  const [sandboxPrompt, setSandboxPrompt] = useState(
    "You are a strict Socratic STEM coach. Identify the core logical flaw in their code/math and ask 2 helpful hints. Never print code chunks.",
  );
  const [uploadedSyllabi, setUploadedSyllabi] = useState<string[]>([
    "linear-algebra-syllabus-2026.pdf",
  ]);
  const [syllabiFile, setSyllabiFile] = useState("");
  const [syllabiStatus, setSyllabiStatus] = useState("");

  // Publish Status
  const [publishedMaterials, setPublishedMaterials] = useState<PublishedMaterial[]>([
    { title: "Linear Algebra — Chapter 4", type: "PDF", quiz: true, cards: 4 },
    { title: "Neural Networks Lecture Notes", type: "Text", quiz: true, cards: 8 },
  ]);

  const isPublishLocked = !materialTitle || !materialContent || !quizAttached || !flashcardAttached;

  const handleAttachQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizQuestion || quizOptions.some((opt) => !opt.trim())) return;
    setQuizAttached(true);
  };

  const handleAttachFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardFront || !flashcardBack) return;
    setFlashcardAttached(true);
  };

  const handlePublish = () => {
    if (isPublishLocked) return;

    setPublishedMaterials((prev) => [
      ...prev,
      {
        title: materialTitle,
        type: materialType,
        quiz: true,
        cards: 1,
      },
    ]);

    // Reset forms
    setMaterialTitle("");
    setMaterialContent("");
    setQuizQuestion("");
    setQuizOptions(["", "", ""]);
    setQuizAttached(false);
    setFlashcardFront("");
    setFlashcardBack("");
    setFlashcardAttached(false);
  };

  const handleSyllabusUpload = async (file?: File | null) => {
    if (!file) return;
    setSyllabiStatus("Uploading syllabus...");
    try {
      const material = await uploadLearningMaterial({ file, title: file.name });
      setUploadedSyllabi((prev) => [material.title, ...prev]);
      setSyllabiStatus("Syllabus uploaded to study files.");
    } catch (err: unknown) {
      setSyllabiStatus(getErrorMessage(err, "Could not upload syllabus."));
    } finally {
      setTimeout(() => setSyllabiStatus(""), 3500);
    }
  };

  const handleSyllabusLink = async () => {
    if (!syllabiFile.trim()) return;
    setSyllabiStatus("Adding reference link...");
    try {
      const material = await uploadLearningMaterial({ link: syllabiFile.trim() });
      setUploadedSyllabi((prev) => [material.title, ...prev]);
      setSyllabiFile("");
      setSyllabiStatus("Reference link added to study files.");
    } catch (err: unknown) {
      setSyllabiStatus(getErrorMessage(err, "Could not add reference link."));
    } finally {
      setTimeout(() => setSyllabiStatus(""), 3500);
    }
  };

  if (profileStatus === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-xs text-muted-foreground animate-pulse font-medium">Verifying educator credentials...</p>
        </div>
      </div>
    );
  }

  if (profileStatus === "pending") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg relative overflow-hidden text-center animate-fade-in">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
            <Lock className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Account Verification Pending</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Your educator account is currently under review by purelearn.ai administrators.
            You will have full access to class creation, custom Socratic sandbox rules, and document uploads once verified.
          </p>
          {userEmail && (
            <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground mb-6 font-mono">
              Registered as: {userEmail}
            </div>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem("user_profile");
              navigate({ to: "/auth/sign-in" as any });
            }}
            className="w-full py-2.5 rounded-lg bg-border hover:bg-muted text-foreground text-sm font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (profileStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg relative overflow-hidden text-center animate-fade-in">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
            <Lock className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Verification Rejected</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Unfortunately, your educator account request could not be verified by the admin team at this time.
            Access to teacher classrooms and student rosters is restricted.
          </p>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs mb-6">
            If you believe this is a mistake, please contact verification@purelearn.ai.
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem("user_profile");
              navigate({ to: "/auth/sign-in" as any });
            }}
            className="w-full py-2.5 rounded-lg bg-border hover:bg-muted text-foreground text-sm font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-wider text-foreground flex items-center gap-1.5">

              purelearn.ai
              <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                Educator
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-foreground">{educatorName}</p>
              <p className="text-[10px] text-muted-foreground">{institutionName}</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.removeItem("user_profile");
                navigate({ to: "/auth/sign-in" as any });
              }}
              className="rounded-md border border-border p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Columns */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch min-h-[500px]">
        {/* Left Side: Classrooms & Students (4/12 columns) */}
        <div className="lg:col-span-4 flex flex-col h-full space-y-4">
          <Card className="flex flex-col h-full overflow-hidden p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Classroom Enrolment
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2 mb-4 leading-relaxed">
              Dr. Adeyemi&apos;s Linear Algebra 101. Student tracking is isolated to your registered
              class members.
            </p>

            <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
              {mockStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{s.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="rounded bg-elevated border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {s.profile}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-500">{s.grade}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">
                      {s.activity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Middle Side: Material Publisher & 1:1 Loop Validation (4/12 columns) */}
        <div className="lg:col-span-4 flex flex-col h-full space-y-4">
          <Card className="flex flex-col h-full overflow-hidden p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Content-to-Evaluation Loop
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2 mb-4 leading-relaxed">
              Every lesson upload requires a linked diagnostic quiz and flashcard set before
              publishing.
            </p>

            <div className="flex-1 space-y-4 overflow-y-auto min-h-0 pr-1">
              {/* Form fields */}
              <div>
                <label className="text-[10px] font-semibold text-foreground block mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Linear Transformations"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-foreground block mb-1">
                  Material Content Text
                </label>
                <textarea
                  placeholder="Paste lesson script, reference paragraphs, transcript text, image descriptions, or formulas here..."
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none h-20 resize-none"
                />
              </div>

              {/* Quiz Loop Attachment */}
              <div className="rounded-lg border border-dashed border-border p-3 bg-background">
                <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
                  <span className="text-[10px] font-bold text-foreground flex items-center gap-1">
                    <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                    Quiz Config
                  </span>
                  {quizAttached ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-semibold px-1 rounded">
                      ✓ Configured
                    </span>
                  ) : (
                    <span className="text-[9px] bg-red-500/10 text-red-500 font-semibold px-1 rounded">
                      Required
                    </span>
                  )}
                </div>

                {!quizAttached ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Quiz Question..."
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1 text-[10px] focus:outline-none"
                    />
                    <div className="grid grid-cols-3 gap-1">
                      {quizOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Option ${idx + 1}...`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...quizOptions];
                            updated[idx] = e.target.value;
                            setQuizOptions(updated);
                          }}
                          className="w-full rounded border border-border bg-background px-1.5 py-1 text-[9px] focus:outline-none"
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleAttachQuiz}
                      className="w-full bg-elevated hover:bg-muted text-foreground text-[10px] font-semibold py-1 rounded border border-border"
                    >
                      Attach Quiz
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground truncate italic">
                    Question: {quizQuestion}
                  </p>
                )}
              </div>

              {/* Flashcards Attachment */}
              <div className="rounded-lg border border-dashed border-border p-3 bg-background">
                <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
                  <span className="text-[10px] font-bold text-foreground flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-purple-500" />
                    Flashcard Config
                  </span>
                  {flashcardAttached ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-semibold px-1 rounded">
                      ✓ Configured
                    </span>
                  ) : (
                    <span className="text-[9px] bg-red-500/10 text-red-500 font-semibold px-1 rounded">
                      Required
                    </span>
                  )}
                </div>

                {!flashcardAttached ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Front Text (e.g. Identity Matrix)"
                      value={flashcardFront}
                      onChange={(e) => setFlashcardFront(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1 text-[10px] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Back Definition (e.g. Multiplying is unchanged)"
                      value={flashcardBack}
                      onChange={(e) => setFlashcardBack(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1 text-[10px] focus:outline-none"
                    />
                    <button
                      onClick={handleAttachFlashcard}
                      className="w-full bg-elevated hover:bg-muted text-foreground text-[10px] font-semibold py-1 rounded border border-border"
                    >
                      Attach Flashcard
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground truncate italic">
                    Card: {flashcardFront}
                  </p>
                )}
              </div>
            </div>

            {/* Validation Lock UI Button */}
            <div className="border-t border-border pt-4 mt-2">
              {isPublishLocked ? (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-md text-[10px] text-red-500 mb-3 leading-relaxed">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Publication locked: Fill topics, content text, attach 1 quiz and 1 flashcard to
                    publish.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-[10px] text-emerald-500 mb-3 leading-relaxed">
                  <Unlock className="h-3.5 w-3.5 shrink-0" />
                  <span>All evaluation checks passed. Lesson ready to release.</span>
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={isPublishLocked}
                className={`w-full py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${isPublishLocked
                  ? "bg-muted text-muted-foreground/60 cursor-not-allowed border border-border"
                  : "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm"
                  }`}
              >
                Publish Lesson Material
              </button>
            </div>
          </Card>
        </div>

        {/* Right Side: AI Customization Sandbox (4/12 columns) */}
        <div className="lg:col-span-4 flex flex-col h-full space-y-4">
          <Card className="flex flex-col h-full overflow-hidden p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              AI Prompt Sandbox
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2 mb-4 leading-relaxed">
              Inject custom guardrails. The system forces AI to align with these prompt constraints
              when students ask queries.
            </p>

            <div className="flex-1 space-y-4 overflow-y-auto min-h-0 pr-1">
              <div>
                <label className="text-[10px] font-semibold text-foreground block mb-1">
                  Custom Prompt Rules
                </label>
                <textarea
                  value={sandboxPrompt}
                  onChange={(e) => setSandboxPrompt(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none h-24 resize-none leading-normal"
                />
              </div>

              {/* Syllabi Upload list */}
              <div>
                <label className="text-[10px] font-semibold text-foreground block mb-1">
                  Reference Syllabi Docs
                </label>
                <div className="space-y-1.5 mt-1.5">
                  {uploadedSyllabi.map((syl, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded border border-border bg-background text-[10px]"
                    >
                      <span className="truncate max-w-[85%]">{syl}</span>
                      <button
                        onClick={() =>
                          setUploadedSyllabi((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <label className="flex-1 cursor-pointer rounded border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted">
                    Upload PDF, Word, slides, image, audio, or video
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*,audio/*,video/*"
                      onChange={(event) => handleSyllabusUpload(event.target.files?.[0])}
                    />
                  </label>
                  <button
                    onClick={handleSyllabusLink}
                    className="bg-primary text-primary-foreground font-semibold px-2 py-1 rounded text-[10px]"
                  >
                    Add link
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Or paste a reference link..."
                  value={syllabiFile}
                  onChange={(e) => setSyllabiFile(e.target.value)}
                  className="mt-2 w-full rounded border border-border bg-background px-2.5 py-1 text-[10px] focus:outline-none"
                />
                {syllabiStatus && (
                  <p className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                    {syllabiStatus}
                  </p>
                )}
              </div>

              {/* Test Sandbox input panel */}
              <div className="border-t border-border pt-4">
                <label className="text-[10px] font-semibold text-foreground block mb-2">
                  AI Output Preview
                </label>
                <div className="rounded-lg border border-border bg-background p-3 text-[10px] text-muted-foreground leading-relaxed h-28 overflow-y-auto">
                  <p className="font-semibold text-foreground mb-1">
                    Dr. Adeyemi: &quot;Solve 2x + 4 = 10&quot;
                  </p>
                  <p className="italic">AI Sandbox simulation matches system coach instructions:</p>
                  <p className="mt-1 text-foreground">
                    &quot;Look at the value of 10 on the right. What operation must you perform to
                    isolate 2x on the left? Mention the subtraction rule.&quot;
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
