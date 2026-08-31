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

interface CourseDetailData {
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
  batches: { id: string; name: string; status: string }[];
}

export default function TrainerCourseClient({ initialCourse }: { initialCourse: CourseDetailData }) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetailData>(initialCourse);
  const [activeTab, setActiveTab] = useState<"overview" | "modules" | "resources" | "students">("overview");

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

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      {/* Course Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {course.status}
          </span>
          <span className="text-xs text-slate-500 font-mono">{course.level}</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900">{course.title}</h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">{course.description}</p>
      </div>

      {/* 4 Main Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview & Statistics
        </button>

        <button
          onClick={() => setActiveTab("modules")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "modules"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Modules & Lessons ({totalModules}/{totalLessons})
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "resources"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCode2 className="w-4 h-4" /> Learning Resources ({totalResources})
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "batches"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Assigned Batches ({course.batches.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Enrolled Students ({course.enrollments.length})
        </button>
      </div>

      {/* ---------------- SECTION 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Modules</div>
              <div className="text-2xl font-black text-slate-900">{totalModules}</div>
              <div className="text-[10px] text-amber-700 font-mono">Curriculum Chapters</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Lessons</div>
              <div className="text-2xl font-black text-slate-900">{totalLessons}</div>
              <div className="text-[10px] text-cyan-700 font-mono">Lectures & Code</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Learning Resources</div>
              <div className="text-2xl font-black text-slate-900">{totalResources}</div>
              <div className="text-[10px] text-emerald-700 font-mono">PDFs, Code & Links</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enrolled Students</div>
              <div className="text-2xl font-black text-indigo-600">{course.enrollments.length}</div>
              <div className="text-[10px] text-slate-500 font-mono">Learners</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Batches</div>
              <div className="text-2xl font-black text-purple-600">{course.batches.length}</div>
              <div className="text-[10px] text-slate-500 font-mono">Cohorts</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Course Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 font-mono">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500">DESCRIPTION</div>
                <p className="text-slate-800 text-xs leading-relaxed">{course.description}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500">ASSIGNED INSTRUCTOR</div>
                <div className="text-sm font-bold text-amber-700">{course.trainer.name} ({course.trainer.email})</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: MODULES & LESSONS ---------------- */}
      {activeTab === "modules" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Curriculum Modules & Lessons</h2>
              <p className="text-xs text-slate-500">
                Add, edit, reorder, or remove syllabus modules and lesson contents.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingModule(null);
                setModuleForm({ title: "", description: "", orderIndex: course.modules.length + 1 });
                setIsModuleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          {course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((mod, mIdx) => (
                <div key={mod.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-amber-700 font-mono">Module {mIdx + 1}</div>
                      <h3 className="text-lg font-bold text-slate-900">{mod.title}</h3>
                      {mod.description && <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/create`}
                        className="px-3 py-1.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1 transition shadow-xs hover:scale-[1.02]"
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
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Edit Module"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingTarget({ type: "module", id: mod.id, title: mod.title })}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons under this module */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {mod.lessons.length > 0 ? (
                      mod.lessons.map((les, lIdx) => (
                        <div key={les.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-purple-50 text-[#7C248C]">
                                {getContentTypeIcon(les.contentType)}
                              </div>
                              <Link
                                href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/${les.id}/edit`}
                                className="text-xs font-bold text-slate-900 hover:text-[#7C248C] transition"
                              >
                                {lIdx + 1}. {les.title}
                              </Link>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">({les.contentType})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono">{les.durationMinutes} mins</span>
                              <Link
                                href={`/trainer/courses/${course.id}/modules/${mod.id}/lessons/${les.id}/edit`}
                                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-[11px] border border-purple-200 flex items-center gap-1 transition"
                                title="Open HTML Studio"
                              >
                                <Edit2 className="w-3 h-3" /> Edit Studio
                              </Link>
                              <button
                                onClick={() => setDeletingTarget({ type: "lesson", id: les.id, title: les.title })}
                                className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {les.contentUrl && (
                            <div className="pl-6 text-[11px] font-mono text-cyan-700 truncate">
                              URL: {les.contentUrl}
                            </div>
                          )}

                          {/* Attached Lesson Resources */}
                          {les.resources.length > 0 && (
                            <div className="pl-6 pt-1 flex flex-wrap gap-2">
                              {les.resources.map((res) => (
                                <a
                                  key={res.id}
                                  href={res.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-[10px] font-mono font-bold text-slate-700 hover:text-[#7C248C] flex items-center gap-1.5 shadow-xs transition"
                                >
                                  <Download className="w-3 h-3 text-[#7C248C]" /> {res.title} ({res.fileType.split("/")[1]?.toUpperCase() || "FILE"})
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">No lessons added to this module yet.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Layers className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No syllabus modules created</h3>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 3: LEARNING RESOURCES ---------------- */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#7C248C]" /> Course Learning Resources & Datasets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All attached PDFs, datasets, slides, source code archives, and reference documentation.
              </p>
            </div>

            <Link
              href="/trainer/content"
              className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Global Content Library
            </Link>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
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
              <div className="p-12 text-center text-xs text-slate-500">No learning resources uploaded yet. Add them directly inside the HTML Lesson Studio.</div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SECTION: ASSIGNED BATCHES ---------------- */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7C248C]" /> Assigned Batches & Cohorts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active student cohorts and schedules mapped to this course container.
              </p>
            </div>

            <Link
              href="/trainer/batches"
              className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Manage All Batches
            </Link>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
            {course.batches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {course.batches.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                          {b.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                      {b.startDate && b.endDate && (
                        <p className="text-xs text-slate-500 font-mono">
                          {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
                      <span>Students Enrolled:</span>
                      <span className="text-[#7C248C] font-bold font-mono text-sm">
                        {b._count?.students ?? 0} Learners
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                No active or upcoming batches assigned to this course yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 4: STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course Enrolled Students</h2>
              <p className="text-xs text-slate-500">
                View student learning progress percentages and cohort mappings. Read-only administrative controls.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Account Edits Disabled
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
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
                const prog = en.user.courseProgresses[0];
                const pct = prog ? prog.progressPercent : 0;

                return (
                  <div key={en.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{en.user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{en.user.email}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {en.batch?.name || "Unassigned"}
                      </span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-500">Progress:</span>
                        <strong className="text-amber-700">{pct.toFixed(1)}%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No students matching criteria found.</p>
            </div>
          )}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of this module..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModuleModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Module
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson Add/Edit Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleLessonSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{editingLesson ? "Edit Lesson" : "Add Lesson"}</h3>
              <button type="button" onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asynchronous Code Execution"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Content Type</label>
                  <select
                    value={lessonForm.contentType}
                    onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  >
                    <option value="VIDEO">Video Stream</option>
                    <option value="TEXT">Text Article</option>
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">Presentation (PPT)</option>
                    <option value="DOC">Document (DOC)</option>
                    <option value="LINK">External Link</option>
                    <option value="CODE">Source Code</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={lessonForm.durationMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Device Video Upload Box */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-dashed border-cyan-300 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">Upload Video File from Device</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition inline-flex items-center gap-1.5">
                    {uploadingLessonVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingLessonVideo ? "Uploading Video..." : "Choose Video File"}
                    <input
                      type="file"
                      accept="video/*"
                      disabled={uploadingLessonVideo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingLessonVideo(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("category", "lessons");
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const data = await res.json();
                          if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");

                          setLessonForm((prev) => ({
                            ...prev,
                            contentUrl: data.data.url,
                            contentType: "VIDEO",
                          }));
                          showToast("success", `Video file "${data.data.fileName}" uploaded!`);
                        } catch (err: any) {
                          showToast("error", err.message || "Failed to upload video");
                        } finally {
                          setUploadingLessonVideo(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {lessonForm.contentUrl && (
                    <span className="text-[10px] font-mono text-cyan-800 font-bold truncate max-w-[200px]">
                      {lessonForm.contentUrl}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Content URL / Video Path</label>
                <input
                  type="text"
                  placeholder="/uploads/lessons/... or https://..."
                  value={lessonForm.contentUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsLessonModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading || uploadingLessonVideo} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Lesson
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resource Add Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleResourceSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Learning Resource / Lesson Note</h3>
              <button type="button" onClick={() => setIsResourceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1 Lecture Notes PDF"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Device File Upload Box */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-dashed border-amber-300 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">Upload File from Device</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition inline-flex items-center gap-1.5">
                    {uploadingResource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingResource ? "Uploading..." : "Browse Device Files"}
                    <input
                      type="file"
                      disabled={uploadingResource}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingResource(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("category", "lessons");
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const data = await res.json();
                          if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");

                          setResourceForm((prev) => ({
                            ...prev,
                            title: prev.title || file.name,
                            fileUrl: data.data.url,
                            fileType: data.data.fileType,
                          }));
                          showToast("success", `File "${data.data.fileName}" uploaded!`);
                        } catch (err: any) {
                          showToast("error", err.message || "Failed to upload file");
                        } finally {
                          setUploadingResource(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {resourceForm.fileUrl && (
                    <span className="text-[10px] font-mono text-amber-800 font-bold truncate max-w-[200px]">
                      {resourceForm.fileUrl}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">File Type</label>
                <input
                  type="text"
                  placeholder="PDF, ZIP, CODE, PPT, LINK, DATASET"
                  value={resourceForm.fileType}
                  onChange={(e) => setResourceForm({ ...resourceForm, fileType: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">File or Download URL *</label>
                <input
                  type="text"
                  required
                  placeholder="/uploads/lessons/... or https://..."
                  value={resourceForm.fileUrl}
                  onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsResourceModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading || uploadingResource} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Resource
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
