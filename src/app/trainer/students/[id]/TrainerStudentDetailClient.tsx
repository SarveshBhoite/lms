"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  CheckSquare,
  HelpCircle,
  FileCheck,
  Award,
  Lock,
  MessageSquare,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  ShieldAlert,
  FileText,
  RotateCcw,
  X,
  Sparkles,
  GraduationCap,
  Calendar,
  Layers,
  Check,
  Mail,
  Phone,
  Video,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface NoteItem {
  id: string;
  studentId: string;
  trainerId: string;
  content: string;
  createdAt: string;
  trainer: { id: string; name: string; email: string };
}

interface StudentDetailData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    phone?: string | null;
    avatarUrl?: string | null;
    designation?: string | null;
    bio?: string | null;
  } | null;
  enrollments: {
    id: string;
    enrolledAt: string;
    status: string;
    course: { id: string; title: string; level: string; durationHours: number };
    batch?: { id: string; name: string; startDate: string; endDate: string } | null;
  }[];
  studentBatches?: {
    id: string;
    batch: { id: string; name: string; startDate: string; endDate: string; courseId: string };
  }[];
  courseProgresses: {
    id: string;
    progressPercent: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    isCompleted: boolean;
    course: { id: string; title: string };
  }[];
  lessonProgresses: {
    id: string;
    isCompleted: boolean;
    lastWatchedAt: string;
    lesson: {
      id: string;
      title: string;
      contentType: string;
      module: { title: string };
    };
  }[];
  quizAttempts: {
    id: string;
    score: number;
    isPassed: boolean;
    startedAt: string;
    submittedAt?: string | null;
    quiz: { id: string; title: string; passingMarks: number; timeLimitMinutes: number };
  }[];
  assignmentSubmissions: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    status: string;
    submittedAt: string;
    assignment: { id: string; title: string; totalMarks: number; deadline: string };
    feedback?: { marksAwarded: number; feedbackText: string; trainer: { name: string } } | null;
  }[];
  attendances: {
    id: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    recordedAt: string;
    liveClass: { id: string; title: string; scheduledDate: string; batch: { name: string } };
  }[];
  certificates: {
    id: string;
    certificateNumber: string;
    issueDate: string;
    course: { title: string };
  }[];
  studentNotes: NoteItem[];
}

