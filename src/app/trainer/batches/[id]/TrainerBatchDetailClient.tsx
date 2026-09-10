"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Users,
  Video,
  Clock,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CheckSquare,
  ExternalLink,
  UserCheck,
  UserX,
  FileCheck,
  HelpCircle,
  Award,
  Lock,
  ChevronDown,
  Sparkles,
  Layers,
  Search,
  Check,
  GraduationCap,
  PlayCircle,
  FileText,
  Filter,
  BarChart3,
  CalendarCheck,
} from "lucide-react";

interface StudentUser {
  id: string;
  name: string;
  email: string;
  profile?: { phone?: string | null; avatarUrl?: string | null; designation?: string | null } | null;
}

interface AttendanceRecord {
  id: string;
  liveClassId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  joinClickTime?: string | null;
  excuseReason?: string | null;
  isApproved?: boolean;
  user: { id: string; name: string; email: string };
}

interface LiveClassItem {
  id: string;
  batchId: string;
  trainerId: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  meetUrl: string;
  recordingUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  trainer: { id: string; name: string; email: string };
  attendances: AttendanceRecord[];
}

interface BatchStudentItem {
  id: string;
  userId: string;
  joinedAt: string;
  user: StudentUser;
}

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  status: string;
  questions: { id: string }[];
  quizAttempts: { id: string; userId: string; score: number; isPassed: boolean }[];
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  totalMarks: number;
  submissions: {
    id: string;
    userId: string;
    status: string;
    submittedAt: string;
    user: { id: string; name: string; email: string };
    feedback?: { marksAwarded: number; feedbackText: string } | null;
  }[];
}

interface BatchDetail {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string | null;
    level: string;
    durationHours: number;
    quizzes: QuizItem[];
    assignments: AssignmentItem[];
  };
  trainers: { id: string; trainer: { id: string; name: string; email: string } }[];
  students: BatchStudentItem[];
  liveClasses: LiveClassItem[];
}

interface ModalStudent {
  id: string;
  name: string;
  email: string;
  isLocked: boolean;
  lockedBatchName?: string | null;
  lockedTrainerName?: string | null;
  isCurrentBatchMember: boolean;
}

