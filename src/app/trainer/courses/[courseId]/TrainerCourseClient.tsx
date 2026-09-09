"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  Layers,
  FileCode2,
  Download,
  Users,
  Video,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  ExternalLink,
  Lock,
  Clock,
  Sparkles,
  FileText,
  Link2,
  Code2,
  Database,
  Eye,
  File,
  Upload,
  HelpCircle,
  FileCheck,
  Calendar,
  Award,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  ChevronDown,
} from "lucide-react";

interface ResourceItem {
  id: string;
  lessonId: string;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  isPublic: boolean;
}

interface LessonItem {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  contentType: string;
  contentUrl?: string | null;
  textContent?: string | null;
  durationMinutes: number;
  orderIndex: number;
  isFreePreview: boolean;
  resources: ResourceItem[];
  quiz?: {
    id: string;
    title: string;
    questions?: { id: string }[];
  } | null;
  assignment?: {
    id: string;
    title: string;
    totalMarks: number;
  } | null;
}

interface ModuleItem {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: LessonItem[];
}

interface StudentEnrollment {
  id: string;
  userId: string;
  courseId: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile?: { avatarUrl?: string | null; phone?: string | null } | null;
    courseProgresses: { progressPercent: number; completedLessonsCount: number; isCompleted: boolean }[];
  };
  batch?: { id: string; name: string } | null;
}

interface BatchItem {
  id: string;
  name: string;
  status: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  _count?: { students: number };
}

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  maxAttempts: number;
  status: string;
  createdAt: string | Date;
  lesson?: { id: string; title: string } | null;
  _count?: { questions: number; quizAttempts: number };
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  deadline?: string | Date | null;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  createdAt: string | Date;
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
  scheduledDate: string | Date;
  startTime: string | Date;
  endTime: string | Date;
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

export interface CourseDetailData {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  level: string;
  durationHours: number;
  status: string;
  objectives: string[];
  prerequisites: string[];
  trainer: { id: string; name: string; email: string };
  modules: ModuleItem[];
  enrollments: StudentEnrollment[];
  batches: BatchItem[];
  quizzes?: QuizItem[];
  assignments?: AssignmentItem[];
  liveClasses?: LiveClassItem[];
}

export type TabKey =
  | "overview"
  | "modules"
  | "quizzes"
  | "assignments"
  | "live"
  | "batches"
  | "students"
  | "resources";

