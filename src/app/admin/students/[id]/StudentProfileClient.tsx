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
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  RotateCcw,
  X,
  Sparkles,
  Calendar,
  Layers,
  Check,
  Mail,
  Phone,
  Video,
  BarChart3,
  TrendingUp,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Globe,
  Link2,
  MessageSquare,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  lastLoginAt?: string | null;
  profile?: {
    phone?: string | null;
    avatarUrl?: string | null;
    designation?: string | null;
    bio?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    websiteUrl?: string | null;
  } | null;
  enrollments: {
    id: string;
    enrolledAt: string;
    status: string;
    course: { id: string; title: string; level: string; durationHours: number; description?: string };
    batch?: { id: string; name: string; startDate: string; endDate: string; status?: string } | null;
  }[];
  studentBatches?: {
    id: string;
    batch: { id: string; name: string; startDate: string; endDate: string; course?: { title: string } };
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
    quiz: { id: string; title: string; passingMarks: number; timeLimitMinutes: number; course?: { title: string } };
  }[];
  assignmentSubmissions: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    status: string;
    submittedAt: string;
    assignment: { id: string; title: string; totalMarks: number; deadline?: string; course?: { title: string } };
    feedback?: { marksAwarded: number; feedbackText: string; trainer?: { name: string } } | null;
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

interface CourseOption {
  id: string;
  title: string;
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
}

