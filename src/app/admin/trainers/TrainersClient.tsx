"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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
        throw new Error(data.error || "Failed to create trainer");
      }

      showToast("success", `Trainer ${formData.name} created successfully!`);
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

      showToast("success", `Trainer ${formData.name} updated successfully!`);
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

      showToast("success", `Assigned multiple courses and batches to ${assigningTrainer.name}!`);
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
        `Trainer account ${newStatus ? "activated" : "deactivated"}!`
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

      showToast("success", `Trainer account deleted.`);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Faculty & Instructors
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Trainer Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage faculty members, assign multiple courses & cohorts, track total students, and update accounts.
          </p>
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

      {/* Search & Filters Bar */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 transition"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Trainers</option>
              <option value="INACTIVE">Deactivated Trainers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trainer Roster Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading trainer roster...</p>
          </div>
        ) : trainers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-4">Trainer</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Assigned Courses</th>
                  <th className="p-4">Assigned Batches</th>
                  <th className="p-4">Total Students</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {trainers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 transition group">
                    {/* Name & Photo */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {tr.profile?.avatarUrl ? (
                          <img
                            src={tr.profile.avatarUrl}
                            alt={tr.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                            {tr.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/trainers/${tr.id}`}
                            className="font-bold text-slate-900 hover:text-amber-600 transition"
                          >
                            {tr.name}
                          </Link>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {tr.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Specialization / Designation */}
                    <td className="p-4 font-semibold text-slate-800">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                        {tr.profile?.designation || "Faculty Trainer"}
                      </span>
                    </td>

                    {/* Assigned Courses */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-bold text-[11px]">
                        <BookOpen className="w-3 h-3 text-violet-600" />
                        {tr.coursesCreated.length} Courses
                      </span>
                    </td>

                    {/* Assigned Batches */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold text-[11px]">
                        <Layers className="w-3 h-3 text-cyan-600" />
                        {tr.trainerBatches.length} Batches
                      </span>
                    </td>

                    {/* Total Students */}
                    <td className="p-4 font-mono font-bold text-indigo-700">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        {tr.totalStudentsCount || 0}
                      </div>
                    </td>

                    {/* Account Status Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tr.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
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
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/trainers/${tr.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="View Trainer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => openAssignModal(tr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-600 text-slate-700 transition"
                          title="Assign Multiple Courses & Batches"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(tr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-700 transition"
                          title="Edit Trainer Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(tr)}
                          className={`p-1.5 rounded-lg transition ${
                            tr.isActive !== false
                              ? "bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-700"
                              : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700"
                          }`}
                          title={tr.isActive !== false ? "Deactivate Account" : "Activate Account"}
                        >
                          {tr.isActive !== false ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => setDeletingTrainer(tr)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
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
        ) : (
          <div className="p-12 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No trainers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No faculty members matched your search criteria. Try clearing filters or adding a new trainer.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Trainer Modal */}
      {(isAddModalOpen || editingTrainer) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                {editingTrainer ? "Edit Trainer Profile" : "Register New Trainer"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTrainer(null);
                }}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Specialization / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full-Stack Lead"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {editingTrainer ? "New Password (Leave blank to keep existing)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editingTrainer}
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Bio / About */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bio / Qualifications</label>
                <textarea
                  rows={3}
                  placeholder="Experienced software architect with 8+ years teaching full-stack Engineering..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Account Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">Account Status</div>
                  <div className="text-[10px] text-slate-500 font-medium">Enable or disable trainer login access</div>
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
                    setEditingTrainer(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTrainer ? "Save Changes" : "Register Trainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Multiple Courses & Batches Modal */}
      {assigningTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-indigo-600" /> Assign Courses & Batches
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign multiple courses and cohorts to <strong className="text-slate-900">{assigningTrainer.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setAssigningTrainer(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-6 text-xs">
              {/* Select Multiple Courses */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-violet-600" /> Assign Multiple Courses
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {assignCourseIds.length} Selected
                  </span>
                </label>

                <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  {courses.map((c) => {
                    const isChecked = assignCourseIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-violet-300 transition cursor-pointer"
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
                          className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
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
                    <Layers className="w-4 h-4 text-cyan-600" /> Assign Multiple Batches / Cohorts
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {assignBatchIds.length} Selected
                  </span>
                </label>

                <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  {batches.map((b) => {
                    const isChecked = assignBatchIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-cyan-300 transition cursor-pointer"
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
                          className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
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
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-rose-200 bg-white space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Trainer Account?</h3>
                <p className="text-xs text-slate-500">Permanent action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deletingTrainer.name}</strong> ({deletingTrainer.email})?
              Deleting an account removes access permanently.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingTrainer(null)}
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
