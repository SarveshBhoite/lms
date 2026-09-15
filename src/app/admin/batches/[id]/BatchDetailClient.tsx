"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  ChevronLeft,
  Calendar,
  Users,
  Video,
  Clock,
  Sparkles,
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
  Eye,
  BarChart2,
  Globe,
  Lock,
  ShieldCheck,
  Award,
  FileText,
  Search,
  Check,
  Info,
  CalendarDays,
  Percent,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserProfile {
  phone?: string | null;
  avatarUrl?: string | null;
  designation?: string | null;
}

interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profile?: UserProfile | null;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
  profile?: UserProfile | null;
}

interface AttendanceRecord {
  id: string;
  liveClassId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  recordedAt: string;
  joinClickTime?: string | null;
  leftTime?: string | null;
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

interface BatchTrainerItem {
  id: string;
  trainerId: string;
  assignedAt: string;
  trainer: TrainerUser;
}

interface LessonItem {
  id: string;
  title: string;
  contentType: string;
  durationMinutes: number;
  orderIndex: number;
  isFreePreview: boolean;
}

interface ModuleItem {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: LessonItem[];
}

interface BatchResourceItem {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  origin?: string;
}

interface BatchDetail {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string | null;
    level: string;
    durationHours: number;
    modules?: ModuleItem[];
  };
  trainers: BatchTrainerItem[];
  students: BatchStudentItem[];
  liveClasses: LiveClassItem[];
  resources?: BatchResourceItem[];
  _count: {
    students: number;
    trainers: number;
    liveClasses: number;
    resources?: number;
  };
}

