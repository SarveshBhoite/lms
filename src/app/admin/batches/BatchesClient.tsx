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
} from "lucide-react";

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
  course: { id: string; title: string; level: string; thumbnailUrl?: string | null };
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

      showToast("success", `Batch "${formData.name}" updated!`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" /> Ongoing
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-600" /> Upcoming
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-500" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
    }
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" /> Batch Allocation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Batch Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize student cohorts, assign multiple trainers, schedule live classes, and manage attendance.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Create New Batch
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-600" /> Total Batches
          </div>
          <div className="text-2xl font-black text-slate-900">{batches.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Ongoing Cohorts
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {batches.filter((b) => b.status === "ONGOING").length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Upcoming Batches
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {batches.filter((b) => b.status === "UPCOMING").length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-rose-600" /> Batch Students
          </div>
          <div className="text-2xl font-black text-slate-900">
            {batches.reduce((sum, b) => sum + b.totalStudents, 0)}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search batch by name, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Batch Statuses</option>
              <option value="ONGOING">Ongoing</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches Roster Display */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading batch list...</p>
        </div>
      ) : batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  {getStatusBadge(b.status)}
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {b.course.level}
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    href={`/admin/batches/${b.id}`}
                    className="text-base font-extrabold text-slate-900 hover:text-rose-600 transition line-clamp-1"
                  >
                    {b.name}
                  </Link>
                  <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1 line-clamp-1">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" /> {b.course.title}
                  </p>
                </div>

                {/* Dates */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-600" /> Start:
                    </span>
                    <strong className="text-slate-800">
                      {new Date(b.startDate).toLocaleDateString()}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-600" /> End:
                    </span>
                    <strong className="text-slate-800">
                      {new Date(b.endDate).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                {/* Trainers Avatars Stack */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Trainers ({b.trainers.length})
                  </div>
                  {b.trainers.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.trainers.map((t) => (
                        <div
                          key={t.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold text-[11px]"
                          title={t.trainer.email}
                        >
                          {t.trainer.profile?.avatarUrl ? (
                            <img
                              src={t.trainer.profile.avatarUrl}
                              alt={t.trainer.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                              {t.trainer.name.charAt(0)}
                            </div>
                          )}
                          <span>{t.trainer.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No trainers assigned</span>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{b.totalStudents} Students</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-rose-600" />
                    <span>{b.totalLiveClasses} Live Classes</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/batches/${b.id}`}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-200 hover:border-cyan-300 text-cyan-700 hover:text-cyan-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Manage Cohort
                </Link>

                <div className="flex items-center gap-1">
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
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No batches found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No batches matched your current search parameters. Create a new batch to allocate students and schedule live classes.
          </p>
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {(isAddModalOpen || editingBatch) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                {editingBatch ? "Edit Batch Configuration" : "Create New Batch Cohort"}
              </h2>
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
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Batch Cohort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Web Dev - Cohort 2026-A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Associated Course *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
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
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Batch Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
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
                <label className="font-bold text-slate-700 block">
                  Assign Trainers (Select one or multiple)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {trainers.map((tr) => {
                    const isSelected = formData.selectedTrainerIds.includes(tr.id);
                    return (
                      <div
                        key={tr.id}
                        onClick={() => toggleTrainerSelection(tr.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
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
                            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {tr.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-xs">{tr.name}</div>
                            <div className="text-[10px] text-slate-400">{tr.role}</div>
                          </div>
                        </div>

                        {isSelected && <CheckSquare className="w-4 h-4 text-indigo-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBatch(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
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
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Batch Cohort?</h3>
                <p className="text-xs text-slate-500">Permanent action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete batch cohort <strong className="text-slate-900">{deletingBatch.name}</strong>?
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