export default function TrainerCourseClient({ initialCourse }: { initialCourse: CourseDetailData }) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetailData>(initialCourse);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Module Modal States
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", orderIndex: 1 });

  // Lesson Modal States
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [selectedModuleIdForLesson, setSelectedModuleIdForLesson] = useState<string>("");
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    contentType: "VIDEO",
    contentUrl: "",
    textContent: "",
    durationMinutes: 15,
    orderIndex: 1,
    isFreePreview: false,
  });
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false);

  // Resource Modal States
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedLessonIdForResource, setSelectedLessonIdForResource] = useState<string>("");
  const [resourceForm, setResourceForm] = useState({
    title: "",
    fileType: "PDF",
    fileUrl: "",
    isPublic: true,
  });
  const [uploadingResource, setUploadingResource] = useState(false);

  // Delete Confirm Modal
  const [deletingTarget, setDeletingTarget] = useState<{ type: "module" | "lesson" | "resource"; id: string; title: string } | null>(null);

  // Student Filter State
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("");

  // Accordion state for modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (initialCourse?.modules) {
      initialCourse.modules.forEach((m, idx) => {
        initial[m.id] = idx === 0; // expand first module by default
      });
    }
    return initial;
  });

  const toggleModuleAccordion = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshCourse = async () => {
    try {
      const res = await fetch(`/api/trainer/courses/${course.id}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.data);
      }
    } catch (err) {
      console.error("Failed to refresh course:", err);
    }
  };

  // Module Submit
  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingModule
        ? `/api/trainer/courses/${course.id}/modules/${editingModule.id}`
        : `/api/trainer/courses/${course.id}/modules`;
      const method = editingModule ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save module");

      showToast("success", editingModule ? "Module updated!" : `Module "${moduleForm.title}" created!`);
      setIsModuleModalOpen(false);
      setEditingModule(null);
      setModuleForm({ title: "", description: "", orderIndex: 1 });
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save module");
    } finally {
      setActionLoading(false);
    }
  };

  // Lesson Submit
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingLesson
        ? `/api/trainer/courses/${course.id}/lessons/${editingLesson.id}`
        : `/api/trainer/courses/${course.id}/lessons`;
      const method = editingLesson ? "PATCH" : "POST";

      const payload = {
        ...lessonForm,
        moduleId: selectedModuleIdForLesson,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save lesson");

      showToast("success", editingLesson ? "Lesson updated!" : `Lesson "${lessonForm.title}" created!`);
      setIsLessonModalOpen(false);
      setEditingLesson(null);
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save lesson");
    } finally {
      setActionLoading(false);
    }
  };

  // Resource Submit
  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/courses/${course.id}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...resourceForm,
          lessonId: selectedLessonIdForResource,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add resource");

      showToast("success", `Learning resource "${resourceForm.title}" added!`);
      setIsResourceModalOpen(false);
      setResourceForm({ title: "", fileType: "PDF", fileUrl: "", isPublic: true });
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add resource");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Target Submit
  const handleDeleteConfirm = async () => {
    if (!deletingTarget) return;
    setActionLoading(true);
    try {
      let url = "";
      if (deletingTarget.type === "module") {
        url = `/api/trainer/courses/${course.id}/modules/${deletingTarget.id}`;
      } else if (deletingTarget.type === "lesson") {
        url = `/api/trainer/courses/${course.id}/lessons/${deletingTarget.id}`;
      } else {
        url = `/api/trainer/courses/${course.id}/resources/${deletingTarget.id}`;
      }

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete item");

      showToast("success", `${deletingTarget.type.toUpperCase()} deleted.`);
      setDeletingTarget(null);
      refreshCourse();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  // Content Statistics
  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalResources = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.resources.length, 0),
    0
  );
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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="w-4 h-4 text-cyan-600" />;
      case "PDF":
      case "DOC":
      case "PPT":
        return <FileText className="w-4 h-4 text-rose-600" />;
      case "LINK":
        return <Link2 className="w-4 h-4 text-amber-600" />;
      case "CODE":
        return <Code2 className="w-4 h-4 text-indigo-600" />;
      case "DATASET":
        return <Database className="w-4 h-4 text-emerald-600" />;
      default:
        return <File className="w-4 h-4 text-slate-600" />;
    }
  };

  // Filtered Students List
  const filteredEnrollments = course.enrollments.filter((e) => {
    const matchQuery =
      e.user.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      e.user.email.toLowerCase().includes(searchStudent.toLowerCase());
    const matchBatch = !selectedBatchFilter || e.batch?.id === selectedBatchFilter;
    return matchQuery && matchBatch;
  });

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
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumbs & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/trainer/content"
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#7C248C]" /> Content Library
          </Link>
          <Link
            href="/trainer/batches"
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" /> All Batches
          </Link>
        </div>
      </div>

      {/* Compact Studio Header Banner (~10% vh, matching JVM Institute studio standard) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          {/* Compact Course Thumbnail */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-900/10 border border-slate-200 shrink-0 shadow-xs">
            <img
              src={
                course.thumbnailUrl ||
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
              }
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Course Cockpit
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                {course.status}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                {course.level}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {course.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Faculty: <strong className="text-slate-800">{course.trainer?.name}</strong></span>
              <span>•</span>
              <span>{course.durationHours ? `${course.durationHours} hrs` : "Self-Paced"}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 relative z-10 self-end sm:self-auto">
          <button
            onClick={() => {
              setEditingModule(null);
              setModuleForm({ title: "", description: "", orderIndex: course.modules.length + 1 });
              setIsModuleModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add Module
          </button>
        </div>
      </div>

      {/* 8 Comprehensive Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview & Cockpit
        </button>

        <button
          onClick={() => setActiveTab("modules")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "modules"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Curriculum ({totalModules}/{totalLessons})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Assessments ({totalQuizzes})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Projects & Tasks ({totalAssignments})
        </button>

        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "live"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Live Classes ({totalLiveClasses})
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "batches"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Batches ({course.batches.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Students ({course.enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "resources"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCode2 className="w-4 h-4" /> Resources ({totalResources})
        </button>
      </div>

      {/* ---------------- TAB 1: OVERVIEW & COCKPIT ---------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top 5 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Curriculum</div>
              <div className="text-2xl font-black text-slate-900">{totalModules} <span className="text-xs text-slate-400 font-normal">Modules</span></div>
              <div className="text-[11px] text-[#7C248C] font-mono font-semibold">{totalLessons} Total Lessons</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</div>
              <div className="text-2xl font-black text-[#1E2B88]">{course.enrollments.length} <span className="text-xs text-slate-400 font-normal">Learners</span></div>
              <div className="text-[11px] text-indigo-600 font-mono font-semibold">{course.batches.length} Cohorts Assigned</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Completion</div>
              <div className="text-2xl font-black text-pink-600">{avgProgress.toFixed(1)}%</div>
              <div className="text-[11px] text-pink-700 font-mono font-semibold">{completedLearners} Finished Course</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assessments</div>
              <div className="text-2xl font-black text-amber-600">{totalQuizzes + totalAssignments}</div>
              <div className="text-[11px] text-amber-700 font-mono font-semibold">{totalQuizzes} Quizzes • {totalAssignments} Tasks</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Sessions</div>
              <div className="text-2xl font-black text-emerald-600">{totalLiveClasses}</div>
              <div className="text-[11px] text-emerald-700 font-mono font-semibold">Cohort Interactive</div>
            </div>
          </div>

          {/* Quick Syllabus & Progress Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Syllabus Structure */}
            <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Syllabus Breakdown</h3>
                  <p className="text-xs text-slate-500">Modules and planned lecture content for this course</p>
                </div>
                <button
                  onClick={() => setActiveTab("modules")}
                  className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1"
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
                          href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/create`}
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
                  No modules created yet. Click "Add Module" to begin designing curriculum.
                </div>
              )}
            </div>

            {/* Right: Course Metadata & Cohort Summary */}
            <div className="space-y-6">
              <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                <h3 className="text-lg font-black text-slate-900">Course Metadata</h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Assigned Faculty</span>
                    <div className="font-bold text-slate-900 text-sm">{course.trainer?.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{course.trainer?.email}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Course Objectives</span>
                    {course.objectives && course.objectives.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: CURRICULUM & MODULES ---------------- */}
      {activeTab === "modules" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Curriculum Modules & Lessons</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize learning units, manage video lectures, and launch the dedicated HTML Lesson Studio.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingModule(null);
                setModuleForm({ title: "", description: "", orderIndex: course.modules.length + 1 });
                setIsModuleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          {course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((mod, mIdx) => {
                const isExpanded = !!expandedModules[mod.id];

                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition"
                  >
                    {/* Module Accordion Header */}
                    <div
                      onClick={() => toggleModuleAccordion(mod.id)}
                      className="p-6 cursor-pointer hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 rounded-xl bg-purple-50 text-[#7C248C] shrink-0 mt-0.5">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-extrabold uppercase text-[#7C248C]">
                            Module {mIdx + 1}
                          </div>
                          <h3 className="text-base font-black text-slate-900">{mod.title}</h3>
                          {mod.description && (
                            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{mod.description}</p>
                          )}
                          <div className="flex items-center gap-3 pt-1.5 text-xs text-slate-500 font-mono">
                            <span>{mod.lessons.length} Lessons</span>
                            <span>•</span>
                            <span>
                              {mod.lessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)} Mins Content
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on module */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 shrink-0 self-end sm:self-auto"
                      >
                        <Link
                          href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/create`}
                          className="px-3 py-1.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs hover:scale-[1.02]"
                        >
                          <Plus className="w-3.5 h-3.5" /> HTML Lesson Studio
                        </Link>

                        <button
                          onClick={() => {
                            setEditingModule(mod);
                            setModuleForm({
                              title: mod.title,
                              description: mod.description || "",
                              orderIndex: mod.orderIndex,
                            });
                            setIsModuleModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit Module Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingTarget({ type: "module", id: mod.id, title: mod.title })}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                          title="Delete Module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Lessons List */}
                    {isExpanded && (
                      <div className="p-6 pt-0 space-y-3 border-t border-slate-100 bg-slate-50/40">
                        <div className="pt-3 text-[11px] font-mono font-bold uppercase text-slate-400">
                          Lessons in Module {mIdx + 1}
                        </div>

                        {mod.lessons.length > 0 ? (
                          mod.lessons.map((les, lIdx) => (
                            <div
                              key={les.id}
                              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-xl bg-slate-100 text-[#7C248C]">
                                    {getContentTypeIcon(les.contentType)}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Link
                                        href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/${les.id}/edit`}
                                        className="text-xs font-bold text-slate-900 hover:text-[#7C248C] transition"
                                      >
                                        {lIdx + 1}. {les.title}
                                      </Link>

                                      {/* Content Type Badge */}
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                                        {les.contentType}
                                      </span>

                                      {/* Quiz Attached Badge */}
                                      {les.quiz && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-[#7C248C] font-bold border border-purple-200">
                                          <HelpCircle className="w-3 h-3 text-[#7C248C]" /> Quiz Included
                                        </span>
                                      )}

                                      {/* Assignment Attached Badge */}
                                      {les.assignment && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold border border-pink-200">
                                          <FileCheck className="w-3 h-3 text-pink-600" /> Assignment ({les.assignment.totalMarks}m)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      {les.durationMinutes} mins • {les.resources.length} resources attached
                                      {les.quiz ? ` • 1 Quiz (${les.quiz.title})` : ""}
                                      {les.assignment ? ` • 1 Assignment (${les.assignment.title})` : ""}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <Link
                                    href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/${les.id}/edit`}
                                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs border border-purple-200 flex items-center gap-1.5 transition"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" /> Open Studio
                                  </Link>

                                  <button
                                    onClick={() => setDeletingTarget({ type: "lesson", id: les.id, title: les.title })}
                                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Lesson Resources */}
                              {les.resources.length > 0 && (
                                <div className="pl-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                                  {les.resources.map((res) => (
                                    <a
                                      key={res.id}
                                      href={res.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 text-[10px] font-mono font-bold text-slate-700 hover:text-[#7C248C] flex items-center gap-1.5 transition"
                                    >
                                      <Download className="w-3 h-3 text-[#7C248C]" /> {res.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            No lessons added to this module yet. Click "HTML Lesson Studio" above to create one.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Layers className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No syllabus modules created yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create structured chapters and learning modules to start publishing lessons and materials.
              </p>
              <button
                onClick={() => {
                  setEditingModule(null);
                  setModuleForm({ title: "", description: "", orderIndex: 1 });
                  setIsModuleModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl jvm-gradient-bg text-white font-bold text-xs"
              >
                Add First Module
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: ASSESSMENTS & QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#7C248C]" /> Assessments & Quizzes ({totalQuizzes})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluations, tests, and quizzes linked to this course container.
              </p>
            </div>

            <Link
              href="/trainer/quizzes"
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Manage All Quizzes
            </Link>
          </div>

          {course.quizzes && course.quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between"
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
                Quizzes can be created inside individual lessons through the HTML Lesson Studio or globally in the Quiz Manager.
              </p>
              <Link
                href="/trainer/quizzes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-[#7C248C] font-bold text-xs"
              >
                Go to Quiz Hub <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ASSIGNMENTS & PROJECTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#7C248C]" /> Practical Tasks & Projects ({totalAssignments})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Coding assignments, case studies, and practical projects assigned under this course.
              </p>
            </div>

            <Link
              href="/trainer/assignments"
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Review Submissions
            </Link>
          </div>

          {course.assignments && course.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.assignments.map((asgn) => (
                <div
                  key={asgn.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-mono font-bold">
                        {asgn.totalMarks} Marks Max
                      </span>
                      {asgn.deadline && (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-pink-500" />
                          {new Date(asgn.deadline).toLocaleDateString()}
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

                    <Link
                      href="/trainer/assignments"
                      className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1"
                    >
                      Grade Submissions <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileCheck className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No projects or assignments linked yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Attach practical coding tasks or homework inside individual lessons or create them in the Assignments Hub.
              </p>
              <Link
                href="/trainer/assignments"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-[#7C248C] font-bold text-xs"
              >
                Go to Assignments Hub <ChevronRight className="w-3.5 h-3.5" />
              </Link>
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

            <Link
              href="/trainer/live-classes"
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Schedule Live Class
            </Link>
          </div>

          {course.liveClasses && course.liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.liveClasses.map((cls) => {
                const isCompleted = cls.status === "COMPLETED";
                const isLive = cls.status === "LIVE";
                const isScheduled = cls.status === "SCHEDULED";

                // Calculate real attendance from attendance records
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
                          {new Date(cls.scheduledDate).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
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
                Host live lectures, code reviews, and interactive Q&A sessions with enrolled student cohorts.
              </p>
              <Link
                href="/trainer/live-classes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-[#7C248C] font-bold text-xs"
              >
                Schedule Class Now <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: ASSIGNED BATCHES ---------------- */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7C248C]" /> Assigned Batches & Cohorts ({course.batches.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active student cohorts and schedules mapped to this course container.
              </p>
            </div>

            <Link
              href="/trainer/batches"
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
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 font-mono">
                        {b.status}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-base">{b.name}</h4>
                    {b.startDate && b.endDate && (
                      <p className="text-xs text-slate-500 font-mono">
                        {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-700 flex justify-between items-center">
                    <span>Enrolled Cohort Size:</span>
                    <span className="text-[#7C248C] font-bold font-mono text-sm">
                      {b._count?.students ?? 0} Learners
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Layers className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No active batches mapped to this course</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Batches are created and assigned to courses by institute administrators.
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
                <Users className="w-5 h-5 text-[#7C248C]" /> Enrolled Students Directory ({course.enrollments.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect student completion progress, current lesson progress, and cohort assignments.
              </p>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#7C248C] text-xs font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Read-Only • Admin-Managed Enrollment
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

          {filteredEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnrollments.map((en) => {
                const prog = en.user.courseProgresses?.[0];
                const pct = prog ? prog.progressPercent : 0;

                return (
                  <div key={en.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-[#7C248C] font-black text-xs flex items-center justify-center font-mono">
                          {en.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">{en.user.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{en.user.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-[#7C248C] border border-purple-200">
                        {en.batch?.name || "Unassigned"}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-500">Course Progress:</span>
                        <strong className="text-[#7C248C] font-black">{pct.toFixed(1)}%</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="jvm-gradient-bg h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-12 h-12 text-purple-400 mx-auto" />
              <p className="text-xs text-slate-500">No students matching criteria found.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 8: LEARNING RESOURCES ---------------- */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#7C248C]" /> Learning Resources & Datasets ({totalResources})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Downloadable course materials, PDFs, code archives, datasets, and presentation slides.
              </p>
            </div>

            <Link
              href="/trainer/content"
              className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Global Content Hub
            </Link>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
            {totalResources > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.modules.flatMap((m) =>
                  m.lessons.flatMap((l) =>
                    l.resources.map((res) => (
                      <div key={res.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between shadow-xs">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-[#7C248C] border border-purple-200 font-bold">
                              {res.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Lesson: {l.title}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{res.title}</h3>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <a
                            href={res.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#7C248C] hover:text-purple-900 flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Asset
                          </a>

                          <button
                            onClick={() => setDeletingTarget({ type: "resource", id: res.id, title: res.title })}
                            className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                No learning resources uploaded yet. Add them directly inside lessons using the HTML Lesson Studio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Add/Edit Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleModuleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingModule ? "Edit Module" : "Add Module"}</h3>
              <button type="button" onClick={() => setIsModuleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Introduction to Advanced Concepts"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of this module..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModuleModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold text-xs flex items-center gap-2 shadow-xs">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Module
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-sm w-full space-y-4 text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Delete {deletingTarget.type.toUpperCase()}?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete "{deletingTarget.title}"?
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setDeletingTarget(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