export default function BatchDetailClient({
  initialBatch,
  availableTrainers,
  availableStudents,
}: {
  initialBatch: BatchDetail;
  availableTrainers: TrainerUser[];
  availableStudents: StudentUser[];
}) {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchDetail>(initialBatch);
  const [activeTab, setActiveTab] = useState<
    "overview" | "live-classes" | "attendance" | "trainers" | "students" | "resources"
  >("overview");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Batch Modal
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [batchEditForm, setBatchEditForm] = useState({
    name: initialBatch.name,
    startDate: new Date(initialBatch.startDate).toISOString().split("T")[0],
    endDate: new Date(initialBatch.endDate).toISOString().split("T")[0],
    status: initialBatch.status,
  });

  // Trainer Assignment Modal
  const [isTrainersModalOpen, setIsTrainersModalOpen] = useState(false);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>(
    initialBatch.trainers.map((t) => t.trainerId)
  );

  // Student Assignment Modal
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialBatch.students.map((s) => s.userId)
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Attendance Viewer State
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<LiveClassItem | null>(
    initialBatch.liveClasses[0] || null
  );

  // Student attendance filter
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshBatch = async () => {
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}`);
      const data = await res.json();
      if (data.success) {
        setBatch(data.data);
        if (!selectedClassForAttendance && data.data.liveClasses?.length > 0) {
          setSelectedClassForAttendance(data.data.liveClasses[0]);
        }
      }
    } catch (err) {
      console.error("Failed to refresh batch data:", err);
    }
  };

  // Edit Batch Metadata Submit
  const handleUpdateBatchMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchEditForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update batch");

      showToast("success", "Batch details updated successfully!");
      setIsEditBatchModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update batch");
    } finally {
      setActionLoading(false);
    }
  };

  // Sync Trainers Submit
  const handleSaveTrainers = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerIds: selectedTrainerIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update trainers");

      showToast("success", "Assigned trainers updated!");
      setIsTrainersModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save trainers");
    } finally {
      setActionLoading(false);
    }
  };

  // Sync Students Submit
  const handleSaveStudents = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update students");

      showToast("success", "Batch student roster updated!");
      setIsStudentsModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save students");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ongoing
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
            <Clock className="w-3 h-3 text-[#7C248C]" /> Upcoming
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-500" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
    }
  };

  // Cohort & Attendance Metrics Calculations
  const totalClasses = batch.liveClasses.length;
  const completedClasses = batch.liveClasses.filter((lc) => lc.status === "COMPLETED").length;
  const liveClassesCount = batch.liveClasses.filter((lc) => lc.status === "LIVE").length;
  const scheduledClasses = batch.liveClasses.filter((lc) => lc.status === "SCHEDULED").length;

  // Aggregate total attendance stats across all live classes
  let totalPresentCount = 0;
  let totalAbsentCount = 0;
  let totalLateCount = 0;
  let totalRecordedAttendances = 0;

  batch.liveClasses.forEach((lc) => {
    lc.attendances?.forEach((att) => {
      totalRecordedAttendances++;
      if (att.status === "PRESENT") totalPresentCount++;
      else if (att.status === "ABSENT") totalAbsentCount++;
      else if (att.status === "LATE") totalLateCount++;
    });
  });

  const overallAttendanceRate =
    totalRecordedAttendances > 0
      ? Math.round(((totalPresentCount + totalLateCount) / totalRecordedAttendances) * 100)
      : 0;

  // Filter students in allocation modal
  const filteredStudentsInModal = availableStudents.filter((st) => {
    const q = studentSearchQuery.toLowerCase();
    return st.name.toLowerCase().includes(q) || st.email.toLowerCase().includes(q);
  });

  // Calculate stats for current selected attendance class
  const currentClassAttendances = selectedClassForAttendance?.attendances || [];
  const currentClassPresent = currentClassAttendances.filter((a) => a.status === "PRESENT").length;
  const currentClassAbsent = currentClassAttendances.filter((a) => a.status === "ABSENT").length;
  const currentClassLate = currentClassAttendances.filter((a) => a.status === "LATE").length;
  const currentClassExcused = currentClassAttendances.filter((a) => a.status === "EXCUSED").length;

  // Filter students in attendance table
  const filteredAttendanceStudents = batch.students.filter((bs) => {
    const q = attendanceSearch.toLowerCase();
    return bs.user.name.toLowerCase().includes(q) || bs.user.email.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to All Batches
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Batch ID: {batch.id.slice(-8)}</span>
        </div>
      </div>

      {/* Hero Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(batch.status)}
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] border border-purple-200">
              {batch.course.title}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Level: {batch.course.level}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{batch.name}</h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap font-mono">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700 font-sans">
              <Calendar className="w-4 h-4 text-[#7C248C]" />
              {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-sans">
              <Users className="w-4 h-4 text-rose-600" /> {batch.students.length} Students Allocated
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-sans">
              <Video className="w-4 h-4 text-cyan-600" /> {batch.liveClasses.length} Live Sessions
            </span>
          </div>
        </div>

        {/* Admin Batch Controls */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => {
              setBatchEditForm({
                name: batch.name,
                startDate: new Date(batch.startDate).toISOString().split("T")[0],
                endDate: new Date(batch.endDate).toISOString().split("T")[0],
                status: batch.status,
              });
              setIsEditBatchModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-600" /> Edit Batch
          </button>

          <button
            onClick={() => {
              setSelectedTrainerIds(batch.trainers.map((t) => t.trainerId));
              setIsTrainersModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs border border-purple-200 shadow-2xs flex items-center gap-1.5 transition"
          >
            <Users className="w-3.5 h-3.5" /> Assign Faculty
          </button>

          <button
            onClick={() => {
              setSelectedStudentIds(batch.students.map((s) => s.userId));
              setStudentSearchQuery("");
              setIsStudentsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-1.5 transition"
          >
            <UserCheck className="w-3.5 h-3.5" /> Allocate Students
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-rose-600" /> Cohort Size
          </div>
          <div className="text-2xl font-black text-slate-900">{batch.students.length}</div>
          <div className="text-[11px] font-mono text-rose-700 font-semibold">Active Enrollees</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-cyan-600" /> Live Classes
          </div>
          <div className="text-2xl font-black text-cyan-600">{totalClasses}</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">
            {completedClasses} Completed • {scheduledClasses} Upcoming
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-emerald-600" /> Attendance Rate
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {totalRecordedAttendances > 0 ? `${overallAttendanceRate}%` : "N/A"}
          </div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">
            {totalRecordedAttendances} Audited Checks
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-purple-600" /> Assigned Trainers
          </div>
          <div className="text-2xl font-black text-[#7C248C]">{batch.trainers.length}</div>
          <div className="text-[11px] font-mono text-purple-700 font-semibold">Faculty Mentors</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Curriculum
          </div>
          <div className="text-2xl font-black text-indigo-600">{batch.course.modules?.length || 0}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">
            {batch.course.durationHours} Hours Total
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview & Syllabus
        </button>

        <button
          onClick={() => setActiveTab("live-classes")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "live-classes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Live Classes ({batch.liveClasses.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Attendance Analytics
        </button>

        <button
          onClick={() => setActiveTab("trainers")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "trainers"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Faculty ({batch.trainers.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Students Roster ({batch.students.length})
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "resources"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" /> Batch Resources ({batch.resources?.length || 0})
        </button>
      </div>

      {/* ================= TAB 1: BATCH OVERVIEW & SYLLABUS ================= */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Course & Curriculum Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#7C248C]">
                    Academic Syllabus Mapping
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#7C248C]" />
                    {batch.course.title}
                  </h3>
                </div>

                <Link
                  href={`/courses/${batch.course.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  View Course Preview <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {batch.course.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{batch.course.description}</p>
              )}

              {/* Modules Accordion / List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Course Modules & Lessons ({batch.course.modules?.length || 0} Modules)
                </h4>

                {batch.course.modules && batch.course.modules.length > 0 ? (
                  <div className="space-y-2.5">
                    {batch.course.modules.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">
                            Module {idx + 1}: {m.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {m.lessons.length} Lessons
                          </span>
                        </div>
                        {m.description && <p className="text-[11px] text-slate-500">{m.description}</p>}

                        {/* Lessons preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {m.lessons.map((les, lIdx) => (
                            <div
                              key={les.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-100 text-[11px] text-slate-700 flex items-center justify-between"
                            >
                              <span className="truncate">
                                {lIdx + 1}. {les.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                                {les.durationMinutes}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl">
                    No curriculum modules defined for this course yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-[#7C248C]" /> Cohort Metadata
              </h3>

              <div className="text-xs text-slate-600 divide-y divide-slate-100 font-mono">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-sans">Batch Status:</span>
                  <span>{getStatusBadge(batch.status)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-sans">Start Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(batch.startDate)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-sans">End Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(batch.endDate)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-sans">Total Learners:</span>
                  <span className="font-bold text-slate-800">{batch.students.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-sans">Faculty Allocated:</span>
                  <span className="font-bold text-slate-800">{batch.trainers.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-sans">Created On:</span>
                  <span className="text-slate-500">{formatDate(batch.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Trainer Roles Notice */}
            <div className="p-5 rounded-3xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <div className="flex items-center gap-2 text-[#7C248C] font-bold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Trainer-Led Cohort Policy</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Live sessions, meeting links, and student attendance logs are actively managed by assigned trainers. As an administrator, you have real-time audit oversight and batch management privileges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE CLASSES (READ-ONLY MONITORING) ================= */}
      {activeTab === "live-classes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#7C248C] tracking-wider mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Trainer-Managed Activity Stream
              </div>
              <h2 className="text-lg font-bold text-slate-900">Live Classes & Video Sessions</h2>
              <p className="text-xs text-slate-500">
                Live interactive classes conducted by assigned faculties for this cohort. (Admin view is read-only)
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-[#7C248C] border border-purple-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Info className="w-3.5 h-3.5" /> Scheduled by Faculty
            </span>
          </div>

          {batch.liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batch.liveClasses.map((lc) => (
                <div
                  key={lc.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          lc.status === "LIVE"
                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            : lc.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-purple-50 text-[#7C248C] border-purple-200"
                        }`}
                      >
                        {lc.status === "LIVE" ? "• Live Now" : lc.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatDate(lc.scheduledDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{lc.title}</h3>
                      {lc.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lc.description}</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Time Window:</span>
                        <strong className="text-slate-900">
                          {formatDate(lc.startTime, { includeTime: true })} –{" "}
                          {formatDate(lc.endTime, { includeTime: true })}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Instructor:</span>
                        <strong className="text-[#7C248C] font-sans">{lc.trainer?.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Attendance Marked:</span>
                        <strong className="text-slate-800 font-sans">
                          {lc.attendances?.length || 0} / {batch.students.length} Students
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* Google Meet Link: Only show active Join button if class is LIVE or SCHEDULED and not in the past */}
                    {(() => {
                      const isPast = new Date(lc.endTime).getTime() < Date.now();
                      const isOver = lc.status === "COMPLETED" || lc.status === "CANCELLED" || (lc.status === "SCHEDULED" && isPast);

                      if (isOver) {
                        return (
                          <div className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-default select-none">
                            <CheckCircle2 className="w-4 h-4 text-slate-400" />
                            <span>Meeting Concluded</span>
                          </div>
                        );
                      }

                      return (
                        <a
                          href={lc.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition ${
                            lc.status === "LIVE"
                              ? "bg-rose-600 hover:bg-rose-500 animate-pulse shadow-rose-600/20"
                              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          <span>{lc.status === "LIVE" ? "Join Ongoing Session" : "Join Meet Session"}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      );
                    })()}

                    {lc.recordingUrl && (
                      <a
                        href={lc.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        Watch Recorded Session <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => {
                          setSelectedClassForAttendance(lc);
                          setActiveTab("attendance");
                        }}
                        className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> View Attendance Records ({lc.attendances?.length || 0})
                      </button>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Trainer-managed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Video className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No live classes scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The assigned trainers for this batch have not scheduled any live Google Meet sessions yet. Once scheduled, classes will be reflected here automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: ATTENDANCE ANALYTICS (READ-ONLY) ================= */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#7C248C] tracking-wider mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Read-Only Audit Matrix
              </div>
              <h2 className="text-lg font-bold text-slate-900">Attendance Analytics & Logs</h2>
              <p className="text-xs text-slate-500">
                Audited student attendance records logged by trainers across all live classes.
              </p>
            </div>

            {/* Select Live Class Filter */}
            {batch.liveClasses.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-600">Select Session:</label>
                <select
                  value={selectedClassForAttendance?.id || ""}
                  onChange={(e) => {
                    const target = batch.liveClasses.find((lc) => lc.id === e.target.value);
                    setSelectedClassForAttendance(target || null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#7C248C]"
                >
                  {batch.liveClasses.map((lc) => (
                    <option key={lc.id} value={lc.id}>
                      {lc.title} ({formatDate(lc.scheduledDate)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Session Overview Stats Cards */}
          {selectedClassForAttendance && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Present</div>
                <div className="text-xl font-black text-emerald-600">{currentClassPresent}</div>
                <div className="text-[10px] font-mono text-slate-500">Learners In Attendance</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Absent</div>
                <div className="text-xl font-black text-rose-600">{currentClassAbsent}</div>
                <div className="text-[10px] font-mono text-slate-500">Unexcused Misses</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Late Entry</div>
                <div className="text-xl font-black text-amber-600">{currentClassLate}</div>
                <div className="text-[10px] font-mono text-slate-500">Joined Past Cutoff</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Excused</div>
                <div className="text-xl font-black text-purple-600">{currentClassExcused}</div>
                <div className="text-[10px] font-mono text-slate-500">Permitted Absences</div>
              </div>
            </div>
          )}

          {selectedClassForAttendance ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3">
              {/* Table Header Bar */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedClassForAttendance.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Conducted on: {formatDate(selectedClassForAttendance.scheduledDate)} • Lead:{" "}
                    {selectedClassForAttendance.trainer?.name}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                  />
                </div>
              </div>

              {batch.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Join / Activity Timestamp</th>
                        <th className="p-4">Audited Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredAttendanceStudents.map((bs) => {
                        const existingAtt = selectedClassForAttendance.attendances?.find(
                          (att) => att.userId === bs.userId
                        );
                        const status = existingAtt?.status || "NOT_RECORDED";

                        return (
                          <tr key={bs.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {bs.user.profile?.avatarUrl ? (
                                  <img
                                    src={bs.user.profile.avatarUrl}
                                    alt={bs.user.name}
                                    className="w-8 h-8 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-[#7C248C] text-white font-bold flex items-center justify-center text-xs">
                                    {bs.user.name.charAt(0)}
                                  </div>
                                )}
                                <div className="font-bold text-slate-900">{bs.user.name}</div>
                              </div>
                            </td>

                            <td className="p-4 font-mono text-slate-600">{bs.user.email}</td>

                            <td className="p-4 font-mono text-slate-500 text-[11px]">
                              {existingAtt?.joinClickTime
                                ? formatDate(existingAtt.joinClickTime, { includeTime: true })
                                : existingAtt?.recordedAt
                                ? formatDate(existingAtt.recordedAt, { includeTime: true })
                                : "—"}
                            </td>

                            <td className="p-4">
                              {status === "PRESENT" && (
                                <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  PRESENT
                                </span>
                              )}
                              {status === "ABSENT" && (
                                <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                                  ABSENT
                                </span>
                              )}
                              {status === "LATE" && (
                                <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                                  LATE
                                </span>
                              )}
                              {status === "EXCUSED" && (
                                <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-purple-50 text-[#7C248C] border border-purple-200">
                                  EXCUSED
                                </span>
                              )}
                              {status === "NOT_RECORDED" && (
                                <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                                  PENDING TRAINER AUDIT
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No students in this cohort yet.
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CheckSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Live Class Sessions to Audit</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once trainers conduct live classes, their verified attendance audit records will display here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ASSIGNED TRAINERS (ADMIN MANAGED) ================= */}
      {activeTab === "trainers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#7C248C] tracking-wider mb-0.5">
                Faculty Cohort Assignment
              </div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Faculty Mentors</h2>
              <p className="text-xs text-slate-500">
                Trainers assigned to lead classes, manage syllabus modules, and audit attendance for this cohort.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedTrainerIds(batch.trainers.map((t) => t.trainerId));
                setIsTrainersModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Manage Faculty Allocations
            </button>
          </div>

          {batch.trainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batch.trainers.map((bt) => (
                <div
                  key={bt.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex items-center gap-4 hover:border-purple-300 transition"
                >
                  {bt.trainer.profile?.avatarUrl ? (
                    <img
                      src={bt.trainer.profile.avatarUrl}
                      alt={bt.trainer.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-purple-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7C248C] font-bold text-lg flex items-center justify-center shrink-0">
                      {bt.trainer.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{bt.trainer.name}</h4>
                    <p className="text-xs text-slate-500 font-mono truncate">{bt.trainer.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C]">
                        {bt.trainer.profile?.designation || "Instructor"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Since {formatDate(bt.assignedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No trainers assigned</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Allocate faculty to this cohort so they can schedule classes and interact with enrolled students.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: STUDENTS ROSTER (ADMIN MANAGED) ================= */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#7C248C] tracking-wider mb-0.5">
                Learner Allocations
              </div>
              <h2 className="text-lg font-bold text-slate-900">Batch Student Roster</h2>
              <p className="text-xs text-slate-500">
                All learners enrolled in this cohort with access to live sessions and batch materials.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedStudentIds(batch.students.map((s) => s.userId));
                setStudentSearchQuery("");
                setIsStudentsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Manage Student Roster
            </button>
          </div>

          {batch.students.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Joined Batch Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {batch.students.map((bs) => (
                      <tr key={bs.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {bs.user.profile?.avatarUrl ? (
                              <img
                                src={bs.user.profile.avatarUrl}
                                alt={bs.user.name}
                                className="w-8 h-8 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-[#7C248C] text-white font-bold flex items-center justify-center text-xs">
                                {bs.user.name.charAt(0)}
                              </div>
                            )}
                            <div className="font-bold text-slate-900">{bs.user.name}</div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-slate-600">{bs.user.email}</td>

                        <td className="p-4 font-mono text-slate-500 text-[11px]">
                          {formatDate(bs.joinedAt)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              bs.user.isActive !== false
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {bs.user.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/students/${bs.user.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 inline-flex items-center gap-1 font-semibold transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Student
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No students allocated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Allocate students to this cohort so they receive automated access to classes and cohort updates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: BATCH RESOURCES ================= */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#7C248C] tracking-wider mb-0.5">
                Cohort Documents
              </div>
              <h2 className="text-lg font-bold text-slate-900">Batch Learning Materials & Files</h2>
              <p className="text-xs text-slate-500">
                Shared notes, slides, datasets, and recordings attached specifically to this cohort.
              </p>
            </div>

            <Link
              href="/admin/content"
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs border border-purple-200 flex items-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" /> Open Universal Content Library
            </Link>
          </div>

          {batch.resources && batch.resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {batch.resources.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                        {res.fileType}
                      </span>
                      {res.origin && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[170px]" title={res.origin}>
                          {res.origin}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2">{res.title}</h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      {(res.fileSize / (1024 * 1024)).toFixed(2)} MB • {formatDate(res.createdAt)}
                    </p>
                  </div>

                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] font-bold text-xs flex items-center justify-center gap-1.5 transition text-slate-700"
                  >
                    Open Resource <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No resources linked to this batch</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Assigned faculty or admins can distribute files through the Content Library or Course curriculum.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Edit Batch Metadata Modal */}
      {isEditBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 sm:p-7 rounded-3xl border border-slate-200 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Edit Cohort Configuration</h3>
              <button
                onClick={() => setIsEditBatchModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatchMetadata} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={batchEditForm.name}
                  onChange={(e) => setBatchEditForm({ ...batchEditForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={batchEditForm.startDate}
                    onChange={(e) =>
                      setBatchEditForm({ ...batchEditForm, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={batchEditForm.endDate}
                    onChange={(e) =>
                      setBatchEditForm({ ...batchEditForm, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Batch Status *</label>
                <select
                  value={batchEditForm.status}
                  onChange={(e) =>
                    setBatchEditForm({ ...batchEditForm, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manage Trainers Modal */}
      {isTrainersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-200 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assign Faculty to Cohort</h3>
                <p className="text-[11px] text-slate-500">
                  Select trainers responsible for conducting sessions and taking attendance
                </p>
              </div>
              <button
                onClick={() => setIsTrainersModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              {availableTrainers.map((tr) => {
                const isSelected = selectedTrainerIds.includes(tr.id);
                return (
                  <div
                    key={tr.id}
                    onClick={() =>
                      setSelectedTrainerIds((prev) =>
                        isSelected ? prev.filter((id) => id !== tr.id) : [...prev, tr.id]
                      )
                    }
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {tr.profile?.avatarUrl ? (
                        <img
                          src={tr.profile.avatarUrl}
                          alt={tr.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#7C248C] text-white font-bold flex items-center justify-center text-[10px]">
                          {tr.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div>{tr.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tr.email}</div>
                      </div>
                    </div>
                    {isSelected && <CheckSquare className="w-4 h-4 text-[#7C248C]" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTrainersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrainers}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Faculty Allocations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Students Modal */}
      {isStudentsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-200 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Allocate Learners to Cohort</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedStudentIds.length} learners selected for this cohort
                </p>
              </div>
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students to allocate..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              {filteredStudentsInModal.slice(0, 50).map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() =>
                      setSelectedStudentIds((prev) =>
                        isSelected ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                      )
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {st.profile?.avatarUrl ? (
                        <img
                          src={st.profile.avatarUrl}
                          alt={st.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {st.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div>{st.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{st.email}</div>
                      </div>
                    </div>
                    {isSelected && <CheckSquare className="w-4 h-4 text-[#7C248C]" />}
                  </div>
                );
              })}
              {filteredStudentsInModal.length === 0 && (
                <div className="text-center py-6 text-slate-400">No students found</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudents}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Student Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