export default function TrainerStudentDetailClient({
  initialStudent,
  currentUserId,
}: {
  initialStudent: StudentDetailData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetailData>(initialStudent);
  const [activeTab, setActiveTab] = useState<
    "overview" | "progress" | "quizzes" | "assignments" | "attendance" | "certificates" | "notes"
  >("overview");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  // Assignment Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [gradingLoading, setGradingLoading] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshStudent = async () => {
    try {
      const res = await fetch(`/api/trainer/students/${student.id}`);
      const data = await res.json();
      if (data.success) {
        setStudent(data.data);
      }
    } catch (err) {
      console.error("Failed to refresh student:", err);
    }
  };

  // Add Private Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/trainer/students/${student.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add note");

      showToast("success", "Private academic faculty note added!");
      setNewNoteContent("");
      refreshStudent();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };

  // Grade Assignment / Request Resubmission
  const handleGradeAssignment = async (e: React.FormEvent, isResubmit = false) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setGradingLoading(true);
    try {
      const res = await fetch("/api/trainer/assignments/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingSubmission.id,
          marksAwarded: isResubmit ? 0 : Number(gradeMarks),
          feedbackText: isResubmit ? `[RESUBMISSION REQUESTED]: ${gradeFeedback}` : gradeFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to evaluate assignment");

      showToast("success", isResubmit ? "Resubmission requested!" : "Assignment evaluated successfully!");
      setGradingSubmission(null);
      refreshStudent();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to evaluate assignment");
    } finally {
      setGradingLoading(false);
    }
  };

  // Computed Stats
  const mainProg = student.courseProgresses[0];
  const overallProgressPct = mainProg ? mainProg.progressPercent : 0;

  const totalAtt = student.attendances.length;
  const presentAtt = student.attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendancePct = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0;

  const quizAvg =
    student.quizAttempts.length > 0
      ? student.quizAttempts.reduce((acc, q) => acc + q.score, 0) / student.quizAttempts.length
      : 0;

  const evaluatedSubs = student.assignmentSubmissions.filter((sub) => sub.feedback);
  const assignmentAvg =
    evaluatedSubs.length > 0
      ? evaluatedSubs.reduce(
          (acc, sub) =>
            acc + ((sub.feedback?.marksAwarded || 0) / (sub.assignment.totalMarks || 100)) * 100,
          0
        ) / evaluatedSubs.length
      : 0;

  const lastAccessedLesson = student.lessonProgresses[0];

  // Resolve All Associated Batches
  const allBatches = Array.from(
    new Map(
      [
        ...(student.studentBatches || []).map((sb) => [sb.batch.id, sb.batch]),
        ...student.enrollments.map((e) => [e.batch?.id, e.batch]).filter(([id]) => Boolean(id)),
      ].filter(([id, b]) => Boolean(b)) as [string, { id: string; name: string }][]
    ).values()
  );

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <Link
          href="/trainer/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Students Directory
        </Link>

        <div className="flex items-center gap-2">
          {student.enrollments[0]?.course && (
            <Link
              href={`/trainer/courses/${student.enrollments[0].course.id}`}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#7C248C]" /> Course Studio
            </Link>
          )}
          {allBatches[0] && (
            <Link
              href={`/trainer/batches/${allBatches[0].id}`}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-600" /> Batch Cockpit
            </Link>
          )}
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Faculty Scope
          </span>
        </div>
      </div>

      {/* Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          {student.profile?.avatarUrl ? (
            <img
              src={student.profile.avatarUrl}
              alt={student.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#1E2B88] to-[#7C248C] text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-sm">
              {student.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Learner Cockpit
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  student.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {student.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                Student ID: {student.id.slice(-6)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate tracking-tight">
              {student.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="flex items-center gap-1 text-slate-700">
                <Mail className="w-3 h-3 text-slate-400" /> {student.email}
              </span>
              {student.profile?.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Phone className="w-3 h-3 text-slate-400" /> {student.profile.phone}
                  </span>
                </>
              )}
              <span>•</span>
              <span>
                Joined: {new Date(student.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => setActiveTab("notes")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#7C248C] hover:bg-[#681e76] text-white font-bold text-xs shadow-md shadow-purple-900/15 flex items-center justify-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4" /> Add Faculty Note
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E2B88]" /> Curriculum Progress
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{overallProgressPct.toFixed(1)}%</span>
            <span className="text-[11px] font-mono text-slate-400">Completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Verified Attendance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{attendancePct.toFixed(1)}%</span>
            <span className="text-[11px] font-mono text-slate-400">Rate</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#7C248C]" /> Quiz Average
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{quizAvg.toFixed(1)}%</span>
            <span className="text-[11px] font-mono text-slate-400">Score</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#E01E6A]" /> Assignment Average
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#E01E6A]">{assignmentAvg.toFixed(1)}%</span>
            <span className="text-[11px] font-mono text-slate-400">Marks</span>
          </div>
        </div>
      </div>

      {/* 7 Section Modern Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-[#1E2B88] text-[#1E2B88] bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#1E2B88]" /> Overview
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "progress"
              ? "border-cyan-600 text-cyan-800 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-600" /> Learning Stream ({student.lessonProgresses.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#7C248C]" /> Quizzes ({student.quizAttempts.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-rose-600 text-rose-800 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4 text-rose-600" /> Assignments ({student.assignmentSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" /> Attendance ({student.attendances.length})
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "certificates"
              ? "border-amber-600 text-amber-800 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" /> Certificates ({student.certificates.length})
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "notes"
              ? "border-purple-600 text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#7C248C]" /> Private Notes ({student.studentNotes.length})
        </button>
      </div>

      {/* ---------------- TAB 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1E2B88]" /> Academic Overview & Enrollments
            </h2>
            <span className="text-xs font-mono text-slate-400">
              User ID: {student.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            {/* Enrolled Courses */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                Assigned Programs & Cohorts
              </div>
              <div className="space-y-2.5 pt-1">
                {student.enrollments.map((en) => (
                  <div key={en.id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                      <span>{en.course.title}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-[#7C248C] border border-purple-200">
                        {en.course.level}
                      </span>
                    </div>
                    <div className="text-xs text-cyan-700 font-semibold font-mono">
                      Cohort Batch: {en.batch?.name || "Unassigned"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Enrolled: {new Date(en.enrolledAt).toLocaleDateString()} • Status: {en.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Performance Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                Academic Performance Snapshot
              </div>
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                  <span className="text-slate-600">Curriculum Progress:</span>
                  <strong className="text-slate-900 font-bold">{overallProgressPct.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                  <span className="text-slate-600">Class Attendance Rate:</span>
                  <strong className="text-emerald-700 font-bold">{attendancePct.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                  <span className="text-slate-600">Average Quiz Score:</span>
                  <strong className="text-[#7C248C] font-bold">{quizAvg.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                  <span className="text-slate-600">Assignment Evaluation Average:</span>
                  <strong className="text-[#E01E6A] font-bold">{assignmentAvg.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: LEARNING PROGRESS ---------------- */}
      {activeTab === "progress" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" /> Curriculum & Lesson Completion Breakdown
            </h2>

            {student.courseProgresses.map((cp) => (
              <div key={cp.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 text-sm">{cp.course.title}</span>
                  <span className="text-[#7C248C] font-bold font-mono">
                    {cp.completedLessonsCount} / {cp.totalLessonsCount} Lessons ({cp.progressPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#1E2B88] to-[#7C248C] h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(cp.progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {lastAccessedLesson && (
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-xs space-y-1 font-mono">
                <div className="text-[#7C248C] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Last Activity Record:
                </div>
                <div className="text-slate-900">
                  Lesson: <strong>{lastAccessedLesson.lesson.title}</strong> (Module: {lastAccessedLesson.lesson.module.title})
                </div>
                <div className="text-[10px] text-slate-500">
                  Watched on: {new Date(lastAccessedLesson.lastWatchedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Lesson Activity Stream</h3>
            {student.lessonProgresses.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {student.lessonProgresses.map((lp) => (
                  <div
                    key={lp.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{lp.lesson.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Module: {lp.lesson.module.title} • Type: {lp.lesson.contentType}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(lp.lastWatchedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">No lesson activity recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#7C248C]" /> Quiz Attempts & Scores
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
              Avg Score: {quizAvg.toFixed(1)}%
            </span>
          </div>

          {student.quizAttempts.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase">
                  <tr>
                    <th className="p-3.5">Quiz Title</th>
                    <th className="p-3.5">Attempt Date</th>
                    <th className="p-3.5">Score (%)</th>
                    <th className="p-3.5">Passing Score</th>
                    <th className="p-3.5 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {student.quizAttempts.map((qa) => (
                    <tr key={qa.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900">{qa.quiz.title}</td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(qa.startedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900">{qa.score.toFixed(1)}%</td>
                      <td className="p-3.5 font-mono text-slate-500">{qa.quiz.passingMarks}%</td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                            qa.isPassed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {qa.isPassed ? "PASSED" : "FAILED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">No quiz attempts submitted yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-rose-600" /> Assignment Submissions & Grading
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Avg Marks: {assignmentAvg.toFixed(1)}%
            </span>
          </div>

          {student.assignmentSubmissions.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase">
                  <tr>
                    <th className="p-3.5">Assignment</th>
                    <th className="p-3.5">Submitted File</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Marks & Feedback</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {student.assignmentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900">{sub.assignment.title}</td>
                      <td className="p-3.5 font-mono">
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#7C248C] font-bold hover:underline flex items-center gap-1"
                        >
                          {sub.fileName} <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {sub.feedback ? (
                          <div className="text-emerald-700 font-bold">
                            {sub.feedback.marksAwarded} / {sub.assignment.totalMarks} Marks
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending Evaluation</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeMarks(
                              sub.feedback ? sub.feedback.marksAwarded : sub.assignment.totalMarks
                            );
                            setGradeFeedback(sub.feedback ? sub.feedback.feedbackText : "");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No assignment submissions received for this student yet.
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: ATTENDANCE ---------------- */}
      {activeTab === "attendance" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" /> Class Attendance Record
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Overall Rate: {attendancePct.toFixed(1)}%
            </span>
          </div>

          {student.attendances.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase">
                  <tr>
                    <th className="p-3.5">Live Class Title</th>
                    <th className="p-3.5">Cohort Batch</th>
                    <th className="p-3.5">Scheduled Date</th>
                    <th className="p-3.5 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {student.attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900">{att.liveClass.title}</td>
                      <td className="p-3.5 font-mono text-cyan-700 font-bold">
                        {att.liveClass.batch.name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(att.liveClass.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                            att.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : att.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No attendance records logged for this student yet.
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: CERTIFICATES ---------------- */}
      {activeTab === "certificates" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" /> Issued Academic Certificates (View-Only)
          </h2>

          {student.certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-amber-800 font-bold">
                      {cert.certificateNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{cert.course.title}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Official JVM Institute Academic Completion Certificate
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No course completion certificates issued yet.
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 7: PRIVATE TRAINER NOTES ---------------- */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* Add Note Form */}
          <form
            onSubmit={handleAddNote}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#7C248C]" /> Add Private Faculty Academic Note
              </h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 font-bold">
                Confidential Faculty Scope
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Private notes are visible ONLY to assigned trainers and institution Admins. Students cannot view these notes.
            </p>

            <textarea
              rows={3}
              required
              placeholder="Record academic observations, 1-on-1 feedback notes, attendance remarks, or growth areas..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNote}
                className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 transition"
              >
                {submittingNote ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}{" "}
                Save Note
              </button>
            </div>
          </form>

          {/* Notes History */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Faculty Notes History ({student.studentNotes.length})
            </h3>

            {student.studentNotes.length > 0 ? (
              <div className="space-y-3">
                {student.studentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-900 font-bold">{note.trainer.name}</strong>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No private notes logged for this student yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Evaluation Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Evaluate Assignment: {gradingSubmission.assignment.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Student: {student.name}</p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Marks Awarded (Max: {gradingSubmission.assignment.totalMarks}) *
                </label>
                <input
                  type="number"
                  required
                  max={gradingSubmission.assignment.totalMarks}
                  min={0}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feedback & Recommendations *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide constructive feedback for the student..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => handleGradeAssignment(e, true)}
                disabled={gradingLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition border border-amber-200"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> Request Resubmission
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleGradeAssignment(e, false)}
                  disabled={gradingLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  {gradingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
