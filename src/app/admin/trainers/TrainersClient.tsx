"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Search,
  Plus,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  BookOpen,
  Layers,
  Sparkles,
  Users,
  Award,
  Link2,
  LayoutGrid,
  List,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Trainer {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    phone?: string | null;
    avatarUrl?: string | null;
    designation?: string | null;
    bio?: string | null;
  } | null;
  coursesCreated: Array<{
    id: string;
    title: string;
    status: string;
    _count?: { enrollments: number };
  }>;
  trainerBatches: Array<{
    batch: {
      id: string;
      name: string;
      status: string;
      _count?: { students: number };
    };
  }>;
  totalStudentsCount?: number;
}

interface CourseOption {
  id: string;
  title: string;
  trainerId?: string;
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
}

export default function TrainersClient({
  initialTrainers,
  courses,
  batches,
}: {
  initialTrainers: Trainer[];
  courses: CourseOption[];
  batches: BatchOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  // View Mode: Table Roster or Grid Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [assigningTrainer, setAssigningTrainer] = useState<Trainer | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    avatarUrl: "",
    designation: "",
    bio: "",
    isActive: true,
    courseIds: [] as string[],
    batchIds: [] as string[],
  });

  // Assign Modal Form State
  const [assignCourseIds, setAssignCourseIds] = useState<string[]>([]);
  const [assignBatchIds, setAssignBatchIds] = useState<string[]>([]);

  // Open Add Modal automatically if ?action=new is in URL
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  // Show Toast Helper
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch / Refresh trainers from API
  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/trainers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTrainers(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch trainers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [searchQuery, statusFilter]);

  // Filtered Trainers with client-side course/batch filter support
  const filteredTrainers = useMemo(() => {
    return trainers.filter((tr) => {
      const matchCourse =
        !courseFilter || tr.coursesCreated.some((c) => c.id === courseFilter);
      const matchBatch =
        !batchFilter || tr.trainerBatches.some((tb) => tb.batch.id === batchFilter);
      return matchCourse && matchBatch;
    });
  }, [trainers, courseFilter, batchFilter]);

  // Handle Add Trainer Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add trainer");
      }

      showToast("success", `Faculty trainer ${formData.name} registered successfully!`);
      setIsAddModalOpen(false);
      resetForm();
      fetchTrainers();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create trainer");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Trainer Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/trainers/${editingTrainer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          avatarUrl: formData.avatarUrl,
          designation: formData.designation,
          bio: formData.bio,
          isActive: formData.isActive,
          password: formData.password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update trainer");
      }

      showToast("success", `Faculty trainer ${formData.name} updated successfully!`);
      setEditingTrainer(null);
      resetForm();
      fetchTrainers();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update trainer");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Assign Multiple Courses & Batches Submission
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTrainer) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/trainers/${assigningTrainer.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseIds: assignCourseIds,
          batchIds: assignBatchIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign courses/batches");
      }

      showToast("success", `Curriculum assignments updated for ${assigningTrainer.name}!`);
      setAssigningTrainer(null);
      fetchTrainers();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to assign courses and batches");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Active/Deactive Status
  const handleToggleStatus = async (trainer: Trainer) => {
    const newStatus = !trainer.isActive;
    try {
      const res = await fetch(`/api/admin/trainers/${trainer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change trainer status");
      }

      showToast(
        "success",
        `Faculty account ${newStatus ? "activated" : "deactivated"}!`
      );
      fetchTrainers();
    } catch (err: any) {
      showToast("error", err.message || "Failed to toggle status");
    }
  };

  // Handle Delete Trainer
  const handleDeleteConfirm = async () => {
    if (!deletingTrainer) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/trainers/${deletingTrainer.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete trainer");
      }

      showToast("success", `Trainer account purged successfully.`);
      setDeletingTrainer(null);
      fetchTrainers();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete trainer");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      password: "",
      phone: trainer.profile?.phone || "",
      avatarUrl: trainer.profile?.avatarUrl || "",
      designation: trainer.profile?.designation || "",
      bio: trainer.profile?.bio || "",
      isActive: trainer.isActive !== false,
      courseIds: trainer.coursesCreated.map((c) => c.id),
      batchIds: trainer.trainerBatches.map((tb) => tb.batch.id),
    });
  };

  const openAssignModal = (trainer: Trainer) => {
    setAssigningTrainer(trainer);
    setAssignCourseIds(trainer.coursesCreated.map((c) => c.id));
    setAssignBatchIds(trainer.trainerBatches.map((tb) => tb.batch.id));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      avatarUrl: "",
      designation: "",
      bio: "",
      isActive: true,
      courseIds: [],
      batchIds: [],
    });
  };

  // KPI Calculations
  const totalTrainers = trainers.length;
  const activeTrainers = trainers.filter((t) => t.isActive !== false).length;
  const deactivatedTrainers = totalTrainers - activeTrainers;
  const totalAssignedStudents = trainers.reduce(
    (sum, t) => sum + (t.totalStudentsCount || 0),
    0
  );

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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C248C] text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Faculty & Instructors
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Trainer Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Organize faculty members, assign courses & cohorts, monitor reach, and govern instructor access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "jvm-gradient-bg text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title="Table Roster View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "jvm-gradient-bg text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title="Faculty Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Trainer
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#1E2B88]" /> Total Faculty
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalTrainers}</span>
            <span className="text-[11px] font-mono text-slate-400">Registered</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Instructors
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{activeTrainers}</span>
            <span className="text-[11px] font-mono text-slate-400">Teaching</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5 text-rose-600" /> Deactivated
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{deactivatedTrainers}</span>
            <span className="text-[11px] font-mono text-slate-400">Suspended</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#7C248C]" /> Student Reach
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{totalAssignedStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Learners</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-purple-600 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Faculty Only</option>
              <option value="INACTIVE">Deactivated Faculty Only</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
            >
              <option value="">All Assigned Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
            >
              <option value="">All Cohort Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Trainer Roster Display */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Refreshing faculty roster & assignments...</p>
        </div>
      ) : filteredTrainers.length > 0 ? (
        viewMode === "table" ? (
          /* ================= TABLE ROSTER VIEW ================= */
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Faculty Trainer</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Assigned Curriculum</th>
                    <th className="p-4">Student Reach</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTrainers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/80 transition group">
                      {/* Trainer Avatar & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {tr.profile?.avatarUrl ? (
                            <img
                              src={tr.profile.avatarUrl}
                              alt={tr.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl jvm-gradient-bg flex items-center justify-center font-bold text-white shrink-0 shadow-2xs">
                              {tr.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/admin/trainers/${tr.id}`}
                              className="font-bold text-slate-900 hover:text-purple-700 transition flex items-center gap-1"
                            >
                              {tr.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {tr.id.slice(-6)} • Joined {formatDate(tr.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4 space-y-0.5 font-mono">
                        <div className="text-slate-800 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {tr.email}
                        </div>
                        {tr.profile?.phone && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {tr.profile.phone}
                          </div>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-[#7C248C] font-semibold text-[11px]">
                          {tr.profile?.designation || "Faculty Trainer"}
                        </span>
                      </td>

                      {/* Assigned Courses & Batches */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]">
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            {tr.coursesCreated.length} Courses
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold text-[11px]">
                            <Layers className="w-3 h-3 text-cyan-600" />
                            {tr.trainerBatches.length} Batches
                          </span>
                        </div>
                      </td>

                      {/* Student Reach */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Users className="w-3.5 h-3.5 text-[#7C248C]" />
                          <span>{tr.totalStudentsCount || 0} Learners</span>
                        </div>
                      </td>

                      {/* Status Toggle Pill */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(tr)}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition cursor-pointer ${
                            tr.isActive !== false
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
                          }`}
                        >
                          {tr.isActive !== false ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" /> Deactivated
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/trainers/${tr.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition"
                            title="Open Trainer Cockpit"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openAssignModal(tr)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition cursor-pointer"
                            title="Assign Courses & Batches"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(tr)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                            title="Edit Trainer Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingTrainer(tr)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                            title="Delete Trainer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================= GRID CARDS VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainers.map((tr) => (
              <div
                key={tr.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md hover:border-purple-200 transition group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(tr)}
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase transition cursor-pointer ${
                        tr.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      }`}
                      title="Click to toggle status"
                    >
                      {tr.isActive !== false ? "ACTIVE" : "DEACTIVATED"}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      Joined: {formatDate(tr.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {tr.profile?.avatarUrl ? (
                      <img
                        src={tr.profile.avatarUrl}
                        alt={tr.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2B88] to-[#7C248C] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                        {tr.name.charAt(0)}
                      </div>
                    )}

                    <div className="overflow-hidden min-w-0">
                      <Link
                        href={`/admin/trainers/${tr.id}`}
                        className="font-bold text-slate-900 text-base truncate group-hover:text-[#7C248C] transition block"
                      >
                        {tr.name}
                      </Link>
                      <p className="text-xs text-purple-700 font-semibold truncate">
                        {tr.profile?.designation || "Faculty Member"}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{tr.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Curriculum & Reach Summary */}
                  <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs pt-1">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">COURSES</span>
                      <strong className="text-slate-900 font-bold text-sm">{tr.coursesCreated.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">BATCHES</span>
                      <strong className="text-cyan-700 font-bold text-sm">{tr.trainerBatches.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">STUDENTS</span>
                      <strong className="text-[#7C248C] font-bold text-sm">{tr.totalStudentsCount || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/trainers/${tr.id}`}
                    className="flex-1 py-2 px-3 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs hover:shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Faculty Cockpit</span>
                  </Link>

                  <button
                    onClick={() => openAssignModal(tr)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition cursor-pointer"
                    title="Assign Courses & Batches"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openEditModal(tr)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingTrainer(tr)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                    title="Delete Trainer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No trainers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No faculty members matched your search criteria. Try adjusting filters or registering a new trainer.
          </p>
        </div>
      )}

      {/* ================= ADD / EDIT TRAINER MODAL ================= */}
      {(isAddModalOpen || editingTrainer) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C248C]" />
                  {editingTrainer ? "Edit Faculty Profile" : "Register New Faculty Trainer"}
                </h2>
                <p className="text-xs text-slate-500">Configure credentials, specialization, and access status</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTrainer(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingTrainer ? handleEditSubmit : handleAddSubmit}
              className="space-y-4 text-xs"
            >
              {/* Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Vikram Mehta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Specialization / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full-Stack Lead"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="trainer@institute.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {editingTrainer
                    ? "New Password (Leave blank to keep current)"
                    : "Temporary Password *"}
                </label>
                <input
                  type="password"
                  required={!editingTrainer}
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Avatar URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Bio / About */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bio / Qualifications</label>
                <textarea
                  rows={3}
                  placeholder="Experienced software architect with 8+ years teaching experience..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Account Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                <div>
                  <div className="font-bold text-slate-900">Account Status</div>
                  <div className="text-[10px] text-slate-500">Enable or disable faculty login access</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-[10px] font-mono transition border cursor-pointer ${
                    formData.isActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-rose-100 text-rose-800 border-rose-200"
                  }`}
                >
                  {formData.isActive ? "ACTIVE" : "DEACTIVATED"}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTrainer(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTrainer ? "Save Changes" : "Register Trainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN COURSES & BATCHES MODAL ================= */}
      {assigningTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#7C248C]" /> Assign Courses & Batches
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign multiple courses and cohorts to <strong className="text-slate-900">{assigningTrainer.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setAssigningTrainer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-6 text-xs">
              {/* Select Multiple Courses */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Assign Courses
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {assignCourseIds.length} Selected
                  </span>
                </label>

                <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  {courses.map((c) => {
                    const isChecked = assignCourseIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{c.title}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignCourseIds([...assignCourseIds, c.id]);
                            } else {
                              setAssignCourseIds(assignCourseIds.filter((id) => id !== c.id));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Select Multiple Batches */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600" /> Assign Cohort Batches
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {assignBatchIds.length} Selected
                  </span>
                </label>

                <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  {batches.map((b) => {
                    const isChecked = assignBatchIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-cyan-300 transition cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{b.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignBatchIds([...assignBatchIds, b.id]);
                            } else {
                              setAssignBatchIds(assignBatchIds.filter((id) => id !== b.id));
                            }
                          }}
                          className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTrainer(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl border border-rose-200 bg-white space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Faculty Account?</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible cascade purge</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete faculty member <strong className="text-slate-900">{deletingTrainer.name}</strong> ({deletingTrainer.email})?
              Their login access will be revoked, and course/batch trainer associations will be unlinked.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingTrainer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
