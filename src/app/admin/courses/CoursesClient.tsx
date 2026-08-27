"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Users,
  Layers,
  Sparkles,
  UserCheck,
  Globe,
  Lock,
  Archive,
  BarChart2,
  GraduationCap,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  objectives: string[];
  durationHours: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  prerequisites: string[];
  trainerId: string;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  trainer: {
    id: string;
    name: string;
    email: string;
    profile?: { avatarUrl?: string | null; designation?: string | null } | null;
  };
  totalModules: number;
  totalLessons: number;
  totalStudents: number;
  totalBatches: number;
}

interface TrainerOption {
  id: string;
  name: string;
  email: string;
  role: string;
  profile?: { designation?: string | null; avatarUrl?: string | null } | null;
}

export default function CoursesClient({
  initialCourses,
  trainers,
}: {
  initialCourses: CourseItem[];
  trainers: TrainerOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    title: "",
    thumbnailUrl: "",
    description: "",
    durationHours: 10,
    level: "BEGINNER" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS",
    trainerId: trainers[0]?.id || "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED",
    objectivesText: "",
    prerequisitesText: "",
  });
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (5MB max)
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image size exceeds 5MB limit.");
      return;
    }

    setUploadLoading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload image to Cloudinary");
      }

      setFormData((prev) => ({ ...prev, thumbnailUrl: json.url }));
      showToast("success", "Thumbnail uploaded to Cloudinary successfully!");
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to upload image");
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (levelFilter !== "ALL") params.set("level", levelFilter);
      if (trainerFilter) params.set("trainerId", trainerFilter);

      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, statusFilter, levelFilter, trainerFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const objectives = formData.objectivesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const prerequisites = formData.prerequisitesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          thumbnailUrl: formData.thumbnailUrl || null,
          description: formData.description,
          durationHours: Number(formData.durationHours),
          level: formData.level,
          trainerId: formData.trainerId,
          status: formData.status,
          objectives,
          prerequisites,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create course");
      }

      showToast("success", `Course "${formData.title}" created successfully!`);
      setIsAddModalOpen(false);
      resetForm();
      fetchCourses();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setActionLoading(true);
    try {
      const objectives = formData.objectivesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const prerequisites = formData.prerequisitesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          thumbnailUrl: formData.thumbnailUrl || null,
          description: formData.description,
          durationHours: Number(formData.durationHours),
          level: formData.level,
          trainerId: formData.trainerId,
          status: formData.status,
          objectives,
          prerequisites,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update course");
      }

      showToast("success", `Course "${formData.title}" updated successfully!`);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async (course: CourseItem, newStatus: "DRAFT" | "PUBLISHED" | "UNPUBLISHED") => {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update course status");
      }

      showToast("success", `Course status changed to ${newStatus}`);
      fetchCourses();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${deletingCourse.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete course");
      }

      showToast("success", `Course "${deletingCourse.title}" deleted.`);
      setDeletingCourse(null);
      fetchCourses();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete course");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (course: CourseItem) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      thumbnailUrl: course.thumbnailUrl || "",
      description: course.description,
      durationHours: course.durationHours,
      level: course.level,
      trainerId: course.trainerId,
      status: course.status,
      objectivesText: course.objectives.join("\n"),
      prerequisitesText: course.prerequisites.join("\n"),
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      thumbnailUrl: "",
      description: "",
      durationHours: 10,
      level: "BEGINNER",
      trainerId: trainers[0]?.id || "",
      status: "DRAFT",
      objectivesText: "",
      prerequisitesText: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Globe className="w-3 h-3 text-emerald-600" /> Published
          </span>
        );
      case "UNPUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Lock className="w-3 h-3 text-amber-600" /> Unpublished
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
            <Archive className="w-3 h-3 text-slate-500" /> Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Draft
          </span>
        );
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Beginner</span>;
      case "INTERMEDIATE":
        return <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">Intermediate</span>;
      case "ADVANCED":
        return <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Advanced</span>;
      default:
        return <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">All Levels</span>;
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C248C] text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Academic Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Course Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, manage, assign trainers, build modules, and publish course content.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Total Courses
          </div>
          <div className="text-2xl font-black text-slate-900">{courses.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600" /> Published
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {courses.filter((c) => c.status === "PUBLISHED").length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Draft / Unpublished
          </div>
          <div className="text-2xl font-black text-amber-600">
            {courses.filter((c) => c.status === "DRAFT" || c.status === "UNPUBLISHED").length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Enrolled Students
          </div>
          <div className="text-2xl font-black text-slate-900">
            {courses.reduce((sum, c) => sum + c.totalStudents, 0)}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by course title, keywords..."
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
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="UNPUBLISHED">Unpublished</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Skill Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="ALL_LEVELS">All Levels</option>
            </select>
          </div>

          {/* Trainer Filter */}
          <div>
            <select
              value={trainerFilter}
              onChange={(e) => setTrainerFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="">All Trainers</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle Bar */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-500">
            Showing <strong className="text-slate-900">{courses.length}</strong> courses
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Courses Display */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading course catalog...</p>
        </div>
      ) : courses.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                {/* Thumbnail Header */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  {c.thumbnailUrl ? (
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-indigo-900 via-slate-900 to-rose-950 p-6 flex flex-col justify-between">
                      <BookOpen className="w-8 h-8 text-white/40" />
                      <div className="text-xs font-mono text-white/60 uppercase tracking-widest">
                        LMS Course
                      </div>
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 left-3">{getStatusBadge(c.status)}</div>

                  {/* Level Badge */}
                  <div className="absolute top-3 right-3">{getLevelBadge(c.level)}</div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="text-base font-bold text-slate-900 hover:text-rose-600 transition line-clamp-1"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* Course Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{c.durationHours}h Duration</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{c.totalModules} Modules</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{c.totalStudents} Students</span>
                    </div>
                  </div>

                  {/* Trainer Info */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5">
                      {c.trainer.profile?.avatarUrl ? (
                        <img
                          src={c.trainer.profile.avatarUrl}
                          alt={c.trainer.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {c.trainer.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {c.trainer.name}
                        </div>
                        <div className="text-[10px] text-slate-400">Assigned Trainer</div>
                      </div>
                    </div>

                    {/* Quick Status Toggle */}
                    {c.status === "PUBLISHED" ? (
                      <button
                        onClick={() => handleStatusToggle(c, "UNPUBLISHED")}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 transition"
                        title="Unpublish course"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusToggle(c, "PUBLISHED")}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition"
                        title="Publish course"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/courses/${c.id}`}
                    className="flex-1 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Manage & Content
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      title="Edit Course Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCourse(c)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Assigned Trainer</th>
                    <th className="p-4">Duration & Level</th>
                    <th className="p-4">Modules / Lessons</th>
                    <th className="p-4">Students</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {c.thumbnailUrl ? (
                            <img
                              src={c.thumbnailUrl}
                              alt={c.title}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/admin/courses/${c.id}`}
                              className="font-bold text-slate-900 hover:text-rose-600 transition line-clamp-1"
                            >
                              {c.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /{c.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-medium text-slate-800">
                        {c.trainer.name}
                      </td>

                      <td className="p-4 space-y-1">
                        <div className="font-semibold text-slate-800">
                          {c.durationHours} Hours
                        </div>
                        <div>{getLevelBadge(c.level)}</div>
                      </td>

                      <td className="p-4 font-mono text-slate-600">
                        {c.totalModules} modules ({c.totalLessons} lessons)
                      </td>

                      <td className="p-4 font-semibold text-indigo-600">
                        {c.totalStudents} Students
                      </td>

                      <td className="p-4">{getStatusBadge(c.status)}</td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/courses/${c.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Manage Course"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingCourse(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                            title="Delete Course"
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
        )
      ) : (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No courses found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No courses matched your current filter criteria. Create a new course to get started.
          </p>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {(isAddModalOpen || editingCourse) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                {editingCourse ? "Edit Course Information" : "Create New Course"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCourse(null);
                }}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingCourse ? handleEditSubmit : handleCreateSubmit}
              className="space-y-4 text-xs"
            >
              {/* Course Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Full-Stack Web Development"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Thumbnail Image Upload (Cloudinary) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Course Thumbnail *</span>
                  <span className="text-[10px] text-slate-400 font-mono">PNG, JPG, WEBP (Max 5MB)</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {formData.thumbnailUrl ? (
                    <div className="relative w-28 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 group">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Course Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnailUrl: "" })}
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-[10px] font-bold"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded-2xl border-2 border-dashed border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon className="w-6 h-6 stroke-1" />
                      <span className="text-[9px] mt-0.5">No image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-white text-slate-700 font-bold text-xs cursor-pointer transition shadow-xs hover:bg-purple-50/50">
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 text-[#7C248C] animate-spin" />
                          <span>Uploading to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#7C248C]" />
                          <span>Upload Image from Device</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadLoading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="relative">
                      <input
                        type="url"
                        placeholder="Or paste image URL directly..."
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[11px] focus:outline-none focus:border-[#7C248C]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trainer & Level & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Trainer *</label>
                  <select
                    required
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Difficulty Level *</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="ALL_LEVELS">All Levels</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Duration (Hours) *</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={formData.durationHours}
                    onChange={(e) =>
                      setFormData({ ...formData, durationHours: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Course Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="DRAFT">Draft (Invisible to students)</option>
                  <option value="PUBLISHED">Published (Available for enrollment)</option>
                  <option value="UNPUBLISHED">Unpublished (Hidden)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Comprehensive description of what the course covers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Objectives (Line separated) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Course Learning Objectives (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Understand Next.js App Router&#10;Master Prisma ORM queries&#10;Build production APIs"
                  value={formData.objectivesText}
                  onChange={(e) =>
                    setFormData({ ...formData, objectivesText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              {/* Prerequisites (Line separated) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Prerequisites (One per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Basic JavaScript knowledge&#10;HTML & CSS familiarity"
                  value={formData.prerequisitesText}
                  onChange={(e) =>
                    setFormData({ ...formData, prerequisitesText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCourse(null);
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
                  {editingCourse ? "Save Course Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Course?</h3>
                <p className="text-xs text-slate-500">Permanent deletion confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete course <strong className="text-slate-900">{deletingCourse.title}</strong>?
              This will remove all associated modules, lessons, and resources.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingCourse(null)}
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
