"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Users,
  Layers,
  Sparkles,
  Globe,
  Lock,
  Archive,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Video,
  FileCode,
  Link as LinkIcon,
  Upload,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
  FolderOpen,
  Award,
  CheckSquare,
  HelpCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Database,
  ExternalLink,
} from "lucide-react";

interface ResourceItem {
  id: string;
  lessonId: string;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storageKey?: string | null;
  isPublic: boolean;
  createdAt: string;
}

interface LessonItem {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  contentType: "VIDEO" | "PDF" | "PPT" | "DOC" | "CODE" | "LINK" | "TEXT";
  contentUrl?: string | null;
  textContent?: string | null;
  durationMinutes: number;
  orderIndex: number;
  isFreePreview: boolean;
  createdAt: string;
  resources: ResourceItem[];
}

interface ModuleItem {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  createdAt: string;
  lessons: LessonItem[];
}

interface StudentEnrollment {
  id: string;
  enrolledAt: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    profile?: { phone?: string | null; avatarUrl?: string | null } | null;
  };
  batch?: { id: string; name: string } | null;
}

interface CourseBatch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { students: number };
}

interface CourseDetail {
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
    profile?: { phone?: string | null; avatarUrl?: string | null; designation?: string | null } | null;
  };
  modules: ModuleItem[];
  enrollments: StudentEnrollment[];
  batches: CourseBatch[];
  _count: {
    modules: number;
    enrollments: number;
    batches: number;
  };
}

