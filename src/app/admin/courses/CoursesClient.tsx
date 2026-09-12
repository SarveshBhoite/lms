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
  BarChart2,
  GraduationCap,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
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
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "UNPUBLISHED",
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

  // Summary Metrics
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === "PUBLISHED").length;
  const draftOrUnpublishedCourses = courses.filter((c) => c.status === "DRAFT" || c.status === "UNPUBLISHED").length;
  const totalLearners = courses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalCurriculumModules = courses.reduce((sum, c) => sum + c.totalModules, 0);
  const totalCurriculumLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto pb-16">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
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

      {/* Header Banner - JVM Institute Studio Standard */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Curriculum Command
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Course Management & Catalog 📚
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {totalCourses} Courses • {totalCurriculumModules} Chapters • {totalCurriculumLessons} Lessons • {totalLearners} Active Learners
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          {/* View Mode Switcher */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "jvm-gradient-bg text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "jvm-gradient-bg text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title="Table Roster View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
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
      </div>

      {/* KPI Stats Bar (5 Cards matching Trainer Course Studio standard) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Courses</div>
          <div className="text-2xl font-black text-slate-900">{totalCourses}</div>
          <div className="text-[11px] font-mono text-[#7C248C] font-semibold">{publishedCourses} Published Live</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enrolled Learners</div>
          <div className="text-2xl font-black text-[#1E2B88]">{totalLearners}</div>
          <div className="text-[11px] font-mono text-indigo-600 font-semibold">Active Enrollments</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Curriculum Modules</div>
          <div className="text-2xl font-black text-slate-900">{totalCurriculumModules}</div>
          <div className="text-[11px] font-mono text-purple-600 font-semibold">{totalCurriculumLessons} Lecture Units</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Draft & Hidden</div>
          <div className="text-2xl font-black text-amber-600">{draftOrUnpublishedCourses}</div>
          <div className="text-[11px] font-mono text-amber-700 font-semibold">Under Construction</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faculty Trainers</div>
          <div className="text-2xl font-black text-emerald-600">{trainers.length}</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">Assigned Instructors</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses by title, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Level:</span>
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="ALL_LEVELS">All Levels</option>
          </select>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Trainer:</span>
          </div>
          <select
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="">All Faculty</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Display */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading course catalog...</p>
        </div>
      ) : courses.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-purple-300"
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
                    <div className="w-full h-full bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 p-6 flex flex-col justify-between">
                      <BookOpen className="w-8 h-8 text-white/40" />
                      <div className="text-xs font-mono text-white/60 uppercase tracking-widest">
                        JVM Academic Course
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
                      className="text-base font-black text-slate-900 hover:text-[#7C248C] transition line-clamp-1 tracking-tight"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* Course Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-[11px] text-slate-600 font-mono">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{c.durationHours}h Study</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-[#7C248C] shrink-0" />
                      <span>{c.totalModules} Modules</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{c.totalStudents} Enrolled</span>
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
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-[#7C248C] font-black text-[10px] flex items-center justify-center font-mono">
                          {c.trainer.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                          {c.trainer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatDate(c.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Quick Status Toggle */}
                    {c.status === "PUBLISHED" ? (
                      <button
                        onClick={() => handleStatusToggle(c, "UNPUBLISHED")}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 transition cursor-pointer"
                        title="Unpublish course"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusToggle(c, "PUBLISHED")}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition cursor-pointer"
                        title="Publish course"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/courses/${c.id}`}
                    className="flex-1 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition hover:scale-[1.01]"
                  >
                    <Eye className="w-3.5 h-3.5" /> Manage Course Cockpit
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                      title="Edit Course Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCourse(c)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
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
                    <th className="p-4">Created</th>
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
                            <div className="w-10 h-10 rounded-xl jvm-gradient-bg flex items-center justify-center text-white font-bold shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/admin/courses/${c.id}`}
                              className="font-bold text-slate-900 hover:text-[#7C248C] transition line-clamp-1"
                            >
                              {c.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /{c.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {c.trainer.name}
                      </td>

                      <td className="p-4 space-y-1">
                        <div className="font-semibold text-slate-800 font-mono">
                          {c.durationHours} Hours
                        </div>
                        <div>{getLevelBadge(c.level)}</div>
                      </td>

                      <td className="p-4 font-mono text-slate-600">
                        {c.totalModules} modules ({c.totalLessons} lessons)
                      </td>

                      <td className="p-4 font-mono font-bold text-[#1E2B88]">
                        {c.totalStudents} Learners
                      </td>

                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {formatDate(c.createdAt)}
                      </td>

                      <td className="p-4">{getStatusBadge(c.status)}</td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/courses/${c.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#7C248C] transition cursor-pointer"
                            title="Manage Course"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 transition cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingCourse(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
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
          <BookOpen className="w-10 h-10 text-purple-400 mx-auto" />
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
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7C248C]" />
                {editingCourse ? "Edit Course Information" : "Create New Course"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCourse(null);
                }}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-[10px] font-bold cursor-pointer"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="DRAFT">Draft (Invisible to students)</option>
                  <option value="PUBLISHED">Published (Available for enrollment)</option>
                  <option value="UNPUBLISHED">Unpublished (Hidden from student catalog)</option>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] font-mono text-[11px]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] font-mono text-[11px]"
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
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
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
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition"
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
