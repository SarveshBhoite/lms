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
  FileCheck,
  Search,
  Download,
  Code2,
  Link2,
  File,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ResourceItem {
  id: string;
  courseId?: string | null;
  batchId?: string | null;
  lessonId?: string | null;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storageKey?: string | null;
  isPublic: boolean;
  createdAt: string;
  batch?: { id: string; name: string } | null;
  lesson?: { id: string; title: string } | null;
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
    courseProgresses?: { progressPercent: number; completedLessonsCount: number; isCompleted: boolean }[];
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

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  maxAttempts: number;
  status: string;
  createdAt: string;
  lesson?: { id: string; title: string } | null;
  _count?: { questions: number; quizAttempts: number };
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  deadline?: string | null;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  createdAt: string;
  lesson?: { id: string; title: string } | null;
  _count?: { submissions: number };
}

interface AttendanceRecord {
  id: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | string;
}

interface LiveClassItem {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  meetUrl: string;
  recordingUrl?: string | null;
  status: string;
  batch?: {
    id: string;
    name: string;
    _count?: { students: number };
  } | null;
  trainer?: { id: string; name: string } | null;
  attendances?: AttendanceRecord[];
  _count?: { attendances: number };
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
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
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
  quizzes?: QuizItem[];
  assignments?: AssignmentItem[];
  liveClasses?: LiveClassItem[];
  resources?: ResourceItem[];
  _count: {
    modules: number;
    enrollments: number;
    batches: number;
    quizzes?: number;
    assignments?: number;
    liveClasses?: number;
    resources?: number;
  };
}

interface StudentSimple {
  id: string;
  name: string;
  email: string;
  profile?: { phone?: string | null; avatarUrl?: string | null } | null;
}

export type CourseTabKey =
  | "overview"
  | "modules"
  | "quizzes"
  | "assignments"
  | "live"
  | "batches"
  | "students"
  | "resources";

