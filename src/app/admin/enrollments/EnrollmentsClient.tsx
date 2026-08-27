"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Layers,
  Sparkles,
  UserCheck,
  UserX,
  Calendar,
  CheckSquare,
  Clock,
  ArrowRight,
  Filter,
  BarChart2,
} from "lucide-react";

interface StudentOption {
  id: string;
  name: string;
  email: string;
  profile?: { phone?: string | null; avatarUrl?: string | null } | null;
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
  status: string;
}

interface EnrollmentItem {
  id: string;
  userId: string;
  courseId: string;
  batchId?: string | null;
  enrolledAt: string;
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED" | "CANCELLED";
  completedAt?: string | null;
  user: StudentOption;
  course: {
    id: string;
    title: string;
    slug: string;
    level: string;
    durationHours: number;
    thumbnailUrl?: string | null;
  };
  batch?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  progress: {
    completedLessonsCount: number;
    totalLessonsCount: number;
    progressPercent: number;
    isCompleted: boolean;
  };
}

export default function EnrollmentsClient({
  initialEnrollments,
  courses,
  batches,
  students,
}: {
  initialEnrollments: EnrollmentItem[];
  courses: CourseOption[];
  batches: BatchOption[];
  students: StudentOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>(initialEnrollments);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [viewingEnrollment, setViewingEnrollment] = useState<EnrollmentItem | null>(null);
  const [editingBatchEnrollment, setEditingBatchEnrollment] = useState<EnrollmentItem | null>(null);
  const [editingStatusEnrollment, setEditingStatusEnrollment] = useState<EnrollmentItem | null>(null);
  const [deletingEnrollment, setDeletingEnrollment] = useState<EnrollmentItem | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Single Form State
  const [singleForm, setSingleForm] = useState({
    userId: students[0]?.id || "",
    courseId: courses[0]?.id || "",
    batchId: "",
    status: "ACTIVE" as "ACTIVE" | "COMPLETED" | "SUSPENDED" | "CANCELLED",
  });

  // Bulk Form State
  const [bulkForm, setBulkForm] = useState({
    courseId: courses[0]?.id || "",
    batchId: "",
    selectedStudentIds: [] as string[],
    status: "ACTIVE" as "ACTIVE" | "COMPLETED" | "SUSPENDED" | "CANCELLED",
  });

  // Change Batch Form State
  const [changeBatchId, setChangeBatchId] = useState("");

  // Change Status Form State
  const [changeStatus, setChangeStatus] = useState<"ACTIVE" | "COMPLETED" | "SUSPENDED" | "CANCELLED">("ACTIVE");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsSingleModalOpen(true);
    }
  }, [searchParams]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      if (batchFilter) params.set("batchId", batchFilter);

      const res = await fetch(`/api/admin/enrollments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [searchQuery, statusFilter, courseFilter, batchFilter]);

  // Single Student Enrollment Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: singleForm.userId,
          courseId: singleForm.courseId,
          batchId: singleForm.batchId || null,
          status: singleForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to enroll student");

      showToast("success", "Student enrolled successfully!");
      setIsSingleModalOpen(false);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to enroll student");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Enrollment Submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkForm.selectedStudentIds.length === 0) {
      showToast("error", "Please select at least one student");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: bulkForm.courseId,
          batchId: bulkForm.batchId || null,
          studentIds: bulkForm.selectedStudentIds,
          status: bulkForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed bulk enrollment");

      showToast("success", data.message || `Bulk enrollment complete!`);
      setIsBulkModalOpen(false);
      setBulkForm({ courseId: courses[0]?.id || "", batchId: "", selectedStudentIds: [], status: "ACTIVE" });
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed bulk enrollment");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Batch Submit
  const handleChangeBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatchEnrollment) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${editingBatchEnrollment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: changeBatchId || null }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to change batch");

      showToast("success", "Student batch re-assigned successfully!");
      setEditingBatchEnrollment(null);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to change batch");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Status Submit
  const handleChangeStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatusEnrollment) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${editingStatusEnrollment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: changeStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update status");

      showToast("success", `Enrollment status updated to ${changeStatus}`);
      setEditingStatusEnrollment(null);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete / Cancel Enrollment Submit
  const handleDeleteConfirm = async () => {
    if (!deletingEnrollment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${deletingEnrollment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to cancel enrollment");

      showToast("success", "Enrollment record removed.");
      setDeletingEnrollment(null);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to cancel enrollment");
    } finally {
      setActionLoading(false);
    }
  };

  const openChangeBatchModal = (enr: EnrollmentItem) => {
    setEditingBatchEnrollment(enr);
    setChangeBatchId(enr.batchId || "");
  };

  const openChangeStatusModal = (enr: EnrollmentItem) => {
    setEditingStatusEnrollment(enr);
    setChangeStatus(enr.status);
  };

  const toggleBulkStudentSelection = (studentId: string) => {
    setBulkForm((prev) => {
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
      case "ACTIVE":
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case "COMPLETED":
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Completed</span>;
      case "SUSPENDED":
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Suspended</span>;
      default:
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Enrollment Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Enrollment Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enroll individual or bulk students, allocate cohorts, update statuses, and monitor learning progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs border border-purple-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" /> Bulk Enroll
          </button>
          <button
            onClick={() => setIsSingleModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Total Enrollments
          </div>
          <div className="text-2xl font-black text-slate-900">{enrollments.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Active Students
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {enrollments.filter((e) => e.status === "ACTIVE").length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Course Completed
          </div>
          <div className="text-2xl font-black text-cyan-600">
            {enrollments.filter((e) => e.status === "COMPLETED").length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Suspended / Cancelled
          </div>
          <div className="text-2xl font-black text-amber-600">
            {enrollments.filter((e) => e.status === "SUSPENDED" || e.status === "CANCELLED").length}
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student, email, course..."
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
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setBatchFilter("");
              }}
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

          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="">All Cohorts / Batches</option>
              {batches
                .filter((b) => !courseFilter || b.courseId === courseFilter)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading enrollment records...</p>
          </div>
        ) : enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Enrolled Course</th>
                  <th className="p-4">Cohort / Batch</th>
                  <th className="p-4">Course Progress</th>
                  <th className="p-4">Enrolled Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/80 transition">
                    {/* Student */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {enr.user.profile?.avatarUrl ? (
                          <img
                            src={enr.user.profile.avatarUrl}
                            alt={enr.user.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                            {enr.user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/students/${enr.userId}`}
                            className="font-bold text-slate-900 hover:text-rose-600 transition"
                          >
                            {enr.user.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono">{enr.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="p-4">
                      <Link
                        href={`/admin/courses/${enr.courseId}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition line-clamp-1"
                      >
                        {enr.course.title}
                      </Link>
                      <span className="text-[10px] text-slate-400">{enr.course.level}</span>
                    </td>

                    {/* Batch */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold text-[11px]">
                        <Layers className="w-3 h-3 text-cyan-600" />
                        {enr.batch?.name || "Self-Paced"}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="p-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>{enr.progress.completedLessonsCount}/{enr.progress.totalLessonsCount} Lessons</span>
                          <span className="text-indigo-600">{enr.progress.progressPercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, enr.progress.progressPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {new Date(enr.enrolledAt).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="p-4">{getStatusBadge(enr.status)}</td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingEnrollment(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openChangeBatchModal(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700"
                          title="Change Batch / Cohort"
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openChangeStatusModal(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700"
                          title="Update Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingEnrollment(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                          title="Cancel Enrollment"
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
        ) : (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No enrollments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No enrollment records matched your search parameters. Click "Enroll Student" or "Bulk Enroll" to register students.
            </p>
          </div>
        )}
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Single Student Enrollment Modal */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" /> Enroll Single Student
              </h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              {/* Select Student */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Student *</label>
                <select
                  required
                  value={singleForm.userId}
                  onChange={(e) => setSingleForm({ ...singleForm, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Course */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Course *</label>
                <select
                  required
                  value={singleForm.courseId}
                  onChange={(e) =>
                    setSingleForm({
                      ...singleForm,
                      courseId: e.target.value,
                      batchId: "", // reset batch selection
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Batch (Filtered to course) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Batch Cohort (Optional)</label>
                <select
                  value={singleForm.batchId}
                  onChange={(e) => setSingleForm({ ...singleForm, batchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="">No Specific Batch (Self-Paced)</option>
                  {batches
                    .filter((b) => b.courseId === singleForm.courseId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Initial Enrollment Status *</label>
                <select
                  value={singleForm.status}
                  onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Bulk Enrollment Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Bulk Student Enrollment
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              {/* Select Course */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Course *</label>
                <select
                  required
                  value={bulkForm.courseId}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      courseId: e.target.value,
                      batchId: "",
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Batch */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Batch Cohort (Optional)</label>
                <select
                  value={bulkForm.batchId}
                  onChange={(e) => setBulkForm({ ...bulkForm, batchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Batch (Self-Paced)</option>
                  {batches
                    .filter((b) => b.courseId === bulkForm.courseId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Select Students Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    Select Students ({bulkForm.selectedStudentIds.length} selected) *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkForm({
                        ...bulkForm,
                        selectedStudentIds:
                          bulkForm.selectedStudentIds.length === students.length
                            ? []
                            : students.map((s) => s.id),
                      })
                    }
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    {bulkForm.selectedStudentIds.length === students.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {students.map((st) => {
                    const isSelected = bulkForm.selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleBulkStudentSelection(st.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <div className="text-xs">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.email}</div>
                        </div>
                        {isSelected && <CheckSquare className="w-4 h-4 text-indigo-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bulk Enroll Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Change Batch Modal */}
      {editingBatchEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Re-assign Cohort / Batch</h3>
              <button
                onClick={() => setEditingBatchEnrollment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangeBatchSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-slate-600">
                  Student: <strong className="text-slate-900">{editingBatchEnrollment.user.name}</strong>
                </div>
                <div className="text-slate-600">
                  Course: <strong className="text-slate-900">{editingBatchEnrollment.course.title}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select New Batch *</label>
                <select
                  value={changeBatchId}
                  onChange={(e) => setChangeBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">No Batch (Self-Paced)</option>
                  {batches
                    .filter((b) => b.courseId === editingBatchEnrollment.courseId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBatchEnrollment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Batch Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Change Status Modal */}
      {editingStatusEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Update Enrollment Status</h3>
              <button
                onClick={() => setEditingStatusEnrollment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangeStatusSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-slate-600">
                  Student: <strong className="text-slate-900">{editingStatusEnrollment.user.name}</strong>
                </div>
                <div className="text-slate-600">
                  Course: <strong className="text-slate-900">{editingStatusEnrollment.course.title}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Status *</label>
                <select
                  value={changeStatus}
                  onChange={(e) => setChangeStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStatusEnrollment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. View Enrollment Details Modal */}
      {viewingEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Enrollment Details</h3>
              <button
                onClick={() => setViewingEnrollment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Student info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Student Information</div>
                <div className="flex items-center gap-3">
                  {viewingEnrollment.user.profile?.avatarUrl ? (
                    <img
                      src={viewingEnrollment.user.profile.avatarUrl}
                      alt={viewingEnrollment.user.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                      {viewingEnrollment.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{viewingEnrollment.user.name}</h4>
                    <p className="text-slate-500 font-mono">{viewingEnrollment.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Course info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Enrolled Course</div>
                <h4 className="font-bold text-slate-900 text-sm">{viewingEnrollment.course.title}</h4>
                <p className="text-slate-500">Level: {viewingEnrollment.course.level} • Duration: {viewingEnrollment.course.durationHours}h</p>
              </div>

              {/* Batch info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Assigned Cohort</div>
                <h4 className="font-bold text-slate-900 text-sm">{viewingEnrollment.batch?.name || "Self-Paced"}</h4>
                {viewingEnrollment.batch && (
                  <p className="text-slate-500 font-mono text-[11px]">
                    {new Date(viewingEnrollment.batch.startDate).toLocaleDateString()} – {new Date(viewingEnrollment.batch.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Progress info */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="font-bold text-indigo-900 uppercase text-[10px]">Learning Progress</div>
                <div className="flex justify-between items-center text-xs">
                  <span>Completed Lessons:</span>
                  <strong className="text-indigo-900">
                    {viewingEnrollment.progress.completedLessonsCount} / {viewingEnrollment.progress.totalLessonsCount}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Progress Percentage:</span>
                  <strong className="text-indigo-900">
                    {viewingEnrollment.progress.progressPercent.toFixed(0)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setViewingEnrollment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Cancel / Remove Enrollment Modal */}
      {deletingEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Student Enrollment?</h3>
                <p className="text-xs text-slate-500">Safety confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel enrollment for <strong className="text-slate-900">{deletingEnrollment.user.name}</strong> in <strong className="text-slate-900">{deletingEnrollment.course.title}</strong>?
              This will remove the enrollment record without deleting the student's account or historical learning data.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingEnrollment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Keep Enrolled
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
