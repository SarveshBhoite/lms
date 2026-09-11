"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Filter,
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
  ShieldAlert,
  GraduationCap,
  Calendar,
  LayoutGrid,
  List,
  CheckSquare,
  HelpCircle,
  FileCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  enrollments: Array<{
    id: string;
    course: { id: string; title: string };
    batch?: { id: string; name: string } | null;
    enrolledAt: string;
  }>;
  studentBatches: Array<{
    batch: { id: string; name: string };
  }>;
  courseProgresses?: Array<{ progressPercent: number }>;
  quizAttempts?: Array<{ score: number }>;
  assignmentSubmissions?: Array<{
    feedback?: { marksAwarded: number } | null;
    assignment: { totalMarks: number };
  }>;
  attendances?: Array<{ status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" }>;
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

export default function StudentsClient({
  initialStudents,
  courses,
  batches,
}: {
  initialStudents: Student[];
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

  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    avatarUrl: "",
    isActive: true,
    courseId: "",
    batchId: "",
  });

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

  // Fetch / Refresh students from API with current filters
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      if (batchFilter) params.set("batchId", batchFilter);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, statusFilter, courseFilter, batchFilter]);

  // Handle Add Student Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add student");
      }

      showToast("success", `Student ${formData.name} created successfully!`);
      setIsAddModalOpen(false);
      resetForm();
      fetchStudents();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create student");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Student Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          avatarUrl: formData.avatarUrl,
          isActive: formData.isActive,
          password: formData.password || undefined,
          courseId: formData.courseId || undefined,
          batchId: formData.batchId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update student");
      }

      showToast("success", `Student ${formData.name} updated successfully!`);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update student");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Active/Deactive Status
  const handleToggleStatus = async (student: Student) => {
    const newStatus = !student.isActive;
    try {
      const res = await fetch(`/api/admin/students/${student.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change status");
      }

      showToast(
        "success",
        `Student account ${newStatus ? "activated" : "deactivated"}!`
      );
      fetchStudents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to toggle status");
    }
  };

  // Handle Delete Student
  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${deletingStudent.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete student");
      }

      showToast("success", `Student account and all linked records purged successfully.`);
      setDeletingStudent(null);
      fetchStudents();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete student");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: "",
      phone: student.profile?.phone || "",
      avatarUrl: student.profile?.avatarUrl || "",
      isActive: student.isActive,
      courseId: student.enrollments[0]?.course.id || "",
      batchId: student.enrollments[0]?.batch?.id || "",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      avatarUrl: "",
      isActive: true,
      courseId: "",
      batchId: "",
    });
  };

  // KPI calculations
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.isActive).length;
  const deactivatedStudents = totalStudents - activeStudents;
  const enrolledStudents = students.filter((s) => s.enrollments.length > 0).length;

  // Global Academic Metrics
  const avgAttendance = useMemo(() => {
    let totalLogs = 0;
    let presentLogs = 0;
    students.forEach((s) => {
      (s.attendances || []).forEach((a) => {
        totalLogs++;
        if (a.status === "PRESENT" || a.status === "LATE") {
          presentLogs++;
        }
      });
    });
    return totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;
  }, [students]);

  const avgQuizScore = useMemo(() => {
    let totalScore = 0;
    let totalAttempts = 0;
    students.forEach((s) => {
      (s.quizAttempts || []).forEach((q) => {
        totalScore += q.score;
        totalAttempts++;
      });
    });
    return totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  }, [students]);

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
            <Users className="w-3.5 h-3.5" /> Learner Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Search, filter, inspect performance dossiers, and manage student accounts across all JVM programs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle Switch */}
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
              title="Academic Cards Grid View"
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
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1E2B88]" /> Total Students
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Registered</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Portals
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{activeStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Granted</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5 text-rose-600" /> Deactivated
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{deactivatedStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Locked Out</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#7C248C]" /> Enrolled Programs
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{enrolledStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
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
              placeholder="Search student, email, phone..."
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
              <option value="ACTIVE">Active Accounts Only</option>
              <option value="INACTIVE">Deactivated Accounts Only</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Directory Display */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Refreshing student roster & academic records...</p>
        </div>
      ) : students.length > 0 ? (
        viewMode === "table" ? (
          /* ================= TABLE ROSTER VIEW ================= */
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Enrolled Course</th>
                    <th className="p-4">Cohort Batch</th>
                    <th className="p-4">Academic Metrics</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((st) => {
                    const assignedCourse = st.enrollments[0]?.course?.title || "Not Enrolled";
                    const assignedBatch =
                      st.enrollments[0]?.batch?.name ||
                      st.studentBatches[0]?.batch?.name ||
                      "Unassigned";

                    // Calculate individual metrics
                    const prog = st.courseProgresses?.[0];
                    const progressPercent = prog ? prog.progressPercent : 0;

                    const totalAtt = st.attendances?.length || 0;
                    const presentAtt = (st.attendances || []).filter(
                      (a) => a.status === "PRESENT" || a.status === "LATE"
                    ).length;
                    const attendancePercent = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0;

                    const quizAvg =
                      (st.quizAttempts?.length || 0) > 0
                        ? (st.quizAttempts || []).reduce((acc, q) => acc + q.score, 0) /
                          st.quizAttempts!.length
                        : 0;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition group">
                        {/* Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {st.profile?.avatarUrl ? (
                              <img
                                src={st.profile.avatarUrl}
                                alt={st.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl jvm-gradient-bg flex items-center justify-center font-bold text-white shrink-0 shadow-2xs">
                                {st.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/admin/students/${st.id}`}
                                className="font-bold text-slate-900 hover:text-purple-700 transition flex items-center gap-1"
                              >
                                {st.name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {st.id.slice(-6)} • Joined {formatDate(st.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="p-4 space-y-0.5 font-mono">
                          <div className="text-slate-800 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {st.email}
                          </div>
                          {st.profile?.phone && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" /> {st.profile.phone}
                            </div>
                          )}
                        </td>

                        {/* Course */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]">
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            {assignedCourse}
                          </span>
                        </td>

                        {/* Batch */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold text-[11px]">
                            <Layers className="w-3 h-3 text-cyan-600" />
                            {assignedBatch}
                          </span>
                        </td>

                        {/* Academic Metric Pills */}
                        <td className="p-4 font-mono text-[10px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold"
                              title="Curriculum Progress"
                            >
                              Prog: {progressPercent.toFixed(0)}%
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                              title="Attendance Percentage"
                            >
                              Att: {attendancePercent.toFixed(0)}%
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                              title="Quiz Average Score"
                            >
                              Quiz: {quizAvg.toFixed(0)}%
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStatus(st)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition cursor-pointer ${
                              st.isActive
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
                            }`}
                          >
                            {st.isActive ? (
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
                              href={`/admin/students/${st.id}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition"
                              title="Open Student Cockpit"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => openEditModal(st)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                              title="Edit Student Profile"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingStudent(st)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================= GRID CARDS VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((st) => {
              const prog = st.courseProgresses?.[0];
              const progressPercent = prog ? prog.progressPercent : 0;

              const totalAtt = st.attendances?.length || 0;
              const presentAtt = (st.attendances || []).filter(
                (a) => a.status === "PRESENT" || a.status === "LATE"
              ).length;
              const attendancePercent = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0;

              const quizAvg =
                (st.quizAttempts?.length || 0) > 0
                  ? (st.quizAttempts || []).reduce((acc, q) => acc + q.score, 0) /
                    st.quizAttempts!.length
                  : 0;

              const evaluatedSubs = (st.assignmentSubmissions || []).filter((sub) => sub.feedback);
              const assignmentAvg =
                evaluatedSubs.length > 0
                  ? evaluatedSubs.reduce(
                      (acc, sub) =>
                        acc +
                        ((sub.feedback?.marksAwarded || 0) / (sub.assignment?.totalMarks || 100)) * 100,
                      0
                    ) / evaluatedSubs.length
                  : 0;

              const batchNames = Array.from(
                new Set([
                  ...st.studentBatches.map((b) => b.batch.name),
                  ...st.enrollments.map((e) => e.batch?.name).filter(Boolean) as string[],
                ])
              );

              return (
                <div
                  key={st.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md hover:border-purple-200 transition group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase transition cursor-pointer ${
                          st.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        }`}
                        title="Click to toggle status"
                      >
                        {st.isActive ? "ACTIVE" : "DEACTIVATED"}
                      </button>
                      <span className="text-[10px] font-mono text-slate-400">
                        Joined: {formatDate(st.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      {st.profile?.avatarUrl ? (
                        <img
                          src={st.profile.avatarUrl}
                          alt={st.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2B88] to-[#7C248C] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                          {st.name.charAt(0)}
                        </div>
                      )}

                      <div className="overflow-hidden min-w-0">
                        <Link
                          href={`/admin/students/${st.id}`}
                          className="font-bold text-slate-900 text-base truncate group-hover:text-[#7C248C] transition block"
                        >
                          {st.name}
                        </Link>
                        <p className="text-xs text-slate-500 font-mono truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{st.email}</span>
                        </p>
                        {st.profile?.phone && (
                          <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{st.profile.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs font-mono">
                      <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                        <span>Course:</span>
                        <span className="text-slate-900 font-bold truncate max-w-[180px]">
                          {st.enrollments.map((e) => e.course.title).join(", ") || "No Enrollment"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                        <span>Cohort:</span>
                        <span className="text-[#7C248C] font-bold truncate max-w-[180px]">
                          {batchNames.join(", ") || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    {/* 4 Academic KPI Badges */}
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">PROGRESS</span>
                        <strong className="text-slate-900 font-bold">{progressPercent.toFixed(1)}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">ATTENDANCE</span>
                        <strong className="text-emerald-700 font-bold">{attendancePercent.toFixed(1)}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">QUIZ AVG</span>
                        <strong className="text-[#7C248C] font-bold">{quizAvg.toFixed(1)}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">ASSIGNMENTS</span>
                        <strong className="text-[#E01E6A] font-bold">{assignmentAvg.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/students/${st.id}`}
                      className="flex-1 py-2 px-3 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs hover:shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Cockpit Dossier</span>
                    </Link>

                    <button
                      onClick={() => openEditModal(st)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                      title="Edit Student"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingStudent(st)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No students found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No student accounts matched your search parameters. Try adjusting filters or adding a new student.
          </p>
        </div>
      )}

      {/* ================= ADD / EDIT STUDENT MODAL ================= */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C248C]" />
                  {editingStudent ? "Edit Student Profile" : "Register New Student"}
                </h2>
                <p className="text-xs text-slate-500">Configure credentials, enrolled program, and status</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingStudent ? handleEditSubmit : handleAddSubmit}
              className="space-y-4 text-xs"
            >
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
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
                  {editingStudent
                    ? "Password (leave blank to keep current)"
                    : "Temporary Password *"}
                </label>
                <input
                  type="password"
                  required={!editingStudent}
                  placeholder={editingStudent ? "••••••••" : "Minimum 6 characters"}
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

              {/* Course & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Course Program</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value, batchId: "" })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="">No Course Assigned</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Batch Assignment</label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="">No Initial Batch</option>
                    {batches
                      .filter((b) => !formData.courseId || b.courseId === formData.courseId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Account Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                <div>
                  <div className="font-bold text-slate-900">Account Status</div>
                  <div className="text-[10px] text-slate-500">Enable or disable student login access</div>
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
                    setEditingStudent(null);
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
                  {editingStudent ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingStudent && (
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
              Are you sure you want to permanently delete <strong className="text-slate-900">{deletingStudent.name}</strong> ({deletingStudent.email})?
              All enrolled course progress, quizzes, submissions, attendances, and certificates linked to this student will be completely erased.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
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