export default function StudentProfileClient({
  student: initialStudent,
  courses = [],
  batches = [],
}: {
  student: StudentDetailData;
  courses?: CourseOption[];
  batches?: BatchOption[];
}) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetailData>(initialStudent);
  const [activeTab, setActiveTab] = useState<
    "overview" | "progress" | "quizzes" | "assignments" | "attendance" | "certificates" | "notes"
  >("overview");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: student.name,
    email: student.email,
    password: "",
    phone: student.profile?.phone || "",
    avatarUrl: student.profile?.avatarUrl || "",
    isActive: student.isActive,
    courseId: student.enrollments[0]?.course.id || "",
    batchId: student.enrollments[0]?.batch?.id || "",
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Account Active Status
  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const nextStatus = !student.isActive;
      const res = await fetch(`/api/admin/students/${student.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update account status");
      }

      setStudent((prev) => ({ ...prev, isActive: nextStatus }));
      setEditFormData((prev) => ({ ...prev, isActive: nextStatus }));
      showToast("success", `Account ${nextStatus ? "activated" : "deactivated"} successfully!`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to toggle account status");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        avatarUrl: editFormData.avatarUrl,
        isActive: editFormData.isActive,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      if (editFormData.courseId) {
        payload.courseId = editFormData.courseId;
        payload.batchId = editFormData.batchId || null;
      }

      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update student profile");
      }

      setStudent((prev) => ({
        ...prev,
        name: editFormData.name,
        email: editFormData.email,
        isActive: editFormData.isActive,
        profile: {
          ...prev.profile,
          phone: editFormData.phone,
          avatarUrl: editFormData.avatarUrl,
        },
      }));

      showToast("success", "Student profile updated successfully!");
      setIsEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update student profile");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Student (Cascades and redirects)
  const handleDeleteStudent = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete student account");
      }

      showToast("success", "Student account and all linked data purged successfully.");
      setTimeout(() => {
        router.push("/admin/students");
      }, 1000);
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete student account");
      setActionLoading(false);
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

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Breadcrumb & Admin Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-purple-50 hover:border-purple-200 transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Students
          </Link>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Student Profile Cockpit</h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Comprehensive Academic Dossier & Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Toggle Button */}
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              student.isActive
                ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : student.isActive ? (
              <UserX className="w-3.5 h-3.5" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>{student.isActive ? "Deactivate Account" : "Activate Account"}</span>
          </button>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 text-[#7C248C] border border-purple-200 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Details
          </button>

          {/* Delete Account Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Student
          </button>
        </div>
      </div>

      {/* Main Cockpit Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/15 to-pink-500/15 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          {student.profile?.avatarUrl ? (
            <img
              src={student.profile.avatarUrl}
              alt={student.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl jvm-gradient-bg text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md">
              {student.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Student Cockpit
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  student.isActive
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {student.isActive ? "ACTIVE" : "DEACTIVATED"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                ID: {student.id.slice(-6)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate tracking-tight">
              {student.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
              </span>
              {student.profile?.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.profile.phone}
                  </span>
                </>
              )}
              <span>•</span>
              <span>
                Registered: {formatDate(student.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 text-right relative z-10">
          <div className="text-[11px] font-mono text-slate-400">Governance Role</div>
          <div className="px-3 py-1 rounded-xl bg-purple-100 text-[#7C248C] font-mono font-bold text-xs border border-purple-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Full Learner Scope
          </div>
          {student.lastLoginAt && (
            <div className="text-[10px] font-mono text-slate-500">
              Last Login: {formatDate(student.lastLoginAt, { includeTime: true })}
            </div>
          )}
        </div>
      </div>

      {/* 4 High-Impact KPI Stat Badges */}
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-[#1E2B88] text-[#1E2B88] bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#1E2B88]" /> Overview
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "progress"
              ? "border-cyan-600 text-cyan-800 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-600" /> Learning Stream ({student.lessonProgresses.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#7C248C]" /> Quizzes ({student.quizAttempts.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "assignments"
              ? "border-rose-600 text-rose-800 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4 text-rose-600" /> Assignments ({student.assignmentSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "attendance"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" /> Attendance ({student.attendances.length})
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "certificates"
              ? "border-amber-600 text-amber-800 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" /> Certificates ({student.certificates.length})
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "notes"
              ? "border-purple-600 text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#7C248C]" /> Faculty Notes ({student.studentNotes.length})
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
              System UID: {student.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            {/* Enrolled Programs & Batches */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                Assigned Programs & Cohorts
              </div>
              <div className="space-y-2.5 pt-1">
                {student.enrollments.length > 0 ? (
                  student.enrollments.map((en) => (
                    <div key={en.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                      <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                        <span>{en.course.title}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-[#7C248C] border border-purple-200">
                          {en.course.level}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-700 font-semibold font-mono">
                        Cohort Batch: {en.batch?.name || "Open Enrollment (No Batch)"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                        <span>Enrolled: {formatDate(en.enrolledAt)}</span>
                        <span className="font-bold text-slate-600 uppercase">Status: {en.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                    No enrolled courses yet.
                  </div>
                )}
              </div>
            </div>

            {/* Profile Bio & Social Details */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                Learner Profile & Socials
              </div>
              <div className="space-y-3 pt-1 text-xs">
                {student.profile?.bio && (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Biography</span>
                    {student.profile.bio}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                    <span className="text-slate-600">Account Role:</span>
                    <strong className="text-slate-900 font-bold">{student.role}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                    <span className="text-slate-600">Designation:</span>
                    <strong className="text-slate-900 font-bold">{student.profile?.designation || "Student"}</strong>
                  </div>

                  {student.profile?.githubUrl && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                      <span className="text-slate-600 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> GitHub:</span>
                      <a href={student.profile.githubUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline truncate max-w-[200px]">
                        {student.profile.githubUrl}
                      </a>
                    </div>
                  )}

                  {student.profile?.linkedinUrl && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60 font-mono">
                      <span className="text-slate-600 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> LinkedIn:</span>
                      <a href={student.profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline truncate max-w-[200px]">
                        {student.profile.linkedinUrl}
                      </a>
                    </div>
                  )}
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

            {student.courseProgresses.length > 0 ? (
              student.courseProgresses.map((cp) => (
                <div key={cp.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900 text-sm">{cp.course.title}</span>
                    <span className="text-[#7C248C] font-bold font-mono">
                      {cp.completedLessonsCount} / {cp.totalLessonsCount} Lessons ({cp.progressPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#1E2B88] to-[#7C248C] h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(cp.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No course progress logged yet.
              </div>
            )}

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
                      {formatDate(lp.lastWatchedAt)}
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
              <HelpCircle className="w-5 h-5 text-[#7C248C]" /> Quiz Attempts & Performance
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
                        {formatDate(qa.startedAt)}
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

      {/* ---------------- TAB 4: ASSIGNMENTS (View-Only for Admin) ---------------- */}
      {activeTab === "assignments" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-rose-600" /> Assignment Submissions & Trainer Feedback
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                View-only academic submissions and faculty evaluations
              </p>
            </div>
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
                    <th className="p-3.5">Submission Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Marks Awarded</th>
                    <th className="p-3.5">Trainer Feedback</th>
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
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {sub.feedback ? (
                          <span className="text-emerald-700 font-bold">
                            {sub.feedback.marksAwarded} / {sub.assignment.totalMarks} Marks
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Pending Evaluation</span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs text-slate-600">
                        {sub.feedback ? (
                          <div>
                            <p className="italic text-slate-700">&ldquo;{sub.feedback.feedbackText}&rdquo;</p>
                            {sub.feedback.trainer && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                — By {sub.feedback.trainer.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
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
                        {formatDate(att.liveClass.scheduledDate)}
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
            <Award className="w-5 h-5 text-amber-600" /> Issued Academic Certificates
          </h2>

          {student.certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2 shadow-2xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-amber-800 font-bold">
                      {cert.certificateNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Issued: {formatDate(cert.issueDate)}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{cert.course.title}</div>
                  <div className="pt-2">
                    <Link
                      href={`/verify?code=${cert.certificateNumber}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Public Verification
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No certificates have been issued to this student yet.
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 7: NOTES (View-Only for Admin) ---------------- */}
      {activeTab === "notes" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#7C248C]" /> Faculty & Trainer Academic Notes
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Academic observations, remarks, and performance logs entered by assigned trainers
            </p>
          </div>

          {student.studentNotes.length > 0 ? (
            <div className="space-y-3 pt-2">
              {student.studentNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="font-bold text-purple-700">
                      Faculty: {note.trainer.name} ({note.trainer.email})
                    </span>
                    <span className="text-slate-400">
                      {formatDate(note.createdAt, { includeTime: true })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No faculty notes recorded for this student yet.
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#7C248C]" /> Edit Student Profile
                </h3>
                <p className="text-xs text-slate-500">Update credentials, batch enrollment, and status</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Avatar Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editFormData.avatarUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Course & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Course Program</label>
                  <select
                    value={editFormData.courseId}
                    onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value, batchId: "" })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Batch Cohort</label>
                  <select
                    value={editFormData.batchId}
                    onChange={(e) => setEditFormData({ ...editFormData, batchId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="">No Batch Assigned</option>
                    {batches
                      .filter((b) => !editFormData.courseId || b.courseId === editFormData.courseId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                <div>
                  <div className="font-bold text-slate-900">Student Account Status</div>
                  <div className="text-[10px] text-slate-500">Control student portal login and access</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, isActive: !editFormData.isActive })}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-[10px] font-mono transition border cursor-pointer ${
                    editFormData.isActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-rose-100 text-rose-800 border-rose-200"
                  }`}
                >
                  {editFormData.isActive ? "ACTIVE" : "DEACTIVATED"}
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Student Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl border border-rose-200 bg-white space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Account?</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible cascade purge</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">{student.name}</strong> ({student.email})?
              All enrolled course progress, quizzes, submissions, attendances, and certificates linked to this student will be completely erased.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