export default function TrainerBatchDetailClient({
  initialBatch,
  availableStudents: initialAvailable,
  currentUserId,
}: {
  initialBatch: BatchDetail;
  availableStudents: StudentUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchDetail>(initialBatch);
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "live-classes" | "attendance" | "quizzes" | "assignments"
  >("live-classes");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Student Roster Modal State
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [modalStudents, setModalStudents] = useState<ModalStudent[]>([]);
  const [loadingModalStudents, setLoadingModalStudents] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialBatch.students.map((s) => s.userId)
  );

  // Live Class Modal State
  const [isLiveClassModalOpen, setIsLiveClassModalOpen] = useState(false);
  const [editingLiveClass, setEditingLiveClass] = useState<LiveClassItem | null>(null);
  const [deletingLiveClass, setDeletingLiveClass] = useState<LiveClassItem | null>(null);
  const [liveClassForm, setLiveClassForm] = useState({
    title: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
    meetUrl: "",
    recordingUrl: "",
    description: "",
    status: "SCHEDULED" as "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED",
  });

  // Attendance Session Inspection State (expanded dropdown per session)
  const [expandedAttendanceClassId, setExpandedAttendanceClassId] = useState<string | null>(
    initialBatch.liveClasses[0]?.id || null
  );

  // Inline attendance updating
  const [updatingAttendanceKey, setUpdatingAttendanceKey] = useState<string | null>(null);
  const [approvingAllLiveClassId, setApprovingAllLiveClassId] = useState<string | null>(null);

  // Search filter for students tab
  const [studentSearch, setStudentSearch] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshBatch = async () => {
    try {
      const res = await fetch(`/api/trainer/batches/${batch.id}`);
      const data = await res.json();
      if (data.success) {
        setBatch(data.data);
        if (!expandedAttendanceClassId && data.data.liveClasses.length > 0) {
          setExpandedAttendanceClassId(data.data.liveClasses[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to refresh batch:", err);
    }
  };

  const openStudentRosterModal = () => {
    setIsStudentsModalOpen(true);
    setLoadingModalStudents(true);
    setRosterSearch("");
    setSelectedStudentIds(batch.students.map((s) => s.userId));

    fetch(`/api/trainer/courses/${batch.courseId}/eligible-students?currentBatchId=${batch.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setModalStudents(data.data || []);
        }
      })
      .finally(() => setLoadingModalStudents(false));
  };

  const handleSaveStudents = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/batches/${batch.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update roster");

      showToast("success", "Batch student roster updated successfully!");
      setIsStudentsModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save student roster");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLiveClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const startDateTime = new Date(`${liveClassForm.scheduledDate}T${liveClassForm.startTime}:00`);
      const endDateTime = new Date(`${liveClassForm.scheduledDate}T${liveClassForm.endTime}:00`);

      const payload = {
        batchId: batch.id,
        title: liveClassForm.title,
        scheduledDate: new Date(liveClassForm.scheduledDate).toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        meetUrl: liveClassForm.meetUrl,
        recordingUrl: liveClassForm.recordingUrl || null,
        description: liveClassForm.description || null,
        status: liveClassForm.status,
      };

      const url = editingLiveClass
        ? `/api/trainer/live-classes/${editingLiveClass.id}`
        : `/api/trainer/live-classes`;
      const method = editingLiveClass ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save live class");

      showToast(
        "success",
        editingLiveClass ? "Live class updated!" : `Live class "${liveClassForm.title}" scheduled!`
      );

      setIsLiveClassModalOpen(false);
      setEditingLiveClass(null);
      resetLiveClassForm();
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save live class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLiveClass = async () => {
    if (!deletingLiveClass) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/live-classes/${deletingLiveClass.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete live class");

      showToast("success", "Live class deleted.");
      setDeletingLiveClass(null);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete live class");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditLiveClassModal = (lc: LiveClassItem) => {
    setEditingLiveClass(lc);
    const dateStr = new Date(lc.scheduledDate).toISOString().split("T")[0];
    const startStr = new Date(lc.startTime).toTimeString().substring(0, 5);
    const endStr = new Date(lc.endTime).toTimeString().substring(0, 5);

    setLiveClassForm({
      title: lc.title,
      scheduledDate: dateStr,
      startTime: startStr,
      endTime: endStr,
      meetUrl: lc.meetUrl,
      recordingUrl: lc.recordingUrl || "",
      description: lc.description || "",
      status: lc.status,
    });
    setIsLiveClassModalOpen(true);
  };

  const resetLiveClassForm = () => {
    setLiveClassForm({
      title: "",
      scheduledDate: new Date().toISOString().split("T")[0],
      startTime: "10:00",
      endTime: "11:30",
      meetUrl: "",
      recordingUrl: "",
      description: "",
      status: "SCHEDULED",
    });
  };

  // Instant Attendance Update (Inline)
  const handleUpdateStudentAttendance = async (
    liveClassId: string,
    userId: string,
    newStatus: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT"
  ) => {
    const key = `${liveClassId}_${userId}`;
    setUpdatingAttendanceKey(key);
    try {
      const res = await fetch(`/api/trainer/live-classes/${liveClassId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          updates: [{ userId, status: newStatus, isApproved: true }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update attendance");

      showToast("success", `Attendance status updated to ${newStatus}`);
      await refreshBatch();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update attendance");
    } finally {
      setUpdatingAttendanceKey(null);
    }
  };

  // Approve & Verify All for a Live Class Session
  const handleApproveAllSession = async (liveClassId: string) => {
    setApprovingAllLiveClassId(liveClassId);
    try {
      const res = await fetch(`/api/trainer/live-classes/${liveClassId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE_ALL" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to verify session");

      showToast("success", "All students verified & approved for this session!");
      await refreshBatch();
    } catch (err: any) {
      showToast("error", err.message || "Failed to verify session attendance");
    } finally {
      setApprovingAllLiveClassId(null);
    }
  };

  // Calculated Stats
  const totalEnrolled = batch.students.length;
  const totalLiveClasses = batch.liveClasses.length;
  const totalQuizzes = batch.course.quizzes?.length || 0;
  const totalAssignments = batch.course.assignments?.length || 0;

  // Compute Overall Attendance %
  let totalAttendancesLogged = 0;
  let totalPresentCount = 0;
  batch.liveClasses.forEach((lc) => {
    lc.attendances.forEach((att) => {
      totalAttendancesLogged++;
      if (att.status === "PRESENT" || att.status === "LATE") {
        totalPresentCount++;
      }
    });
  });
  const overallAttendanceRate =
    totalAttendancesLogged > 0 ? Math.round((totalPresentCount / totalAttendancesLogged) * 100) : 0;

  // Filtered Students
  const filteredStudents = batch.students.filter(
    (bs) =>
      bs.user.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      bs.user.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Modal Student filtering
  const availableModalStudents = modalStudents
    .filter((s) => !s.isLocked)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(rosterSearch.toLowerCase())
    );
  const lockedModalStudents = modalStudents
    .filter((s) => s.isLocked)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(rosterSearch.toLowerCase())
    );

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Notification */}
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

      {/* Top Breadcrumb & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <Link
          href="/trainer/batches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Batches
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/trainer/courses/${batch.courseId}`}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#7C248C]" /> Open Course Studio
          </Link>
          <button
            onClick={openStudentRosterModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1E2B88] to-[#7C248C] hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
          >
            <UserCheck className="w-3.5 h-3.5" /> Manage Roster
          </button>
        </div>
      </div>

      {/* Compact Studio Header Banner (~10% vh, matching JVM Institute studio standard) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <Layers className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Batch Cockpit
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  batch.status === "ONGOING"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : batch.status === "UPCOMING"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {batch.status}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold truncate max-w-xs">
                Course: {batch.course.title}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate tracking-tight">
              {batch.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#7C248C]" />
                {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#7C248C] font-semibold">
                <Users className="w-3.5 h-3.5" /> {totalEnrolled} Enrolled
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-700 font-semibold">
                <Video className="w-3.5 h-3.5" /> {totalLiveClasses} Live Sessions
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0 w-full sm:w-auto justify-end">
          <Link
            href={`/trainer/live-classes?batchId=${batch.id}&courseId=${batch.courseId}`}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#7C248C] hover:bg-[#681e76] text-white font-bold text-xs shadow-md shadow-purple-900/15 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Schedule Live Class
          </Link>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1E2B88]" /> Enrolled
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalEnrolled}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Attendance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{overallAttendanceRate}%</span>
            <span className="text-[11px] font-mono text-slate-400">Verified</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-cyan-600" /> Live Classes
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalLiveClasses}</span>
            <span className="text-[11px] font-mono text-slate-400">Sessions</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#7C248C]" /> Quizzes
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{totalQuizzes}</span>
            <span className="text-[11px] font-mono text-slate-400">Assessments</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-rose-600" /> Assignments
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{totalAssignments}</span>
            <span className="text-[11px] font-mono text-slate-400">Tasks</span>
          </div>
        </div>
      </div>

      {/* Modern 6 Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("live-classes")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "live-classes"
              ? "border-cyan-600 text-cyan-800 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4 text-cyan-600" /> Live Classes ({totalLiveClasses})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" /> Attendance Roster
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-[#1E2B88] text-[#1E2B88] bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-[#1E2B88]" /> Cohort Students ({totalEnrolled})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#7C248C]" /> Quizzes ({totalQuizzes})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-rose-600 text-rose-800 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4 text-rose-600" /> Assignments ({totalAssignments})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-amber-600 text-amber-800 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" /> Academic Overview
        </button>
      </div>

      {/* ---------------- TAB 1: LIVE CLASSES ---------------- */}
      {activeTab === "live-classes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-600" /> Live Interactive Video Classes
              </h2>
              <p className="text-xs text-slate-500">
                Scheduled Google Meet live classes for this batch. Enrolled students receive direct room access and automatic check-in tracking.
              </p>
            </div>

            <Link
              href={`/trainer/live-classes?batchId=${batch.id}&courseId=${batch.courseId}`}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Schedule New Class
            </Link>
          </div>

          {batch.liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {batch.liveClasses.map((lc) => {
                const isCompleted = lc.status === "COMPLETED";
                const isLive = lc.status === "LIVE";
                const verifiedAttendances = lc.attendances.filter((a) => a.isApproved).length;

                return (
                  <div
                    key={lc.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isLive
                              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                              : isCompleted
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {lc.status}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(lc.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{lc.title}</h3>
                        {lc.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {lc.description}
                          </p>
                        )}
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Session Time:
                          </span>
                          <strong className="text-slate-900">
                            {new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                            {new Date(lc.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Instructor:
                          </span>
                          <strong className="text-[#7C248C]">{lc.trainer.name}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {!isCompleted ? (
                        <a
                          href={lc.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <Video className="w-4 h-4" /> Launch Meet Room <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="w-full py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Session Concluded
                        </div>
                      )}

                      {lc.recordingUrl && (
                        <a
                          href={lc.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-slate-600" /> Watch Recorded Class
                        </a>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => {
                            setExpandedAttendanceClassId(lc.id);
                            setActiveTab("attendance");
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>
                            Attendance: <strong>{verifiedAttendances}</strong>/{lc.attendances.length} Verified
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/trainer/live-classes/${lc.id}`}
                            className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 transition"
                            title="Open Full Live Class Console"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openEditLiveClassModal(lc)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Edit Live Class"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingLiveClass(lc)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                            title="Delete Live Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Video className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No live classes scheduled for this batch</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a Google Meet live interactive class for your cohort students by clicking "Schedule New Class" above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: ATTENDANCE ---------------- */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" /> Batch Attendance Registry & Verification
              </h2>
              <p className="text-xs text-slate-500">
                Expand any live session to review check-ins, change statuses (Present, Late, Excused, Absent), or approve in 1-click.
              </p>
            </div>
          </div>

          {batch.liveClasses.length > 0 ? (
            <div className="space-y-4">
              {batch.liveClasses.map((lc) => {
                const isExpanded = expandedAttendanceClassId === lc.id;
                const verifiedCount = lc.attendances.filter((a) => a.isApproved).length;
                const totalCohort = batch.students.length || lc.attendances.length;

                return (
                  <div
                    key={lc.id}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs transition"
                  >
                    {/* Horizontal Session Header Bar */}
                    <div
                      onClick={() => setExpandedAttendanceClassId(isExpanded ? null : lc.id)}
                      className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none transition ${
                        isExpanded ? "bg-slate-50/80 border-b border-slate-200" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
                            lc.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : lc.status === "LIVE"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                              : "bg-purple-50 text-[#7C248C] border border-purple-200"
                          }`}
                        >
                          <Video className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{lc.title}</h3>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${
                                lc.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : lc.status === "LIVE"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {lc.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5 flex-wrap">
                            <span>{new Date(lc.scheduledDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>
                              {new Date(lc.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>•</span>
                            <span className="text-slate-700 font-bold">{lc.trainer.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Controls & Quick Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                          {verifiedCount}/{totalCohort} Verified
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveAllSession(lc.id);
                          }}
                          disabled={approvingAllLiveClassId === lc.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {approvingAllLiveClassId === lc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          )}
                          Approve All
                        </button>

                        <Link
                          href={`/trainer/live-classes/${lc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C248C] font-bold text-xs flex items-center gap-1.5 transition"
                          title="Open Full Live Class Console"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Class Room
                        </Link>

                        <div
                          className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Interactive Attendance Roster */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {batch.students.length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold font-mono">
                                <tr>
                                  <th className="p-3.5">Student Member</th>
                                  <th className="p-3.5">Join Click Time</th>
                                  <th className="p-3.5">Attendance Status</th>
                                  <th className="p-3.5">Verification</th>
                                  <th className="p-3.5 text-right">Quick Status Update</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                {batch.students.map((bs) => {
                                  const existingAtt = lc.attendances.find((att) => att.userId === bs.userId);
                                  const currentStatus = existingAtt?.status || "ABSENT";
                                  const isApproved = existingAtt?.isApproved || false;
                                  const updatingKey = `${lc.id}_${bs.userId}`;
                                  const isRowUpdating = updatingAttendanceKey === updatingKey;

                                  return (
                                    <tr key={bs.id} className="hover:bg-slate-50/70 transition">
                                      <td className="p-3.5">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-full bg-[#1E2B88]/10 text-[#1E2B88] font-bold text-xs flex items-center justify-center shrink-0">
                                            {bs.user.name.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="font-bold text-slate-900">{bs.user.name}</div>
                                            <div className="text-[11px] font-mono text-slate-400">{bs.user.email}</div>
                                          </div>
                                        </div>
                                      </td>

                                      <td className="p-3.5 font-mono text-xs">
                                        {existingAtt?.joinClickTime ? (
                                          <span className="text-slate-800 font-bold">
                                            {new Date(existingAtt.joinClickTime).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              second: "2-digit",
                                            })}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic">No check-in</span>
                                        )}
                                      </td>

                                      <td className="p-3.5">
                                        <span
                                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] inline-block font-mono ${
                                            currentStatus === "PRESENT"
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              : currentStatus === "LATE"
                                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                                              : currentStatus === "EXCUSED"
                                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                                              : "bg-slate-100 text-slate-500 border border-slate-200"
                                          }`}
                                        >
                                          {currentStatus}
                                        </span>
                                      </td>

                                      <td className="p-3.5">
                                        {isApproved ? (
                                          <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                            <Check className="w-3 h-3 text-emerald-600" /> Verified
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                                            ⏳ Pending
                                          </span>
                                        )}
                                      </td>

                                      {/* Quick Inline Attendance Action Dropdown/Buttons */}
                                      <td className="p-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {isRowUpdating ? (
                                            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                                            </span>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() =>
                                                  handleUpdateStudentAttendance(lc.id, bs.userId, "PRESENT")
                                                }
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
                                                  currentStatus === "PRESENT"
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                                }`}
                                              >
                                                Present
                                              </button>
                                              <button
                                                onClick={() => handleUpdateStudentAttendance(lc.id, bs.userId, "LATE")}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
                                                  currentStatus === "LATE"
                                                    ? "bg-amber-600 text-white"
                                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                                }`}
                                              >
                                                Late
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleUpdateStudentAttendance(lc.id, bs.userId, "ABSENT")
                                                }
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
                                                  currentStatus === "ABSENT"
                                                    ? "bg-rose-600 text-white"
                                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                                }`}
                                              >
                                                Absent
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No students enrolled in this batch roster.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No live classes scheduled for this batch</h3>
              <p className="text-xs text-slate-500">
                Live attendance registries will appear here once sessions are scheduled.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1E2B88]" /> Cohort Student Roster ({totalEnrolled})
              </h2>
              <p className="text-xs text-slate-500">
                All students currently enrolled in this cohort. Click on any student card to view their profile, progress, and performance.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <button
                onClick={openStudentRosterModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1E2B88] to-[#7C248C] hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition shrink-0"
              >
                <Plus className="w-4 h-4" /> Manage Roster
              </button>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((bs) => (
                <div
                  key={bs.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-purple-200 transition group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden mr-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E2B88] to-[#7C248C] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {bs.user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-900 text-sm truncate group-hover:text-[#7C248C] transition">
                        {bs.user.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">{bs.user.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Joined: {new Date(bs.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/trainer/students/${bs.userId}`}
                    className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-purple-50 group-hover:text-[#7C248C] text-slate-600 transition shrink-0 border border-slate-200/60"
                    title="View Student Profile & Submissions"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {studentSearch ? "No students matching search query" : "No students enrolled in this batch"}
              </h3>
              <p className="text-xs text-slate-500">
                Click "Manage Roster" to add students enrolled in this course to the cohort.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#7C248C]" /> Course Quizzes & Cohort Attempts
              </h2>
              <p className="text-xs text-slate-500">
                Quizzes configured for {batch.course.title}. Students enrolled in this batch can attempt published quizzes.
              </p>
            </div>

            <Link
              href={`/trainer/quizzes/create?courseId=${batch.courseId}`}
              className="px-4 py-2 rounded-xl bg-[#7C248C] hover:bg-[#681e76] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Create New Quiz
            </Link>
          </div>

          {batch.course.quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {batch.course.quizzes.map((qz) => {
                const batchStudentIds = new Set(batch.students.map((s) => s.userId));
                const cohortAttempts = qz.quizAttempts.filter((att) => batchStudentIds.has(att.userId));
                const passedAttempts = cohortAttempts.filter((att) => att.isPassed).length;

                return (
                  <div
                    key={qz.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 font-mono">
                          {qz.status}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {qz.timeLimitMinutes} mins
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{qz.title}</h3>
                      {qz.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{qz.description}</p>
                      )}

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-600">Questions: <strong>{qz.questions.length}</strong></span>
                        <span className="text-slate-600">Pass Score: <strong>{qz.passingMarks}%</strong></span>
                        <span className="text-purple-700 font-bold">
                          Cohort: {passedAttempts}/{cohortAttempts.length} Passed
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/trainer/quizzes/${qz.id}`}
                      className="block text-center w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1E2B88] to-[#7C248C] hover:opacity-95 text-white font-bold text-xs shadow-xs transition"
                    >
                      Manage Quiz & View All Attempts
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No quizzes created for this course yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create quizzes in your course studio to assess cohort knowledge.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-rose-600" /> Course Assignments & Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Track student assignment submissions, grade homework/projects, and submit academic feedback.
              </p>
            </div>

            <Link
              href={`/trainer/assignments/create?courseId=${batch.courseId}`}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> New Assignment
            </Link>
          </div>

          {batch.course.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {batch.course.assignments.map((asgn) => {
                const batchStudentIds = new Set(batch.students.map((s) => s.userId));
                const cohortSubmissions = asgn.submissions.filter((s) => batchStudentIds.has(s.userId));
                const pendingCohort = cohortSubmissions.filter((s) => s.status === "SUBMITTED").length;

                return (
                  <div
                    key={asgn.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-rose-600 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Deadline: {new Date(asgn.deadline).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{asgn.totalMarks} Total Marks</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{asgn.title}</h3>
                      {asgn.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {asgn.description}
                        </p>
                      )}

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono">
                        <span>Cohort Submitted: <strong>{cohortSubmissions.length}</strong></span>
                        <span className="text-amber-700 font-bold">Pending Review: {pendingCohort}</span>
                      </div>
                    </div>

                    <Link
                      href={`/trainer/assignments/${asgn.id}`}
                      className="block text-center w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
                    >
                      Evaluate Submissions ({cohortSubmissions.length})
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No assignments created for this course yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create assignments to test hands-on practical skills of this cohort.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" /> Batch Academic Details
            </h2>
            <Link
              href={`/trainer/courses/${batch.courseId}`}
              className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1 font-mono"
            >
              View Full Course Curriculum <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                Course Program
              </div>
              <div className="text-base font-bold text-slate-900">{batch.course.title}</div>
              <div className="text-slate-600 leading-relaxed text-xs">
                {batch.course.description || "No course description provided."}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-4 text-xs font-mono text-slate-500">
                <span>Level: <strong className="text-slate-800">{batch.course.level}</strong></span>
                <span>Duration: <strong className="text-slate-800">{batch.course.durationHours} hrs</strong></span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                Assigned Instructors
              </div>
              <div className="space-y-2">
                {batch.trainers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7C248C] font-bold flex items-center justify-center shrink-0">
                      {t.trainer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.trainer.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.trainer.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Roster Modal */}
      {isStudentsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-xl w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Batch Student Cohort Roster</h3>
                <p className="text-xs text-slate-500">
                  Select eligible students enrolled in {batch.course.title} to assign to this batch.
                </p>
              </div>
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roster Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by student name or email..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
              />
            </div>

            {loadingModalStudents ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#7C248C]" /> Loading student eligibility...
              </div>
            ) : (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {/* Available Students */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selectable Students (
                    {availableModalStudents.length})
                  </div>

                  <div className="space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                    {availableModalStudents.length > 0 ? (
                      availableModalStudents.map((s) => {
                        const isSelected = selectedStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentIds((prev) =>
                                prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                              );
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              isSelected
                                ? "bg-purple-50 border-[#7C248C]/40 text-slate-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-[#7C248C] accent-[#7C248C]"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No eligible unassigned students found.
                      </div>
                    )}
                  </div>
                </div>

                {/* Already Assigned / Locked Students */}
                {lockedModalStudents.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-600 uppercase font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Locked in Another Active Batch (
                      {lockedModalStudents.length})
                    </div>

                    <div className="space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-100/60">
                      {lockedModalStudents.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white/70 flex items-center justify-between opacity-75 cursor-not-allowed text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              disabled
                              checked={false}
                              className="w-4 h-4 rounded text-slate-400"
                            />
                            <div>
                              <div className="font-bold text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" /> {s.lockedBatchName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudents}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E2B88] to-[#7C248C] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Student Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Class Create / Edit Modal */}
      {isLiveClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleLiveClassSubmit}
            className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingLiveClass ? "Edit Live Class Session" : "Schedule Live Class (Google Meet)"}
              </h3>
              <button
                type="button"
                onClick={() => setIsLiveClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced System Architecture & Live Q&A"
                  value={liveClassForm.title}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={liveClassForm.scheduledDate}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={liveClassForm.status}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={liveClassForm.startTime}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={liveClassForm.endTime}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google Meet Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={liveClassForm.meetUrl}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, meetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recording Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={liveClassForm.recordingUrl}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, recordingUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Agenda / Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what topics will be covered..."
                  value={liveClassForm.description}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLiveClassModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Live Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLiveClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-sm w-full space-y-4 text-center shadow-xl animate-in fade-in zoom-in-95">
            <Trash2 className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-black text-slate-900 text-base">Delete Live Class?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete "{deletingLiveClass.title}"? This action will remove the meeting room and scheduled session.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingLiveClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLiveClass}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