export default function CourseDetailClient({
  initialCourse,
  trainers,
}: {
  initialCourse: CourseDetail;
  trainers: Array<{ id: string; name: string; email: string; role: string }>;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail>(initialCourse);
  const [activeTab, setActiveTab] = useState<"overview" | "modules" | "content" | "students" | "batches">("modules");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Expanded Modules State
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initialCourse.modules.forEach((m) => (initial[m.id] = true));
    return initial;
  });

  // Module Modals State
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [deletingModule, setDeletingModule] = useState<ModuleItem | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });

  // Lesson Modals State
  const [activeModuleForLesson, setActiveModuleForLesson] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<LessonItem | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    contentType: "VIDEO" as "VIDEO" | "PDF" | "PPT" | "DOC" | "CODE" | "LINK" | "TEXT",
    contentUrl: "",
    textContent: "",
    durationMinutes: 15,
    isFreePreview: false,
  });

  // Resource Modals State
  const [activeLessonForResource, setActiveLessonForResource] = useState<string | null>(null);
  const [deletingResource, setDeletingResource] = useState<{ id: string; lessonId: string } | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    fileType: "PDF",
    fileUrl: "",
    fileSize: 1024 * 1024, // 1MB default
    isPublic: true,
  });

  // Show Toast
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Refresh Course Data
  const refreshCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.data);
      }
    } catch (err) {
      console.error("Failed to refresh course data:", err);
    }
  };

  // Quick Status Toggle
  const handleStatusToggle = async (newStatus: "DRAFT" | "PUBLISHED" | "UNPUBLISHED") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update status");
      showToast("success", `Course status updated to ${newStatus}`);
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- MODULE ACTIONS ----------------
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: moduleForm.title,
          description: moduleForm.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create module");

      showToast("success", `Module "${moduleForm.title}" added!`);
      setIsAddModuleModalOpen(false);
      setModuleForm({ title: "", description: "" });
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add module");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${editingModule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: moduleForm.title,
          description: moduleForm.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update module");

      showToast("success", `Module updated successfully!`);
      setEditingModule(null);
      setModuleForm({ title: "", description: "" });
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update module");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!deletingModule) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${deletingModule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete module");

      showToast("success", `Module deleted.`);
      setDeletingModule(null);
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete module");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveModule = async (index: number, direction: "up" | "down") => {
    const modules = [...course.modules];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    // Swap orderIndex
    const temp = modules[index];
    modules[index] = modules[targetIndex];
    modules[targetIndex] = temp;

    const moduleOrders = modules.map((m, idx) => ({ id: m.id, orderIndex: idx }));

    // Optimistic state
    setCourse({ ...course, modules });

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleOrders }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to reorder modules");
      refreshCourse();
    } catch (err: any) {
      showToast("error", err.message || "Failed to reorder modules");
      refreshCourse();
    }
  };

  // ---------------- LESSON ACTIONS ----------------
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleForLesson) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${activeModuleForLesson}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonForm.title,
          description: lessonForm.description || null,
          contentType: lessonForm.contentType,
          contentUrl: lessonForm.contentUrl || null,
          textContent: lessonForm.textContent || null,
          durationMinutes: Number(lessonForm.durationMinutes),
          isFreePreview: lessonForm.isFreePreview,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create lesson");

      showToast("success", `Lesson "${lessonForm.title}" created!`);
      setActiveModuleForLesson(null);
      resetLessonForm();
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create lesson");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${editingLesson.moduleId}/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonForm.title,
          description: lessonForm.description || null,
          contentType: lessonForm.contentType,
          contentUrl: lessonForm.contentUrl || null,
          textContent: lessonForm.textContent || null,
          durationMinutes: Number(lessonForm.durationMinutes),
          isFreePreview: lessonForm.isFreePreview,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update lesson");

      showToast("success", `Lesson updated successfully!`);
      setEditingLesson(null);
      resetLessonForm();
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update lesson");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${deletingLesson.moduleId}/lessons/${deletingLesson.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete lesson");

      showToast("success", `Lesson deleted.`);
      setDeletingLesson(null);
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete lesson");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveLesson = async (moduleIndex: number, lessonIndex: number, direction: "up" | "down") => {
    const moduleObj = course.modules[moduleIndex];
    const lessons = [...moduleObj.lessons];
    const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    // Swap
    const temp = lessons[lessonIndex];
    lessons[lessonIndex] = lessons[targetIndex];
    lessons[targetIndex] = temp;

    const lessonOrders = lessons.map((l, idx) => ({ id: l.id, orderIndex: idx }));

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${moduleObj.id}/lessons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonOrders }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to reorder lessons");
      refreshCourse();
    } catch (err: any) {
      showToast("error", err.message || "Failed to reorder lessons");
      refreshCourse();
    }
  };

  const openEditLessonModal = (lesson: LessonItem) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      contentType: lesson.contentType,
      contentUrl: lesson.contentUrl || "",
      textContent: lesson.textContent || "",
      durationMinutes: lesson.durationMinutes,
      isFreePreview: lesson.isFreePreview,
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      description: "",
      contentType: "VIDEO",
      contentUrl: "",
      textContent: "",
      durationMinutes: 15,
      isFreePreview: false,
    });
  };

  // ---------------- RESOURCE ACTIONS ----------------
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLessonForResource) return;

    // Find module for this lesson
    let moduleId = "";
    for (const m of course.modules) {
      if (m.lessons.some((l) => l.id === activeLessonForResource)) {
        moduleId = m.id;
        break;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${moduleId}/lessons/${activeLessonForResource}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceForm.title,
          fileType: resourceForm.fileType,
          fileUrl: resourceForm.fileUrl,
          fileSize: Number(resourceForm.fileSize),
          isPublic: resourceForm.isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to attach resource");

      showToast("success", `Resource "${resourceForm.title}" attached!`);
      setActiveLessonForResource(null);
      setResourceForm({ title: "", fileType: "PDF", fileUrl: "", fileSize: 1024 * 1024, isPublic: true });
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add resource");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!deletingResource) return;

    let moduleId = "";
    for (const m of course.modules) {
      if (m.lessons.some((l) => l.id === deletingResource.lessonId)) {
        moduleId = m.id;
        break;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${course.id}/modules/${moduleId}/lessons/${deletingResource.lessonId}/resources?resourceId=${deletingResource.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete resource");

      showToast("success", `Resource deleted.`);
      setDeletingResource(null);
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete resource");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper Icon for Content/File Type
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="w-4 h-4 text-rose-500" />;
      case "PDF":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "PPT":
        return <FileSpreadsheet className="w-4 h-4 text-amber-500" />;
      case "DOC":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "CODE":
        return <FileCode className="w-4 h-4 text-emerald-500" />;
      case "LINK":
        return <LinkIcon className="w-4 h-4 text-indigo-500" />;
      case "IMAGE":
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case "DATASET":
        return <Database className="w-4 h-4 text-cyan-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  // Collect all resources across course
  const allResources = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) =>
      l.resources.map((r) => ({ ...r, lessonTitle: l.title, moduleTitle: m.title }))
    )
  );

  // Total lessons count
  const totalLessonsCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

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

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Course Catalog
        </Link>

        <div className="flex items-center gap-3">
          {course.status === "PUBLISHED" ? (
            <button
              onClick={() => handleStatusToggle("UNPUBLISHED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" /> Unpublish Course
            </button>
          ) : (
            <button
              onClick={() => handleStatusToggle("PUBLISHED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <Globe className="w-3.5 h-3.5" /> Publish Course
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-start gap-5">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
              <BookOpen className="w-10 h-10" />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {course.level}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  course.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {course.status}
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900">{course.title}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> {course.durationHours} Hours
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-rose-500" /> {course.modules.length} Modules ({totalLessonsCount} lessons)
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> {course.enrollments.length} Students
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                Instructor: <strong>{course.trainer.name}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("modules")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "modules"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Modules & Lessons ({course.modules.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview & Details
        </button>

        <button
          onClick={() => setActiveTab("content")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "content"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FolderOpen className="w-4 h-4" /> Learning Content & Files ({allResources.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Enrolled Students ({course.enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "batches"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" /> Assigned Batches ({course.batches.length})
        </button>
      </div>

      {/* ---------------- TAB 1: MODULES & LESSONS ---------------- */}
      {activeTab === "modules" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course Curriculum</h2>
              <p className="text-xs text-slate-500">
                Organize learning content into modules and structured lessons. Reorder using arrow controls.
              </p>
            </div>

            <button
              onClick={() => {
                setModuleForm({ title: "", description: "" });
                setIsAddModuleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          {course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((m, mIdx) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3"
                >
                  {/* Module Header Bar */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {mIdx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                        {m.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{m.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {m.lessons.length} lessons
                      </span>

                      {/* Reorder Module */}
                      <button
                        onClick={() => handleMoveModule(mIdx, "up")}
                        disabled={mIdx === 0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        title="Move module up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveModule(mIdx, "down")}
                        disabled={mIdx === course.modules.length - 1}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        title="Move module down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Lesson to this module */}
                      <button
                        onClick={() => {
                          resetLessonForm();
                          setActiveModuleForLesson(m.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Lesson
                      </button>

                      {/* Edit Module */}
                      <button
                        onClick={() => {
                          setEditingModule(m);
                          setModuleForm({ title: m.title, description: m.description || "" });
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        title="Edit Module"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Module */}
                      <button
                        onClick={() => setDeletingModule(m)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List Inside Module */}
                  <div className="p-4 space-y-3">
                    {m.lessons.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {m.lessons.map((l, lIdx) => (
                          <div
                            key={l.id}
                            className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-3 rounded-2xl transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                                {getContentTypeIcon(l.contentType)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-xs">{l.title}</h4>
                                  {l.isFreePreview && (
                                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                                      Free Preview
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                                    {l.contentType}
                                  </span>
                                </div>

                                {l.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-1">{l.description}</p>
                                )}

                                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                  <span>{l.durationMinutes} min</span>
                                  <span>•</span>
                                  <span>{l.resources.length} attached files</span>
                                </div>
                              </div>
                            </div>

                            {/* Lesson Controls */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {/* Reorder Lesson */}
                              <button
                                onClick={() => handleMoveLesson(mIdx, lIdx, "up")}
                                disabled={lIdx === 0}
                                className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                                title="Move lesson up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveLesson(mIdx, lIdx, "down")}
                                disabled={lIdx === m.lessons.length - 1}
                                className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                                title="Move lesson down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              {/* Attach Resource */}
                              <button
                                onClick={() => {
                                  setResourceForm({
                                    title: "",
                                    fileType: "PDF",
                                    fileUrl: "",
                                    fileSize: 1024 * 1024,
                                    isPublic: true,
                                  });
                                  setActiveLessonForResource(l.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" /> Add Resource
                              </button>

                              {/* Edit Lesson */}
                              <button
                                onClick={() => openEditLessonModal(l)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                title="Edit Lesson"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Lesson */}
                              <button
                                onClick={() => setDeletingLesson(l)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No lessons in this module yet. Click "Add Lesson" above to create one.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Layers className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No modules created</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start building this course by adding its first module.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: OVERVIEW & DETAILS ---------------- */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Course Description</h3>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" /> What Students Will Learn
              </h3>
              {course.objectives.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-700">
                  {course.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No objectives specified yet.</p>
              )}
            </div>

            {/* Prerequisites */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Prerequisites
              </h3>
              {course.prerequisites.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-700">
                  {course.prerequisites.map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No prerequisites specified.</p>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Trainer Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                Assigned Instructor
              </h3>
              <div className="flex items-center gap-3">
                {course.trainer.profile?.avatarUrl ? (
                  <img
                    src={course.trainer.profile.avatarUrl}
                    alt={course.trainer.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    {course.trainer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{course.trainer.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{course.trainer.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs text-slate-700 divide-y divide-slate-100">
              <div className="flex justify-between pb-2">
                <span className="text-slate-400">Slug:</span>
                <span className="font-mono text-slate-900">/{course.slug}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Level:</span>
                <span className="font-bold text-slate-900">{course.level}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Duration:</span>
                <span className="font-bold text-slate-900">{course.durationHours} Hours</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Created At:</span>
                <span className="font-mono text-slate-600">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: LEARNING CONTENT & FILES ---------------- */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Learning Content Library</h2>
              <p className="text-xs text-slate-500">
                All uploaded documents, videos, source code, and datasets attached to course lessons.
              </p>
            </div>
          </div>

          {allResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {res.fileType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(res.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{res.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      Lesson: <strong>{res.lessonTitle}</strong> ({res.moduleTitle})
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View / Download
                    </a>

                    <button
                      onClick={() => setDeletingResource({ id: res.id, lessonId: res.lessonId })}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No content resources attached</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Attach resources (PDFs, PPTs, videos, source code, links) to lessons in the Modules tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ENROLLED STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Student Roster</h2>
              <p className="text-xs text-slate-500">
                Students currently active or completed in this course.
              </p>
            </div>
          </div>

          {course.enrollments.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Assigned Batch</th>
                    <th className="p-4">Enrolled Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {course.enrollments.map((en) => (
                    <tr key={en.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {en.user.profile?.avatarUrl ? (
                            <img
                              src={en.user.profile.avatarUrl}
                              alt={en.user.name}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                              {en.user.name.charAt(0)}
                            </div>
                          )}
                          <div className="font-bold text-slate-900">{en.user.name}</div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{en.user.email}</td>
                      <td className="p-4 font-semibold text-indigo-600">
                        {en.batch?.name || "Unassigned"}
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {new Date(en.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">{en.status}</td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/students/${en.user.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No students enrolled yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Students will appear here once they enroll in this course or get assigned by Admin.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: ASSIGNED BATCHES ---------------- */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Associated Course Batches</h2>
              <p className="text-xs text-slate-500">
                Cohorts and training batches associated with this course curriculum.
              </p>
            </div>
          </div>

          {course.batches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.batches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Students Enrolled:</span>
                    <span className="text-indigo-600 font-bold">{b._count.students}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No batches assigned</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active or upcoming batches found for this course.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}

      {/* Add / Edit Module Modal */}
      {(isAddModuleModalOpen || editingModule) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingModule ? "Edit Module" : "Add Course Module"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModuleModalOpen(false);
                  setEditingModule(null);
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingModule ? handleEditModule : handleAddModule}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Introduction to React"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of what this module covers..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModuleModalOpen(false);
                    setEditingModule(null);
                  }}
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
                  {editingModule ? "Save Module" : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Module Modal */}
      {deletingModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Delete Module?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete module <strong className="text-slate-900">{deletingModule.title}</strong>? All associated lessons will be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingModule(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteModule}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Lesson Modal */}
      {(activeModuleForLesson || editingLesson) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingLesson ? "Edit Lesson" : "Add New Lesson"}
              </h3>
              <button
                onClick={() => {
                  setActiveModuleForLesson(null);
                  setEditingLesson(null);
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingLesson ? handleEditLesson : handleAddLesson}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Understanding JSX & Components"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Content Type *</label>
                  <select
                    value={lessonForm.contentType}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        contentType: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="VIDEO">Video Stream / MP4</option>
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">Presentation (PPT / PPTX)</option>
                    <option value="DOC">Word Document (DOC / DOCX)</option>
                    <option value="CODE">Source Code Sample</option>
                    <option value="LINK">External URL / Web Reference</option>
                    <option value="TEXT">Rich Text / Article</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={lessonForm.durationMinutes}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Content URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Content URL / Video Link</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?... or https://storage.com/video.mp4"
                  value={lessonForm.contentUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Text Content */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Text Notes / Code Snippets</label>
                <textarea
                  rows={4}
                  placeholder="Detailed notes or text content for this lesson..."
                  value={lessonForm.textContent}
                  onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Lesson Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Free Preview Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">Enable Free Preview</div>
                  <div className="text-[10px] text-slate-500">
                    Allow unregistered or non-enrolled students to preview this lesson
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLessonForm({ ...lessonForm, isFreePreview: !lessonForm.isFreePreview })
                  }
                  className={`px-3 py-1 rounded-full font-bold text-[10px] transition ${
                    lessonForm.isFreePreview
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {lessonForm.isFreePreview ? "PREVIEW ENABLED" : "LOCKED"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModuleForLesson(null);
                    setEditingLesson(null);
                  }}
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
                  {editingLesson ? "Save Lesson" : "Create Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lesson Modal */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Delete Lesson?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete lesson <strong className="text-slate-900">{deletingLesson.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingLesson(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLesson}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {activeLessonForResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Attach Learning Resource</h3>
              <button
                onClick={() => setActiveLessonForResource(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exercise Starter Kit Code (zip) or Slide Deck (pdf)"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">File / Resource Type *</label>
                  <select
                    value={resourceForm.fileType}
                    onChange={(e) => setResourceForm({ ...resourceForm, fileType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">PPT / Slides</option>
                    <option value="DOC">Word Document</option>
                    <option value="CODE">Source Code / ZIP</option>
                    <option value="IMAGE">Image File</option>
                    <option value="DATASET">CSV / Dataset</option>
                    <option value="VIDEO">Video File</option>
                    <option value="LINK">External Web Link</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Approx. File Size (Bytes)</label>
                  <input
                    type="number"
                    value={resourceForm.fileSize}
                    onChange={(e) =>
                      setResourceForm({ ...resourceForm, fileSize: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Resource File URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://storage.googleapis.com/... or https://github.com/..."
                  value={resourceForm.fileUrl}
                  onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLessonForResource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Attach Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Resource Modal */}
      {deletingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Remove Resource?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this resource file from the lesson?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingResource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResource}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
