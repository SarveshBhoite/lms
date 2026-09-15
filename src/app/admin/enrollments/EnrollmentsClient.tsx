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
  Award,
  Calendar,
  CheckSquare,
  Clock,
  ArrowRight,
  Filter,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  status: "ACTIVE" | "COMPLETED";
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
  certificate?: {
    id: string;
    certificateNumber: string;
    issueDate: string;
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
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

  // Single Form State - Enrollments always start as ACTIVE
  const [singleForm, setSingleForm] = useState({
    userId: students[0]?.id || "",
    courseId: courses[0]?.id || "",
    batchId: "",
  });
  const [singleStudentSearch, setSingleStudentSearch] = useState("");

  // Bulk Form State - Bulk enrollments always start as ACTIVE
  const [bulkForm, setBulkForm] = useState({
    courseId: courses[0]?.id || "",
    batchId: "",
    selectedStudentIds: [] as string[],
  });
  const [bulkStudentSearch, setBulkStudentSearch] = useState("");

  // Change Batch Form State
  const [changeBatchId, setChangeBatchId] = useState("");

  // Change Status Form State - Only 2 statuses: ACTIVE and COMPLETED
  const [changeStatus, setChangeStatus] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");

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

  // Single Student Enrollment Submit (Always ACTIVE)
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.userId) {
      showToast("error", "Please select a student");
      return;
    }
    if (!singleForm.courseId) {
      showToast("error", "Please select a course");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: singleForm.userId,
          courseId: singleForm.courseId,
          batchId: singleForm.batchId || null,
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to enroll student");

      showToast("success", "Student enrolled successfully with Active status!");
      setIsSingleModalOpen(false);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to enroll student");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Enrollment Submit (Always ACTIVE)
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkForm.selectedStudentIds.length === 0) {
      showToast("error", "Please select at least one student");
      return;
    }
    if (!bulkForm.courseId) {
      showToast("error", "Please select a course");
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
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed bulk enrollment");

      showToast(
        "success",
        data.message || `Successfully enrolled ${bulkForm.selectedStudentIds.length} students as Active!`
      );
      setIsBulkModalOpen(false);
      setBulkForm({
        courseId: courses[0]?.id || "",
        batchId: "",
        selectedStudentIds: [],
      });
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

      showToast("success", "Student cohort re-assigned successfully!");
      setEditingBatchEnrollment(null);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to change batch");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Status Submit - Automatically triggers certificate creation when COMPLETED
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

      showToast(
        "success",
        changeStatus === "COMPLETED"
          ? "Status marked as Completed & Certificate unlocked!"
          : "Status marked as Active in course"
      );
      setEditingStatusEnrollment(null);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete / Remove Enrollment Submit
  const handleDeleteConfirm = async () => {
    if (!deletingEnrollment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${deletingEnrollment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to remove enrollment");

      showToast("success", "Enrollment record removed successfully.");
      setDeletingEnrollment(null);
      fetchEnrollments();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to remove enrollment");
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
    // Force only ACTIVE or COMPLETED
    setChangeStatus(enr.status === "COMPLETED" ? "COMPLETED" : "ACTIVE");
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

  // Status Badge - Exactly 2 statuses supported
  const getStatusBadge = (status: "ACTIVE" | "COMPLETED") => {
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 shadow-xs">
          <Award className="w-3.5 h-3.5 text-[#7C248C]" /> Completed & Certified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active in Course
      </span>
    );
  };

  // Metrics
  const totalActive = enrollments.filter((e) => e.status === "ACTIVE").length;
  const totalCompleted = enrollments.filter((e) => e.status === "COMPLETED").length;
  const totalBatchesCount = new Set(enrollments.map((e) => e.batchId).filter(Boolean)).size;

  // Filtered students for single enroll modal
  const filteredSingleStudents = students.filter((s) => {
    const q = singleStudentSearch.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  // Filtered students for bulk enroll modal
  const filteredBulkStudents = students.filter((s) => {
    const q = bulkStudentSearch.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Notification */}
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

      {/* Header Banner - JVM Institute Studio Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Academic Enrollment Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-[#7C248C]" /> Student Enrollments 🎓
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Manage course admissions, allocate students to academic cohorts, track learning progress, and unlock verified completion certificates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => {
              setBulkStudentSearch("");
              setIsBulkModalOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100/80 text-[#7C248C] font-bold text-xs border border-purple-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Users className="w-4 h-4 text-[#7C248C]" /> Bulk Enroll
          </button>
          <button
            onClick={() => {
              setSingleStudentSearch("");
              setIsSingleModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Total Enrollments
          </div>
          <div className="text-2xl font-black text-slate-900">{enrollments.length}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">{courses.length} Registered Courses</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Active in Course
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalActive}</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">Active Learners</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#7C248C]" /> Completed & Certified
          </div>
          <div className="text-2xl font-black text-[#7C248C]">{totalCompleted}</div>
          <div className="text-[11px] font-mono text-purple-700 font-semibold">Certificates Unlocked</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-600" /> Cohort Distribution
          </div>
          <div className="text-2xl font-black text-cyan-700">{totalBatchesCount}</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">Allocated Batches</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student, email, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            />
          </div>

          {/* Status Filter - Only 2 statuses: ACTIVE or COMPLETED */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            >
              <option value="ALL">All Statuses (Active & Completed)</option>
              <option value="ACTIVE">Active in Course</option>
              <option value="COMPLETED">Completed & Certified</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setBatchFilter("");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            >
              <option value="">All Courses</option>
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
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
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading enrollment records...</p>
          </div>
        ) : enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Enrolled Course</th>
                  <th className="p-4">Cohort / Batch</th>
                  <th className="p-4">Course Progress</th>
                  <th className="p-4">Enrolled Date</th>
                  <th className="p-4">Status & Certificate</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-purple-50/20 transition-colors">
                    {/* Student */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {enr.user.profile?.avatarUrl ? (
                          <img
                            src={enr.user.profile.avatarUrl}
                            alt={enr.user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C248C] font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                            {enr.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/students/${enr.userId}`}
                            className="font-bold text-slate-900 hover:text-[#7C248C] transition"
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
                        className="font-semibold text-slate-900 hover:text-[#7C248C] transition line-clamp-1"
                      >
                        {enr.course.title}
                      </Link>
                      <span className="text-[10px] font-mono text-purple-700 font-medium">{enr.course.level}</span>
                    </td>

                    {/* Batch */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold text-[11px]">
                        <Layers className="w-3 h-3 text-cyan-600" />
                        {enr.batch?.name || "Self-Paced"}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="p-4 w-44">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>{enr.progress.completedLessonsCount}/{enr.progress.totalLessonsCount} Lessons</span>
                          <span className={enr.status === "COMPLETED" ? "text-purple-700 font-black" : "text-emerald-700 font-black"}>
                            {enr.progress.progressPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              enr.status === "COMPLETED"
                                ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                                : "bg-gradient-to-r from-emerald-400 to-teal-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(enr.status === "COMPLETED" ? 100 : 0, enr.progress.progressPercent))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {formatDate(enr.enrolledAt)}
                    </td>

                    {/* Status & Certificate */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(enr.status === "COMPLETED" ? "COMPLETED" : "ACTIVE")}</div>
                        {enr.status === "COMPLETED" && (
                          <div className="text-[10px] font-mono text-purple-700 flex items-center gap-1">
                            {enr.certificate ? (
                              <Link
                                href={`/verify/certificate/${enr.certificate.certificateNumber}`}
                                target="_blank"
                                className="hover:underline font-bold inline-flex items-center gap-1 text-[#7C248C]"
                                title="View Issued Certificate"
                              >
                                <span>{enr.certificate.certificateNumber}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            ) : (
                              <span className="text-slate-400 italic">Certificate Unlocked</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingEnrollment(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openChangeBatchModal(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 transition cursor-pointer"
                          title="Re-assign Cohort / Batch"
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openChangeStatusModal(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                          title="Edit Enrollment Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingEnrollment(enr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                          title="Remove Enrollment"
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
          <div className="p-16 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No enrollments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No enrollment records matched your search parameters. Click "Enroll Student" or "Bulk Enroll" to register learners.
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
                <Sparkles className="w-5 h-5 text-[#7C248C]" /> Enroll Student into Course
              </h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              {/* Select Student with quick search */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Select Student *</label>
                <div className="relative mb-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Type name or email to filter..."
                    value={singleStudentSearch}
                    onChange={(e) => setSingleStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                  />
                </div>
                <select
                  required
                  value={singleForm.userId}
                  onChange={(e) => setSingleForm({ ...singleForm, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  {filteredSingleStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Course */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Select Course *</label>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Batch (Filtered to course) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Assign Cohort / Batch (Optional)</label>
                <select
                  value={singleForm.batchId}
                  onChange={(e) => setSingleForm({ ...singleForm, batchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="">No Batch Assigned (Self-Paced Learner)</option>
                  {batches
                    .filter((b) => b.courseId === singleForm.courseId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Enrollment Status - Always Active */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">Enrollment Status</div>
                  <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active in Course
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full font-semibold">
                  Course In Progress
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
                <Users className="w-5 h-5 text-[#7C248C]" /> Bulk Student Enrollment
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              {/* Select Course */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Target Course *</label>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Batch */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Target Batch / Cohort (Optional)</label>
                <select
                  value={bulkForm.batchId}
                  onChange={(e) => setBulkForm({ ...bulkForm, batchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="">No Batch (Self-Paced)</option>
                  {batches
                    .filter((b) => b.courseId === bulkForm.courseId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Enrollment Status - Always Active */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">Enrollment Status</div>
                  <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active in Course
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full font-semibold">
                  Course In Progress
                </span>
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
                    className="text-[11px] font-bold text-[#7C248C] hover:underline cursor-pointer"
                  >
                    {bulkForm.selectedStudentIds.length === students.length
                      ? "Deselect All"
                      : "Select All Students"}
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search students in checklist..."
                    value={bulkStudentSearch}
                    onChange={(e) => setBulkStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {filteredBulkStudents.map((st) => {
                    const isSelected = bulkForm.selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleBulkStudentSelection(st.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs truncate">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{st.email}</div>
                        </div>
                        {isSelected && <CheckSquare className="w-4 h-4 text-[#7C248C] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bulk Enroll Students ({bulkForm.selectedStudentIds.length})
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
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600" /> Re-assign Cohort / Batch
              </h3>
              <button
                onClick={() => setEditingBatchEnrollment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangeBatchSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-600">
                  Student: <strong className="text-slate-900">{editingBatchEnrollment.user.name}</strong>
                </div>
                <div className="text-slate-600">
                  Course: <strong className="text-slate-900">{editingBatchEnrollment.course.title}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Select Cohort / Batch *</label>
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
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Batch Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Change Status Modal - Strictly 2 Statuses */}
      {editingStatusEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#7C248C]" /> Update Enrollment Status
              </h3>
              <button
                onClick={() => setEditingStatusEnrollment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangeStatusSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-600">
                  Student: <strong className="text-slate-900">{editingStatusEnrollment.user.name}</strong>
                </div>
                <div className="text-slate-600">
                  Course: <strong className="text-slate-900">{editingStatusEnrollment.course.title}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Select Status *</label>
                <div className="space-y-2">
                  <label
                    onClick={() => setChangeStatus("ACTIVE")}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition ${
                      changeStatus === "ACTIVE"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">Active in Course</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Student is actively enrolled and taking course lessons.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setChangeStatus("COMPLETED")}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition ${
                      changeStatus === "COMPLETED"
                        ? "bg-purple-50 border-purple-300 text-[#7C248C] ring-2 ring-purple-500/20"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#7C248C] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">Completed & Unlock Certificate</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Marks the course as completed for the student and automatically issues & unlocks their official certificate with verification QR code.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStatusEnrollment(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#7C248C]" /> Enrollment Overview
              </h3>
              <button
                onClick={() => setViewingEnrollment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
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
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C248C] font-black text-sm flex items-center justify-center border border-purple-200">
                      {viewingEnrollment.user.name.charAt(0).toUpperCase()}
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
                <p className="text-slate-500">
                  Level: {viewingEnrollment.course.level} • Duration: {viewingEnrollment.course.durationHours}h
                </p>
              </div>

              {/* Cohort info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Assigned Cohort / Batch</div>
                <h4 className="font-bold text-slate-900 text-sm">{viewingEnrollment.batch?.name || "Self-Paced Learner"}</h4>
                {viewingEnrollment.batch && (
                  <p className="text-slate-500 font-mono text-[11px]">
                    {formatDate(viewingEnrollment.batch.startDate)} – {formatDate(viewingEnrollment.batch.endDate)}
                  </p>
                )}
              </div>

              {/* Status & Certificate */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <div className="font-bold text-[#7C248C] uppercase text-[10px]">Status & Certification</div>
                <div className="flex items-center justify-between">
                  <span>Current Status:</span>
                  {getStatusBadge(viewingEnrollment.status === "COMPLETED" ? "COMPLETED" : "ACTIVE")}
                </div>
                {viewingEnrollment.status === "COMPLETED" && (
                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-slate-600">Certificate Status:</span>
                    {viewingEnrollment.certificate ? (
                      <Link
                        href={`/verify/certificate/${viewingEnrollment.certificate.certificateNumber}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C248C] hover:underline"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#7C248C]" />
                        <span>{viewingEnrollment.certificate.certificateNumber}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-purple-700">Unlocked</span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Learning Progress</div>
                <div className="flex justify-between items-center text-xs">
                  <span>Completed Lessons:</span>
                  <strong className="text-slate-900">
                    {viewingEnrollment.progress.completedLessonsCount} / {viewingEnrollment.progress.totalLessonsCount}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Progress Percentage:</span>
                  <strong className="text-purple-700 font-bold">
                    {viewingEnrollment.progress.progressPercent.toFixed(0)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setViewingEnrollment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
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
                <h3 className="text-base font-bold text-slate-900">Remove Student Enrollment?</h3>
                <p className="text-xs text-slate-500">Safety confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove enrollment for <strong className="text-slate-900">{deletingEnrollment.user.name}</strong> in <strong className="text-slate-900">{deletingEnrollment.course.title}</strong>?
              This removes the student's enrollment record from this course without deleting the student user account.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingEnrollment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Keep Enrolled
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
