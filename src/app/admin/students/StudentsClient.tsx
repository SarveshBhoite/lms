"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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

      showToast("success", `Student account deleted.`);
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
      isActive: student.isActive !== false,
      courseId: student.enrollments[0]?.course.id || "",
      batchId: student.enrollments[0]?.batch?.id || student.studentBatches[0]?.batch?.id || "",
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C248C] text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Student Roster
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Student Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Search, filter, enroll, update, and manage student accounts across all programs.
          </p>
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

      {/* Search & Filters Bar */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 transition"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 transition"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 transition"
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

      {/* Student List Roster */}
      <div className="glass-panel rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading student roster...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Assigned Course</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Registered Date</th>
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

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition group">
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {st.profile?.avatarUrl ? (
                            <img
                              src={st.profile.avatarUrl}
                              alt={st.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/admin/students/${st.id}`}
                              className="font-bold text-slate-900 hover:text-rose-600 transition"
                            >
                              {st.name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="p-4 space-y-0.5">
                        <div className="font-mono text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {st.email}
                        </div>
                        {st.profile?.phone && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
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

                      {/* Enrollment/Registration Date */}
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {new Date(st.createdAt).toLocaleDateString()}
                      </td>

                      {/* Account Status Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            st.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {st.isActive !== false ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" /> Deactivated
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/students/${st.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="View Detailed Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openEditModal(st)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(st)}
                            className={`p-1.5 rounded-lg transition ${
                              st.isActive !== false
                                ? "bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-700"
                                : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700"
                            }`}
                            title={st.isActive !== false ? "Deactivate Account" : "Activate Account"}
                          >
                            {st.isActive !== false ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setDeletingStudent(st)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
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
        ) : (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No students found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No student accounts matched your search parameters. Try clearing filters or adding a new student.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                {editingStudent ? "Edit Student Profile" : "Register New Student"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@institute.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {editingStudent ? "New Password (Leave blank to keep existing)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editingStudent}
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Course & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Course Assignment</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="">No Initial Course</option>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
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
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">Account Status</div>
                  <div className="text-[10px] text-slate-500">Enable or disable student login access</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-3.5 py-1 rounded-full font-bold text-[10px] transition ${
                    formData.isActive
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-rose-100 text-rose-700 border border-rose-200"
                  }`}
                >
                  {formData.isActive ? "ACTIVE" : "DEACTIVATED"}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingStudent ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-rose-200 bg-white space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Account?</h3>
                <p className="text-xs text-slate-500">Permanent action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deletingStudent.name}</strong> ({deletingStudent.email})?
              Deleting an account removes access permanently.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold"
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
