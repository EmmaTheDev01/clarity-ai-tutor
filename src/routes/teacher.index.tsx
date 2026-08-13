import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui-kit";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  Plus,
  Trash2,
  FileCheck2,
  Lock,
  Unlock,
  MessageSquare,
  FileText,
  HelpCircle,
  Upload,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { uploadLearningMaterial } from "@/lib/learning-materials";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Educator Portal — purelearn.ai" }] }),
  component: TeacherPortal,
});

export function TeacherPortal() {
  const navigate = useNavigate();

  // Teacher Approval & Profile state
  const [profileStatus, setProfileStatus] = useState<"loading" | "approved" | "pending" | "rejected">("loading");
  const [userEmail, setUserEmail] = useState("");
  const [educatorName, setEducatorName] = useState("Educator");
  const [userId, setUserId] = useState<string | null>(null);

  // Live Database States (NO MOCK DATA)
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [activeClassroom, setActiveClassroom] = useState<any | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [classroomMaterials, setClassroomMaterials] = useState<any[]>([]);
  const [classroomQuizzes, setClassroomQuizzes] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Classroom creation state
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Material upload state
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState("PDF");
  const [materialContent, setMaterialContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Quiz creation state
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Check teacher authentication & approval status
  useEffect(() => {
    const initTeacherData = async () => {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          const localProfile = localStorage.getItem("user_profile");
          if (localProfile) {
            const parsed = JSON.parse(localProfile);
            setUserEmail(parsed.email || "");
            setEducatorName(parsed.name || "Educator");
          }
          setProfileStatus("approved");
          setIsLoading(false);
          return;
        }

        const uId = userData.user.id;
        setUserId(uId);
        setUserEmail(userData.user.email || "");

        const { data: dbProf } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uId)
          .maybeSingle();

        if (dbProf) {
          if (dbProf.name) setEducatorName(dbProf.name);
          setProfileStatus((dbProf.approval_status || "approved") as any);
        } else {
          setProfileStatus("approved");
        }

        // Fetch real teacher classrooms from database
        fetchTeacherClassrooms(uId);
      } catch (err) {
        console.warn("Could not load teacher profile:", err);
        setProfileStatus("approved");
        setIsLoading(false);
      }
    };

    initTeacherData();
  }, []);

  // Fetch classrooms created by this teacher
  const fetchTeacherClassrooms = async (tId: string) => {
    try {
      const { data, error } = await supabase
        .from("classrooms")
        .select("*")
        .eq("teacher_id", tId)
        .order("created_at", { ascending: false });

      if (data) {
        setClassrooms(data);
        if (data.length > 0) {
          setActiveClassroom(data[0]);
          fetchClassroomDetails(data[0].id);
        }
      }
    } catch (err) {
      console.warn("Error loading classrooms from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch enrolled students, materials, and quizzes for a classroom
  const fetchClassroomDetails = async (classId: string) => {
    try {
      // 1. Fetch Enrolled Students in classroom
      const { data: sData } = await supabase
        .from("classroom_students")
        .select("student_id, joined_at, profiles(name, email, role)")
        .eq("classroom_id", classId);

      if (sData) {
        setEnrolledStudents(sData);
      } else {
        setEnrolledStudents([]);
      }

      // 2. Fetch Materials for classroom
      const { data: mData } = await supabase
        .from("materials")
        .select("*")
        .eq("classroom_id", classId)
        .order("created_at", { ascending: false });

      if (mData) {
        setClassroomMaterials(mData);
      } else {
        setClassroomMaterials([]);
      }

      // 3. Fetch Quizzes for classroom
      const { data: qData } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (qData) {
        setClassroomQuizzes(qData);

        // 4. Fetch Quiz Attempts for student submissions
        const quizIds = qData.map((q) => q.id);
        if (quizIds.length > 0) {
          const { data: attData } = await supabase
            .from("quiz_attempts")
            .select("*, profiles(name, email)")
            .in("quiz_id", quizIds)
            .order("created_at", { ascending: false });

          if (attData) setQuizAttempts(attData);
        }
      }
    } catch (err) {
      console.warn("Error fetching classroom details:", err);
    }
  };

  // Handler: Create new Classroom in database
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassSubject.trim()) {
      toast.error("Please provide both classroom name and subject.");
      return;
    }
    if (!userId) {
      toast.error("Must be signed in to create a classroom.");
      return;
    }

    setIsCreatingClass(true);
    try {
      const { data, error } = await supabase
        .from("classrooms")
        .insert({
          name: newClassName.trim(),
          subject: newClassSubject.trim(),
          teacher_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Classroom "${newClassName}" created successfully!`);
      setNewClassName("");
      setNewClassSubject("");
      if (userId) fetchTeacherClassrooms(userId);
    } catch (err: any) {
      toast.error(err.message || "Could not create classroom.");
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Handler: Upload Classroom Material to database
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim()) {
      toast.error("Please enter a title for the material.");
      return;
    }
    if (!activeClassroom) {
      toast.error("Please select or create a classroom first.");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error } = await supabase.from("materials").insert({
        title: materialTitle.trim(),
        type: materialType,
        content: materialContent.trim() || undefined,
        classroom_id: activeClassroom.id,
        uploaded_by: userId,
        source_kind: selectedFile ? "file" : materialContent.trim() ? "text" : "link",
      }).select().single();

      if (error) throw error;

      toast.success("Study material uploaded to classroom!");
      setMaterialTitle("");
      setMaterialContent("");
      setSelectedFile(null);
      if (activeClassroom) fetchClassroomDetails(activeClassroom.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload material.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handler: Create Quiz in database
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim() || !quizQuestion.trim()) {
      toast.error("Please provide quiz title and question.");
      return;
    }
    if (!userId) {
      toast.error("Must be signed in to create quizzes.");
      return;
    }

    setIsCreatingQuiz(true);
    try {
      const questionObj = {
        question: quizQuestion.trim(),
        options: quizOptions.map((o) => o.trim()).filter(Boolean),
        correctIndex,
      };

      const { error } = await supabase.from("quizzes").insert({
        title: quizTitle.trim(),
        teacher_id: userId,
        questions: [questionObj],
      });

      if (error) throw error;

      toast.success("Quiz created successfully!");
      setQuizTitle("");
      setQuizQuestion("");
      setQuizOptions(["", "", ""]);
      if (activeClassroom) fetchClassroomDetails(activeClassroom.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to create quiz.");
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // If teacher profile status is under review (pending)
  if (profileStatus === "pending") {
    return (
      <AppShell title="Educator Portal">
        <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-full border border-border bg-muted flex items-center justify-center text-foreground">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Educator Verification Pending
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome, <strong className="text-foreground">{educatorName}</strong>. Your educator account is currently under review by system administrators. Once verified, your classroom management features will be unlocked automatically.
          </p>
          <div className="pt-4 border-t border-border flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Check Status
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Educator Portal"
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-foreground">
            {educatorName}
          </span>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  My Classrooms
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {classrooms.length}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
              Created classrooms in DB
            </div>
          </Card>

          <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Enrolled Students
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {enrolledStudents.length}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
              Active enrolled students
            </div>
          </Card>

          <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Classroom Materials
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {classroomMaterials.length}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
              Uploaded study resources
            </div>
          </Card>

          <Card className="p-5 bg-background border border-border rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Published Quizzes
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {classroomQuizzes.length}
                </h3>
              </div>
              <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground shrink-0">
                <FileCheck2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
              Submissions: {quizAttempts.length}
            </div>
          </Card>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Classroom List & Creation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Classroom Card */}
            <Card className="p-6 bg-background border border-border rounded-xl space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Classroom
              </h3>
              <form onSubmit={handleCreateClassroom} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Classroom Name
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Advanced STEM Physics"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Subject / Department
                  </label>
                  <input
                    type="text"
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    placeholder="e.g. Quantum Physics"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingClass}
                  className="w-full py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  {isCreatingClass ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Create Classroom
                </button>
              </form>
            </Card>

            {/* My Classrooms Selector List */}
            <Card className="p-6 bg-background border border-border rounded-xl space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                My Classrooms ({classrooms.length})
              </h3>
              <div className="space-y-2">
                {classrooms.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No classrooms created yet. Use the form above to create your first classroom.
                  </p>
                ) : (
                  classrooms.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setActiveClassroom(cls);
                        fetchClassroomDetails(cls.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                        activeClassroom?.id === cls.id
                          ? "border-foreground bg-muted/60 font-bold"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="text-xs text-foreground font-semibold">{cls.name}</div>
                        <div className="text-[11px] text-muted-foreground">{cls.subject}</div>
                      </div>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Active Classroom Details, Materials & Quizzes */}
          <div className="lg:col-span-2 space-y-6">
            {activeClassroom ? (
              <>
                {/* Upload Material Section */}
                <Card className="p-6 bg-background border border-border rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Add Study Resource for "{activeClassroom.name}"
                    </h3>
                  </div>

                  <form onSubmit={handleUploadMaterial} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Resource Title
                        </label>
                        <input
                          type="text"
                          value={materialTitle}
                          onChange={(e) => setMaterialTitle(e.target.value)}
                          placeholder="e.g. Chapter 4 Lecture Notes"
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Type
                        </label>
                        <select
                          value={materialType}
                          onChange={(e) => setMaterialType(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                        >
                          <option value="PDF">PDF Document</option>
                          <option value="Word">Word File</option>
                          <option value="Notes">Lecture Notes</option>
                          <option value="Text">Raw Text</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Content / Summary Text
                      </label>
                      <textarea
                        value={materialContent}
                        onChange={(e) => setMaterialContent(e.target.value)}
                        placeholder="Paste study text or lecture notes here..."
                        rows={3}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      {isUploading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload Resource
                    </button>
                  </form>
                </Card>

                {/* Create Quiz Card */}
                <Card className="p-6 bg-background border border-border rounded-xl space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4" />
                    Create Quiz for Classroom
                  </h3>

                  <form onSubmit={handleCreateQuiz} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Quiz Title
                      </label>
                      <input
                        type="text"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="e.g. Midterm Evaluation Quiz"
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Question
                      </label>
                      <input
                        type="text"
                        value={quizQuestion}
                        onChange={(e) => setQuizQuestion(e.target.value)}
                        placeholder="e.g. What is the fundamental theorem of calculus?"
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Options
                      </label>
                      {quizOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={correctIndex === idx}
                            onChange={() => setCorrectIndex(idx)}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...quizOptions];
                              updated[idx] = e.target.value;
                              setQuizOptions(updated);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingQuiz}
                      className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      {isCreatingQuiz ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Publish Quiz
                    </button>
                  </form>
                </Card>

                {/* Classroom Enrolled Students List */}
                <Card className="p-6 bg-background border border-border rounded-xl space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                    Enrolled Students ({enrolledStudents.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground uppercase font-mono text-[10px]">
                          <th className="pb-3 font-semibold">Student Name</th>
                          <th className="pb-3 font-semibold">Email</th>
                          <th className="pb-3 font-semibold">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {enrolledStudents.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-muted-foreground">
                              No students enrolled in this classroom yet.
                            </td>
                          </tr>
                        ) : (
                          enrolledStudents.map((st, i) => (
                            <tr key={st.student_id || i} className="hover:bg-muted/40 transition-colors">
                              <td className="py-3 font-bold text-foreground">
                                {st.profiles?.name || "Student"}
                              </td>
                              <td className="py-3 text-muted-foreground font-mono">
                                {st.profiles?.email || "—"}
                              </td>
                              <td className="py-3 text-muted-foreground">
                                {new Date(st.joined_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 bg-background border border-border rounded-xl text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />
                <h3 className="mt-3 text-sm font-bold text-foreground">No Classroom Selected</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a classroom from the left sidebar or create a new classroom to manage study materials and quizzes.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