export default function CourseDetailClient({
  initialCourse,
  trainers,
  allStudents = [],
}: {
  initialCourse: CourseDetail;
  trainers: Array<{ id: string; name: string; email: string; role: string }>;
  allStudents?: StudentSimple[];
}) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail>(initialCourse);
  const [activeTab, setActiveTab] = useState<CourseTabKey>("overview");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Enrollment Modal States inside Course
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isBulkEnrollModalOpen, setIsBulkEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(allStudents[0]?.id || "");
  const [selectedBatchId, setSelectedBatchId] = useState(initialCourse.batches[0]?.id || "");
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<string[]>([]);
  const [studentSearchFilter, setStudentSearchFilter] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("");

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
  const [deletingResource, setDeletingResource] = useState<{ id: string; lessonId?: string | null } | null>(null);
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

  // Content Statistics
  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const lessonResourcesCount = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.resources.length, 0),
    0
  );
  const allResources = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) =>
      l.resources.map((r) => ({ ...r, lessonTitle: l.title, moduleTitle: m.title }))
    )
  );
  const courseLevelResourcesCount = course.resources?.length || 0;
  const totalResources = lessonResourcesCount + courseLevelResourcesCount;
  const totalQuizzes = course.quizzes?.length || 0;
  const totalAssignments = course.assignments?.length || 0;
  const totalLiveClasses = course.liveClasses?.length || 0;

  // Learner Progress Analytics
  const enrollmentsWithProgress = course.enrollments.map((e) => {
    const prog = e.user.courseProgresses?.[0];
    return prog ? prog.progressPercent : 0;
  });
  const avgProgress =
    enrollmentsWithProgress.length > 0
      ? enrollmentsWithProgress.reduce((a, b) => a + b, 0) / enrollmentsWithProgress.length
      : 0;
  const completedLearners = enrollmentsWithProgress.filter((p) => p >= 100).length;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto pb-16">
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
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <Link
          href="/admin/courses"
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-purple-50 hover:border-purple-200 transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Course Catalog
        </Link>

        <div className="flex items-center gap-2">
          {course.status === "PUBLISHED" ? (
            <button
              onClick={() => handleStatusToggle("UNPUBLISHED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Unpublish Course
            </button>
          ) : (
            <button
              onClick={() => handleStatusToggle("PUBLISHED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 transition flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Globe className="w-3.5 h-3.5" /> Publish Course
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/15 to-pink-500/15 blur-xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-4 relative z-10 min-w-0">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl jvm-gradient-bg text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-8 h-8" />
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Course Cockpit
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  course.status === "PUBLISHED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {course.status}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                {course.level}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate tracking-tight">
              {course.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="text-purple-700 font-semibold">
                Faculty: <strong className="text-slate-900">{course.trainer?.name}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> {course.durationHours ? `${course.durationHours} Hours` : "Self-Paced"}
              </span>
              <span>•</span>
              <span>Created: {formatDate(course.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar (Top 5 Studio KPI Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#7C248C]" /> Curriculum
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalModules} <span className="text-xs text-slate-400 font-normal">Modules</span>
          </div>
          <div className="text-[11px] text-[#7C248C] font-mono font-semibold">{totalLessons} Total Lessons</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1E2B88]" /> Enrolled Learners
          </div>
          <div className="text-2xl font-black text-[#1E2B88]">
            {course.enrollments.length} <span className="text-xs text-slate-400 font-normal">Students</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-mono font-semibold">{course.batches.length} Cohorts Assigned</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-pink-600" /> Avg Completion
          </div>
          <div className="text-2xl font-black text-pink-600">{avgProgress.toFixed(1)}%</div>
          <div className="text-[11px] text-pink-700 font-mono font-semibold">{completedLearners} Finished Course</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Assessments
          </div>
          <div className="text-2xl font-black text-amber-600">{totalQuizzes + totalAssignments}</div>
          <div className="text-[11px] text-amber-700 font-mono font-semibold">
            {totalQuizzes} Quizzes • {totalAssignments} Tasks
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-emerald-600" /> Live Sessions
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalLiveClasses}</div>
          <div className="text-[11px] text-emerald-700 font-mono font-semibold">Cohort Interactive</div>
        </div>
      </div>

      {/* 8 Comprehensive Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview & Cockpit
        </button>

        <button
          onClick={() => setActiveTab("modules")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "modules"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Curriculum ({totalModules}/{totalLessons})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({totalQuizzes})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "assignments"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Assignments ({totalAssignments})
        </button>

        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "live"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Live Classes ({totalLiveClasses})
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "batches"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" /> Batches ({course.batches.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "students"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Students ({course.enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "resources"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCode className="w-4 h-4" /> Resources ({totalResources})
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
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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

                      {/* Add Lesson to this module -> Navigate to Full HTML Studio */}
                      <Link
                        href={`/admin/courses/${course.id}/modules/${m.id}/lessons/create`}
                        className="px-3 py-1.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1 transition shadow-xs hover:scale-[1.02]"
                      >
                        <Plus className="w-3.5 h-3.5" /> HTML Lesson Studio
                      </Link>

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
                              <div className="p-2 rounded-xl bg-purple-50 text-[#7C248C] shrink-0 mt-0.5">
                                {getContentTypeIcon(l.contentType)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/admin/courses/${course.id}/modules/${m.id}/lessons/${l.id}/edit`}
                                    className="font-bold text-slate-900 text-xs hover:text-[#7C248C] transition"
                                  >
                                    {l.title}
                                  </Link>
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

                              {/* Edit Lesson Studio Button */}
                              <Link
                                href={`/admin/courses/${course.id}/modules/${m.id}/lessons/${l.id}/edit`}
                                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-[11px] border border-purple-200 flex items-center gap-1 transition"
                                title="Open HTML Studio"
                              >
                                <Edit2 className="w-3 h-3" /> Edit Studio
                              </Link>

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

      {/* ---------------- TAB 1: OVERVIEW & COCKPIT ---------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Syllabus & Progress Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Syllabus Breakdown */}
            <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Syllabus Breakdown</h3>
                  <p className="text-xs text-slate-500">Modules and planned lecture content for this course</p>
                </div>
                <button
                  onClick={() => setActiveTab("modules")}
                  className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Full Syllabus <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {course.modules.length > 0 ? (
                <div className="space-y-3">
                  {course.modules.slice(0, 4).map((mod, idx) => (
                    <div
                      key={mod.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono font-bold text-[#7C248C] uppercase">
                          Module {idx + 1}
                        </div>
                        <div className="text-sm font-bold text-slate-900">{mod.title}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {mod.lessons.length} Lessons • {mod.lessons.reduce((acc, l) => acc + l.resources.length, 0)} Resources
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${course.id}/modules/${mod.id}/lessons/create`}
                          className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-[#7C248C] font-bold text-[11px] hover:bg-purple-50 transition shadow-xs"
                        >
                          + Lesson
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No modules created yet. Go to Curriculum tab to add the first module.
                </div>
              )}

              {/* Course Description */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">About Course</h4>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Right: Course Metadata & Instructor Card */}
            <div className="space-y-6">
              <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                <h3 className="text-lg font-black text-slate-900">Course Metadata</h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Assigned Faculty</span>
                    <div className="flex items-center gap-3 pt-1">
                      {course.trainer.profile?.avatarUrl ? (
                        <img
                          src={course.trainer.profile.avatarUrl}
                          alt={course.trainer.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C248C] flex items-center justify-center font-bold text-sm shrink-0">
                          {course.trainer.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{course.trainer?.name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{course.trainer?.email}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Course Objectives</span>
                    {course.objectives && course.objectives.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-700 pt-1">
                        {course.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">No specific objectives defined.</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Prerequisites</span>
                    {course.prerequisites && course.prerequisites.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {course.prerequisites.map((pre, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] text-[10px] font-mono font-bold">
                            {pre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No prerequisites required.</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Quick Specifications</span>
                    <div className="space-y-1.5 text-[11px] font-mono pt-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Course Slug:</span>
                        <strong className="text-slate-900">/{course.slug}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Difficulty Level:</span>
                        <strong className="text-slate-900">{course.level}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Duration:</span>
                        <strong className="text-slate-900">{course.durationHours ? `${course.durationHours} Hours` : "Self-Paced"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Creation Date:</span>
                        <strong className="text-slate-900">{formatDate(course.createdAt)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#7C248C]" /> Quizzes ({totalQuizzes})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluations, tests, and quizzes configured under this course curriculum.
              </p>
            </div>
          </div>

          {course.quizzes && course.quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between hover:border-purple-300 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 text-[10px] font-mono font-bold uppercase">
                        {quiz.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {quiz.timeLimitMinutes} mins
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-base">{quiz.title}</h4>
                    {quiz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{quiz.description}</p>
                    )}

                    {quiz.lesson && (
                      <div className="text-[11px] font-mono text-purple-700 font-semibold truncate">
                        Linked Lesson: {quiz.lesson.title}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">
                      <strong>{quiz._count?.questions || 0}</strong> Questions
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {quiz._count?.quizAttempts || 0} Student Attempts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <HelpCircle className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No assessments or quizzes linked yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Quizzes are added to individual lessons inside the HTML Lesson Studio by instructors.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#7C248C]" /> Assignments ({totalAssignments})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Coding assignments, case studies, and practical projects assigned under this course.
              </p>
            </div>
          </div>

          {course.assignments && course.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.assignments.map((asgn) => (
                <div
                  key={asgn.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between hover:border-pink-300 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-mono font-bold">
                        {asgn.totalMarks} Marks Max
                      </span>
                      {asgn.deadline && (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-pink-500" />
                          {formatDate(asgn.deadline)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-slate-900 text-base">{asgn.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{asgn.description}</p>

                    {asgn.lesson && (
                      <div className="text-[11px] font-mono text-purple-700 font-semibold truncate">
                        Linked Lesson: {asgn.lesson.title}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600">
                      <strong>{asgn._count?.submissions || 0}</strong> Submissions
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      Evaluated by Faculty
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileCheck className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No projects or assignments linked yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Practical tasks and homework are configured inside lesson units by the instructor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: LIVE CLASSES ---------------- */}
      {activeTab === "live" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-[#7C248C]" /> Live Interactive Classes ({totalLiveClasses})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scheduled and past live streaming classes for cohorts enrolled in this course.
              </p>
            </div>
          </div>

          {course.liveClasses && course.liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.liveClasses.map((cls) => {
                const isCompleted = cls.status === "COMPLETED";
                const isLive = cls.status === "LIVE";

                const presentCount = cls.attendances
                  ? cls.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length
                  : 0;
                const absentCount = cls.attendances
                  ? cls.attendances.filter((a) => a.status === "ABSENT").length
                  : 0;
                const totalCohort = cls.batch?._count?.students || (presentCount + absentCount);

                return (
                  <div
                    key={cls.id}
                    className={`rounded-3xl border bg-white shadow-xs space-y-4 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      isLive
                        ? "border-emerald-300 ring-2 ring-emerald-500/20"
                        : isCompleted
                        ? "border-slate-200/90 bg-slate-50/40"
                        : "border-slate-200/90 hover:border-purple-300"
                    }`}
                  >
                    {/* Header Strip */}
                    <div className="p-6 pb-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            isLive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
                              : isCompleted
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-purple-100 text-[#7C248C] border border-purple-200"
                          }`}
                        >
                          {isLive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                          {cls.status}
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-[#7C248C]" />
                          {formatDate(cls.scheduledDate)}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-base leading-snug">{cls.title}</h4>
                      {cls.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{cls.description}</p>
                      )}

                      {/* Cohort & Schedule Details */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Cohort:</span>
                          <strong className="text-slate-900">{cls.batch?.name || "All Enrolled Batches"}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Timing:</span>
                          <span className="text-slate-700">
                            {new Date(cls.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {new Date(cls.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {cls.trainer && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Host:</span>
                            <span className="text-purple-700 font-bold">{cls.trainer.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Attendance Breakdown Pills */}
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs text-center">
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div className="text-[10px] text-emerald-600 font-bold uppercase">Present / Attended</div>
                          <strong className="text-emerald-800 text-sm">{presentCount}</strong>
                          {totalCohort > 0 && (
                            <span className="text-[10px] text-emerald-600/80 block">
                              of {totalCohort} students
                            </span>
                          )}
                        </div>
                        <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                          <div className="text-[10px] text-rose-600 font-bold uppercase">Absent</div>
                          <strong className="text-rose-800 text-sm">{absentCount}</strong>
                          <span className="text-[10px] text-rose-600/80 block">Unmarked / Absent</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-6 pt-3 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                      <div className="text-[11px] font-mono text-slate-500">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Session Concluded
                          </span>
                        ) : isLive ? (
                          <span className="text-emerald-600 font-bold">Class In Progress</span>
                        ) : (
                          <span className="text-purple-600 font-bold">Upcoming Session</span>
                        )}
                      </div>

                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          {cls.recordingUrl ? (
                            <a
                              href={cls.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center gap-1.5 transition"
                            >
                              <Video className="w-3.5 h-3.5" /> Watch Recording
                            </a>
                          ) : (
                            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed flex items-center gap-1.5">
                              <Video className="w-3.5 h-3.5 text-slate-300" /> Session Ended
                            </span>
                          )}
                        </div>
                      ) : (
                        cls.meetUrl && (
                          <a
                            href={cls.meetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                              isLive
                                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                                : "jvm-gradient-bg jvm-gradient-hover shadow-purple-900/20"
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" /> Launch Meet
                          </a>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Video className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No live interactive classes scheduled</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Live interactive classes can be scheduled by faculty or administrators under batches.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: ASSIGNED BATCHES ---------------- */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#7C248C]" /> Associated Course Batches ({course.batches.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cohorts and training batches associated with this course curriculum.
              </p>
            </div>

            <Link
              href="/admin/batches"
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Manage All Batches
            </Link>
          </div>

          {course.batches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.batches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-purple-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono">
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {formatDate(b.startDate)} — {formatDate(b.endDate)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Students Enrolled:</span>
                    <span className="text-[#7C248C] font-bold font-mono">{b._count.students} Learners</span>
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

      {/* ---------------- TAB 7: ENROLLED STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7C248C]" /> Enrolled Student Roster ({course.enrollments.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students currently active or completed in this course. Enroll students individually or in bulk.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedStudentId(allStudents[0]?.id || "");
                  setSelectedBatchId(course.batches[0]?.id || "");
                  setIsEnrollModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Enroll Student
              </button>

              <button
                onClick={() => {
                  setSelectedBulkStudentIds([]);
                  setSelectedBatchId(course.batches[0]?.id || "");
                  setIsBulkEnrollModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Bulk Enroll Students
              </button>
            </div>
          </div>

          {/* Search & Batch Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search enrolled students by name or email..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
              />
            </div>

            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            >
              <option value="">All Batches / Cohorts</option>
              {course.batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {course.enrollments.filter((e) => {
            const matchQuery =
              e.user.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
              e.user.email.toLowerCase().includes(searchStudent.toLowerCase());
            const matchBatch = !selectedBatchFilter || e.batch?.id === selectedBatchFilter;
            return matchQuery && matchBatch;
          }).length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold font-mono text-[11px]">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Assigned Batch</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Enrolled Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {course.enrollments
                    .filter((e) => {
                      const matchQuery =
                        e.user.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
                        e.user.email.toLowerCase().includes(searchStudent.toLowerCase());
                      const matchBatch = !selectedBatchFilter || e.batch?.id === selectedBatchFilter;
                      return matchQuery && matchBatch;
                    })
                    .map((en) => {
                      const prog = en.user.courseProgresses?.[0];
                      const pct = prog ? prog.progressPercent : 0;

                      return (
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
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7C248C] font-bold flex items-center justify-center">
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
                          <td className="p-4">
                            <div className="w-28 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-[#7C248C]">{pct.toFixed(0)}%</span>
                                {pct >= 100 && (
                                  <span className="text-[10px] text-emerald-600 font-bold">Done</span>
                                )}
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="jvm-gradient-bg h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-[11px]">
                            {formatDate(en.enrolledAt)}
                          </td>
                          <td className="p-4 font-bold text-emerald-600">{en.status}</td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/admin/students/${en.user.id}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 inline-flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No students found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No students match your search criteria. Click &quot;Enroll Student&quot; to add learners.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 8: LEARNING RESOURCES & FILES ---------------- */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#7C248C]" /> Learning Resources & Datasets ({totalResources})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Downloadable course materials, PDFs, code archives, datasets, and presentation slides.
              </p>
            </div>
          </div>

          {/* Course-level General Resources */}
          {course.resources && course.resources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Course-Wide Materials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-[#7C248C] border border-purple-200 font-bold">
                          {res.fileType.split("/")[1]?.toUpperCase() || res.fileType || "FILE"}
                        </span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 font-mono px-2 py-0.5 rounded font-bold">
                          {res.batch ? `Batch: ${res.batch.name}` : "Course-Wide"}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{res.title}</h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#7C248C] hover:text-purple-900 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Asset
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lesson-attached Resources */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Lesson-Attached Resources ({lessonResourcesCount})</h3>
            {lessonResourcesCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allResources.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition"
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
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No lesson resources attached yet.</p>
              </div>
            )}
          </div>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of what this module covers..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModuleModalOpen(false);
                    setEditingModule(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteModule}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer transition"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] font-mono text-[11px]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                  className={`px-3 py-1 rounded-full font-bold text-[10px] transition cursor-pointer ${
                    lessonForm.isFreePreview
                      ? "bg-purple-100 text-[#7C248C] border border-purple-200"
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
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLesson}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer transition"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">File / Resource Type *</label>
                  <select
                    value={resourceForm.fileType}
                    onChange={(e) => setResourceForm({ ...resourceForm, fileType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLessonForResource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Attach Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Enroll Student Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#7C248C]" /> Enroll Student to Course
              </h3>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedStudentId) {
                  setToastMessage({ type: "error", text: "Please select a student." });
                  return;
                }
                setActionLoading(true);
                try {
                  const res = await fetch("/api/admin/enrollments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: selectedStudentId,
                      courseId: course.id,
                      batchId: selectedBatchId || null,
                      status: "ACTIVE",
                    }),
                  });
                  const json = await res.json();
                  if (!res.ok || !json.success) throw new Error(json.error || "Failed to enroll student");

                  setToastMessage({ type: "success", text: "Student successfully enrolled!" });
                  setIsEnrollModalOpen(false);
                  router.refresh();
                } catch (err: any) {
                  setToastMessage({ type: "error", text: err.message || "Failed to enroll" });
                } finally {
                  setActionLoading(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Student *</label>
                {allStudents.filter((s) => !course.enrollments.some((e) => e.user.id === s.id)).length > 0 ? (
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                  >
                    <option value="" disabled>-- Select an unenrolled student --</option>
                    {allStudents
                      .filter((s) => !course.enrollments.some((e) => e.user.id === s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    All registered students are already enrolled in this course!
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assign Cohort / Batch (Optional)</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="">No Batch (Self-Paced / Direct Course)</option>
                  {course.batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedStudentId}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Enroll Students Modal */}
      {isBulkEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C248C]" /> Bulk Enroll Students
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select multiple learners to simultaneously enroll into this course.
                </p>
              </div>
              <button
                onClick={() => setIsBulkEnrollModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (selectedBulkStudentIds.length === 0) {
                  setToastMessage({ type: "error", text: "Please select at least one student." });
                  return;
                }
                setActionLoading(true);
                try {
                  const res = await fetch("/api/admin/enrollments/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      studentIds: selectedBulkStudentIds,
                      courseId: course.id,
                      batchId: selectedBatchId || null,
                      status: "ACTIVE",
                    }),
                  });
                  const json = await res.json();
                  if (!res.ok || !json.success) throw new Error(json.error || "Failed to bulk enroll");

                  setToastMessage({
                    type: "success",
                    text: `Successfully enrolled ${selectedBulkStudentIds.length} student(s)!`,
                  });
                  setIsBulkEnrollModalOpen(false);
                  router.refresh();
                } catch (err: any) {
                  setToastMessage({ type: "error", text: err.message || "Bulk enrollment failed" });
                } finally {
                  setActionLoading(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assign Cohort / Batch (Optional)</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="">No Batch (Self-Paced / Direct Course)</option>
                  {course.batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Search & Multi-Select Checklist (Only Unenrolled Students) */}
              <div className="space-y-2 pt-2">
                {(() => {
                  const unenrolledStudents = allStudents.filter(
                    (s) => !course.enrollments.some((e) => e.user.id === s.id)
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700">
                          Select Available Students ({selectedBulkStudentIds.length} chosen)
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBulkStudentIds(unenrolledStudents.map((s) => s.id))}
                            className="text-[11px] font-bold text-[#7C248C] hover:underline cursor-pointer"
                          >
                            Select All ({unenrolledStudents.length})
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedBulkStudentIds([])}
                            className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Filter available students by name or email..."
                        value={studentSearchFilter}
                        onChange={(e) => setStudentSearchFilter(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                      />

                      <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1 bg-slate-50/50">
                        {unenrolledStudents
                          .filter(
                            (s) =>
                              s.name.toLowerCase().includes(studentSearchFilter.toLowerCase()) ||
                              s.email.toLowerCase().includes(studentSearchFilter.toLowerCase())
                          ).length > 0 ? (
                          unenrolledStudents
                            .filter(
                              (s) =>
                                s.name.toLowerCase().includes(studentSearchFilter.toLowerCase()) ||
                                s.email.toLowerCase().includes(studentSearchFilter.toLowerCase())
                            )
                            .map((s) => {
                              const isChecked = selectedBulkStudentIds.includes(s.id);
                              return (
                                <label
                                  key={s.id}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                                    isChecked
                                      ? "bg-purple-50/80 border-purple-200 text-purple-950 font-bold"
                                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedBulkStudentIds((prev) => [...prev, s.id]);
                                        } else {
                                          setSelectedBulkStudentIds((prev) => prev.filter((id) => id !== s.id));
                                        }
                                      }}
                                      className="w-4 h-4 rounded text-[#7C248C] focus:ring-[#7C248C] border-slate-300"
                                    />
                                    <div className="overflow-hidden">
                                      <div className="truncate text-xs">{s.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono truncate">{s.email}</div>
                                    </div>
                                  </div>
                                </label>
                              );
                            })
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No unenrolled students available for this course.
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || selectedBulkStudentIds.length === 0}
                  className="px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bulk Enroll {selectedBulkStudentIds.length > 0 && `(${selectedBulkStudentIds.length})`}
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResource}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer transition"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
