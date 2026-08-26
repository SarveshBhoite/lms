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

      showToast("success", "Private academic note added!");
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

      showToast("success", isResubmit ? "Resubmission requested!" : "Assignment graded successfully!");
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
  const presentAtt = student.attendances.filter((a) => a.status === "PRESENT").length;
  const attendancePct = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0;

  const quizAvg =
    student.quizAttempts.length > 0
      ? student.quizAttempts.reduce((acc, q) => acc + q.score, 0) / student.quizAttempts.length
      : 0;

  const evaluatedSubs = student.assignmentSubmissions.filter((sub) => sub.feedback);
  const assignmentAvg =
    evaluatedSubs.length > 0
      ? evaluatedSubs.reduce(
          (acc, sub) => acc + ((sub.feedback?.marksAwarded || 0) / (sub.assignment.totalMarks || 100)) * 100,
          0
        ) / evaluatedSubs.length
      : 0;

  const lastAccessedLesson = student.lessonProgresses[0];

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
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Students Directory
        </Link>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-600" /> Account Controls Admin-Only
        </span>
      </div>

      {/* Student Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-2xl flex items-center justify-center">
            {student.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{student.name}</h1>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {student.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{student.email} {student.profile?.phone ? `• ${student.profile.phone}` : ""}</p>
            <div className="text-[11px] text-slate-400 font-mono">
              Enrolled: {student.enrollments[0] ? new Date(student.enrollments[0].enrolledAt).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </div>

        {/* Overview Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs w-full md:w-auto">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">PROGRESS</span>
            <strong className="text-amber-700 font-bold text-base">{overallProgressPct.toFixed(1)}%</strong>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">ATTENDANCE</span>
            <strong className="text-emerald-700 font-bold text-base">{attendancePct.toFixed(1)}%</strong>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">QUIZ AVG</span>
            <strong className="text-purple-700 font-bold text-base">{quizAvg.toFixed(1)}%</strong>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">ASSIGNMENT AVG</span>
            <strong className="text-rose-700 font-bold text-base">{assignmentAvg.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* 7 Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "progress"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" /> Learning Progress
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({student.quizAttempts.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Assignments ({student.assignmentSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Attendance ({student.attendances.length})
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "certificates"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4" /> Certificates ({student.certificates.length})
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "notes"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Private Trainer Notes ({student.studentNotes.length})
        </button>
      </div>

      {/* ---------------- TAB 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Student Academic Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 font-mono">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-slate-500">ENROLLED COURSES & BATCHES</div>
              <div className="space-y-2 pt-1">
                {student.enrollments.map((en) => (
                  <div key={en.id} className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="font-bold text-slate-900">{en.course.title} ({en.course.level})</div>
                    <div className="text-[11px] text-cyan-700">Batch: {en.batch?.name || "Unassigned"}</div>
                    <div className="text-[10px] text-slate-400">Enrolled Date: {new Date(en.enrolledAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-slate-500">ACADEMIC PERFORMANCE SUMMARY</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Overall Curriculum Progress:</span>
                  <strong className="text-amber-700 font-bold">{overallProgressPct.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Attendance Rate:</span>
                  <strong className="text-emerald-700 font-bold">{attendancePct.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Quiz Average Score:</span>
                  <strong className="text-purple-700 font-bold">{quizAvg.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Assignment Average Score:</span>
                  <strong className="text-rose-700 font-bold">{assignmentAvg.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: LEARNING PROGRESS ---------------- */}
      {activeTab === "progress" && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Curriculum & Lesson Completion Breakdown</h2>

            {student.courseProgresses.map((cp) => (
              <div key={cp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{cp.course.title}</span>
                  <span className="text-amber-700 font-bold font-mono">
                    {cp.completedLessonsCount} / {cp.totalLessonsCount} Lessons ({cp.progressPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(cp.progressPercent, 100)}%` }}></div>
                </div>
              </div>
            ))}

            {lastAccessedLesson && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1 font-mono">
                <div className="text-amber-900 font-bold">Last Activity Log:</div>
                <div className="text-slate-800">
                  Lesson: <strong>{lastAccessedLesson.lesson.title}</strong> ({lastAccessedLesson.lesson.module.title})
                </div>
                <div className="text-[10px] text-slate-500">
                  Watched on: {new Date(lastAccessedLesson.lastWatchedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lesson Activity Stream</h3>
            {student.lessonProgresses.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {student.lessonProgresses.map((lp) => (
                  <div key={lp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{lp.lesson.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Module: {lp.lesson.module.title} • {lp.lesson.contentType}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(lp.lastWatchedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">No lesson activity recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Quiz Attempts & Scores</h2>

          {student.quizAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                  <tr>
                    <th className="p-4">Quiz Title</th>
                    <th className="p-4">Attempt Date</th>
                    <th className="p-4">Score (%)</th>
                    <th className="p-4">Passing Score</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {student.quizAttempts.map((qa) => (
                    <tr key={qa.id}>
                      <td className="p-4 font-bold text-slate-900">{qa.quiz.title}</td>
                      <td className="p-4 font-mono text-slate-500">{new Date(qa.startedAt).toLocaleDateString()}</td>
                      <td className="p-4 font-bold font-mono text-slate-900">{qa.score.toFixed(1)}%</td>
                      <td className="p-4 font-mono text-slate-500">{qa.quiz.passingMarks}%</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          qa.isPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {qa.isPassed ? "PASSED" : "FAILED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No quiz attempts submitted yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Assignment Submissions & Grading</h2>

          {student.assignmentSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                  <tr>
                    <th className="p-4">Assignment</th>
                    <th className="p-4">Submitted File</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Marks & Feedback</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {student.assignmentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">{sub.assignment.title}</td>
                      <td className="p-4 font-mono">
                        <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-amber-700 font-bold hover:underline flex items-center gap-1">
                          {sub.fileName} <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono">
                        {sub.feedback ? (
                          <div className="text-emerald-700 font-bold">
                            {sub.feedback.marksAwarded} / {sub.assignment.totalMarks} Marks
                          </div>
                        ) : (
                          <span className="text-slate-400">Not graded</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeMarks(sub.feedback ? sub.feedback.marksAwarded : sub.assignment.totalMarks);
                            setGradeFeedback(sub.feedback ? sub.feedback.feedbackText : "");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
                        >
                          Grade / Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No assignment submissions received yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: ATTENDANCE ---------------- */}
      {activeTab === "attendance" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Class Attendance History</h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Overall Rate: {attendancePct.toFixed(1)}%
            </span>
          </div>

          {student.attendances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                  <tr>
                    <th className="p-4">Live Class Title</th>
                    <th className="p-4">Cohort Batch</th>
                    <th className="p-4">Scheduled Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {student.attendances.map((att) => (
                    <tr key={att.id}>
                      <td className="p-4 font-bold text-slate-900">{att.liveClass.title}</td>
                      <td className="p-4 font-mono text-cyan-700 font-bold">{att.liveClass.batch.name}</td>
                      <td className="p-4 font-mono text-slate-500">{new Date(att.liveClass.scheduledDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          att.status === "PRESENT" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No attendance records logged for this student.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: CERTIFICATES ---------------- */}
      {activeTab === "certificates" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Issued Course Certificates (View-Only)</h2>

          {student.certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.certificates.map((cert) => (
                <div key={cert.id} className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-amber-800 font-bold">{cert.certificateNumber}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{cert.course.title}</h3>
                  <div className="text-[11px] text-slate-500">Official Institution Academic Certificate</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No course completion certificates issued yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 7: PRIVATE TRAINER NOTES ---------------- */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" /> Add Private Academic Note
            </h2>
            <p className="text-xs text-slate-500">
              Private notes are visible ONLY to authorized trainers and institution Admins. Students cannot view these notes.
            </p>

            <textarea
              rows={3}
              required
              placeholder="Record academic observations, Q&A progress, attendance remarks, or performance notes..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 shadow-xs"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNote}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition"
              >
                {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Save Note
              </button>
            </div>
          </form>

          {/* Notes History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Faculty Notes History ({student.studentNotes.length})</h3>

            {student.studentNotes.length > 0 ? (
              <div className="space-y-3">
                {student.studentNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-900 font-bold">{note.trainer.name}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">No private notes logged for this student yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Evaluation / Resubmission Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Evaluate Assignment: {gradingSubmission.assignment.title}</h3>
              <button onClick={() => setGradingSubmission(null)} className="text-slate-400 hover:text-slate-700">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feedback & Comments *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed feedback for the student..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={(e) => handleGradeAssignment(e, true)}
                disabled={gradingLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> Request Resubmission
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleGradeAssignment(e, false)}
                  disabled={gradingLoading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
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
