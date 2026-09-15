"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  Sparkles,
  LayoutGrid,
  List,
  Video,
  Clock,
  CheckSquare,
  ShieldCheck,
  FolderOpen,
  GraduationCap,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profile?: { avatarUrl?: string | null; designation?: string | null } | null;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  profile?: { avatarUrl?: string | null } | null;
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
}

interface BatchItem {
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
    level: string;
    thumbnailUrl?: string | null;
    _count?: { modules: number; resources: number };
  };
  trainers: Array<{
    id: string;
    trainerId: string;
    trainer: TrainerUser;
  }>;
  students: Array<{
    id: string;
    userId: string;
    user: StudentUser;
  }>;
  totalStudents: number;
  totalTrainers: number;
  totalLiveClasses: number;
  totalResources?: number;
}

export default function BatchesClient({
  initialBatches,
  courses,
  trainers,
  students,
}: {
  initialBatches: BatchItem[];
  courses: CourseOption[];
  trainers: TrainerUser[];
  students: StudentUser[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<BatchItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    courseId: courses[0]?.id || "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "UPCOMING" as "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED",
    selectedTrainerIds: [] as string[],
    selectedStudentIds: [] as string[],
  });

  const [studentSearchInModal, setStudentSearchInModal] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (courseFilter) params.set("courseId", courseFilter);

      const res = await fetch(`/api/admin/batches?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [searchQuery, statusFilter, courseFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          courseId: formData.courseId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          trainerIds: formData.selectedTrainerIds,
          studentIds: formData.selectedStudentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create batch");
      }

      showToast("success", `Batch "${formData.name}" created successfully!`);
      setIsAddModalOpen(false);
      resetForm();
      fetchBatches();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create batch");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${editingBatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          courseId: formData.courseId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          trainerIds: formData.selectedTrainerIds,
          studentIds: formData.selectedStudentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update batch");
      }

      showToast("success", `Batch "${formData.name}" updated successfully!`);
      setEditingBatch(null);
      resetForm();
      fetchBatches();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update batch");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBatch) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${deletingBatch.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete batch");
      }

      showToast("success", `Batch deleted.`);
      setDeletingBatch(null);
      fetchBatches();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete batch");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (batch: BatchItem) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      courseId: batch.courseId,
      startDate: new Date(batch.startDate).toISOString().split("T")[0],
      endDate: new Date(batch.endDate).toISOString().split("T")[0],
      status: batch.status,
      selectedTrainerIds: batch.trainers.map((t) => t.trainerId),
      selectedStudentIds: batch.students.map((s) => s.userId),
    });
    setStudentSearchInModal("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      courseId: courses[0]?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "UPCOMING",
      selectedTrainerIds: [],
      selectedStudentIds: [],
    });
    setStudentSearchInModal("");
  };

  const toggleTrainerSelection = (trainerId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedTrainerIds.includes(trainerId);
      return {
        ...prev,
        selectedTrainerIds: exists
          ? prev.selectedTrainerIds.filter((id) => id !== trainerId)
          : [...prev.selectedTrainerIds, trainerId],
      };
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedStudentIds.includes(studentId);
      return {
        ...prev,
        selectedStudentIds: exists
          ? prev.selectedStudentIds.filter((id) => id !== studentId)
          : [...prev.selectedStudentIds, studentId],
      };
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ongoing
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
            <Clock className="w-3 h-3 text-[#7C248C]" /> Upcoming
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-500" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
    }
  };

  // Filtered students inside modal
  const filteredStudentsInModal = students.filter((s) => {
    const q = studentSearchInModal.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const totalOngoingCount = batches.filter((b) => b.status === "ONGOING").length;
  const totalUpcomingCount = batches.filter((b) => b.status === "UPCOMING").length;
  const totalCompletedCount = batches.filter((b) => b.status === "COMPLETED").length;
  const totalStudentsEnrolled = batches.reduce((sum, b) => sum + (b.totalStudents || 0), 0);
  const totalClassesPlanned = batches.reduce((sum, b) => sum + (b.totalLiveClasses || 0), 0);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast */}
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

      {/* Header Banner - Matches Content Library & Courses Studio Style */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-52 h-52 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Cohort Management & Academic Sync
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#7C248C]" /> Academic Batches 🎓
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Create, configure, and monitor learning cohorts across all courses. Allocate faculties, review trainer live classes & attendance records in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Batch
          </button>
        </div>
      </div>

      {/* KPI Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" /> Total Batches
          </div>
          <div className="text-2xl font-black text-slate-900">{batches.length}</div>
          <div className="text-[11px] font-mono text-purple-700 font-semibold">{courses.length} Active Programs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Ongoing Cohorts
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalOngoingCount}</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">Active In Session</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Upcoming
          </div>
          <div className="text-2xl font-black text-indigo-600">{totalUpcomingCount}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">Enrollment Open</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-rose-600" /> Batch Students
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudentsEnrolled}</div>
          <div className="text-[11px] font-mono text-rose-700 font-semibold">Allocated Learners</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-cyan-600" /> Live Sessions
          </div>
          <div className="text-2xl font-black text-cyan-600">{totalClassesPlanned}</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">Scheduled / Taken</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search batch by name, program title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C]"
            >
              <option value="ALL">All Cohort Statuses</option>
              <option value="ONGOING">Ongoing</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C] max-w-[200px]"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "grid" ? "bg-white shadow-xs text-[#7C248C]" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "table" ? "bg-white shadow-xs text-[#7C248C]" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Roster Display */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Loader2 className="w-9 h-9 text-[#7C248C] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Synchronizing batch data...</p>
        </div>
      ) : batches.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-purple-300 transition duration-200 flex flex-col justify-between group"
              >
                {/* Header & Main Info */}
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(b.status)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C248C] bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full">
                      {b.course.level}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Link
                      href={`/admin/batches/${b.id}`}
                      className="text-base font-extrabold text-slate-900 group-hover:text-[#7C248C] transition line-clamp-1 flex items-center justify-between"
                    >
                      <span>{b.name}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition text-[#7C248C]" />
                    </Link>
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 line-clamp-1">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" /> {b.course.title}
                    </p>
                  </div>

                  {/* Dates Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" /> Cohort Schedule:
                      </span>
                      <strong className="text-slate-800">
                        {formatDate(b.startDate)} – {formatDate(b.endDate)}
                      </strong>
                    </div>
                  </div>

                  {/* Trainers Assigned Stack */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Faculty / Trainers ({b.trainers.length})
                    </div>
                    {b.trainers.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {b.trainers.map((t) => (
                          <div
                            key={t.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50/70 border border-purple-100 text-[#7C248C] font-semibold text-[11px]"
                            title={t.trainer.email}
                          >
                            {t.trainer.profile?.avatarUrl ? (
                              <img
                                src={t.trainer.profile.avatarUrl}
                                alt={t.trainer.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-[#7C248C] text-white font-bold text-[9px] flex items-center justify-center">
                                {t.trainer.name.charAt(0)}
                              </div>
                            )}
                            <span className="line-clamp-1 max-w-[120px]">{t.trainer.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-mono">No trainers assigned</span>
                    )}
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-rose-600" />
                      <span>{b.totalStudents} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{b.totalLiveClasses} Live Classes</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/batches/${b.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-[#7C248C] hover:bg-purple-50/30 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Batch & Activity
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      title="Edit Batch Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingBatch(b)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Batch Details</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Trainers</th>
                    <th className="p-4 text-center">Students</th>
                    <th className="p-4 text-center">Live Classes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <Link
                          href={`/admin/batches/${b.id}`}
                          className="font-bold text-slate-900 hover:text-[#7C248C] text-sm block"
                        >
                          {b.name}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400">ID: {b.id.slice(-8)}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{b.course.title}</div>
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono">
                          {b.course.level}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div>{formatDate(b.startDate)}</div>
                        <div className="text-slate-400">to {formatDate(b.endDate)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {b.trainers.slice(0, 2).map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded-lg bg-purple-50 text-[#7C248C] text-[10px] font-semibold"
                            >
                              {t.trainer.name}
                            </span>
                          ))}
                          {b.trainers.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{b.trainers.length - 2}</span>
                          )}
                          {b.trainers.length === 0 && <span className="text-slate-400 italic">None</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-900">{b.totalStudents}</td>
                      <td className="p-4 text-center font-bold text-cyan-600">{b.totalLiveClasses}</td>
                      <td className="p-4">{getStatusBadge(b.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/batches/${b.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-600 transition"
                            title="View Batch"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingBatch(b)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No batches match your query</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting search terms or filters, or click "Create New Batch" above to start a new cohort.
          </p>
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {(isAddModalOpen || editingBatch) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-[#7C248C] tracking-wider">
                  {editingBatch ? "Update Configuration" : "New Cohort Setup"}
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-5 h-5 text-[#7C248C]" />
                  {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Create New Academic Batch"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBatch(null);
                }}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingBatch ? handleEditSubmit : handleCreateSubmit}
              className="space-y-4 text-xs"
            >
              {/* Batch Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Batch Cohort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Full-Stack Dev - Cohort 2026-A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-[#7C248C] transition"
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Associated Course Curriculum *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-[#7C248C]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Cohort Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-[#7C248C]"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Multi-Trainer Allocation Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Assign Faculty / Trainers ({formData.selectedTrainerIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-slate-400">Click to select/deselect</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-44 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {trainers.map((tr) => {
                    const isSelected = formData.selectedTrainerIds.includes(tr.id);
                    return (
                      <div
                        key={tr.id}
                        onClick={() => toggleTrainerSelection(tr.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? "bg-purple-50 border-purple-300 text-purple-900 shadow-2xs"
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
                            <div className="font-bold text-xs">{tr.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{tr.role}</div>
                          </div>
                        </div>

                        {isSelected && <CheckSquare className="w-4 h-4 text-[#7C248C]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Enrolment Multi-Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Allocate Students ({formData.selectedStudentIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-slate-400">Optional at creation</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search students to allocate..."
                    value={studentSearchInModal}
                    onChange={(e) => setStudentSearchInModal(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                  {filteredStudentsInModal.slice(0, 50).map((st) => {
                    const isSelected = formData.selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleStudentSelection(st.id)}
                        className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? "bg-purple-50 border-purple-300 text-purple-900 shadow-2xs font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {st.profile?.avatarUrl ? (
                            <img
                              src={st.profile.avatarUrl}
                              alt={st.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[9px]">
                              {st.name.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="text-xs truncate">{st.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{st.email}</div>
                          </div>
                        </div>

                        {isSelected && <CheckSquare className="w-4 h-4 text-[#7C248C] shrink-0" />}
                      </div>
                    );
                  })}
                  {filteredStudentsInModal.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-slate-400">No students match filter</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBatch(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingBatch ? "Save Batch Changes" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Batch Modal */}
      {deletingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Cohort Batch?</h3>
                <p className="text-xs text-slate-500 font-mono">Irreversible database action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete batch <strong className="text-slate-900">{deletingBatch.name}</strong>? All linked student enrollments and records for this batch will be disassociated.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingBatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
