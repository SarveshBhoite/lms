"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Layers,
  Video,
  FileText,
  FileCode2,
  Trash2,
  Edit,
  ArrowLeft,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Globe,
  Lock,
} from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  contentType: string;
  durationMinutes: number;
  contentUrl?: string;
  orderIndex: number;
}

interface ModuleItem {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: LessonItem[];
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  level: string;
  durationHours: number;
  modules: ModuleItem[];
}

export default function TrainerCourseCurriculumPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Module Modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  // Add Lesson Modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContentType, setLessonContentType] = useState("VIDEO");
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonContentUrl, setLessonContentUrl] = useState("");
  const [addingLesson, setAddingLesson] = useState(false);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trainer/courses?courseId=${courseId}`);
      const data = await res.json();
      if (data.success && data.course) {
        setCourse(data.course);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleTogglePublish = async () => {
    if (!course) return;
    setPublishing(true);
    const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      const res = await fetch("/api/trainer/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCourse({ ...course, status: newStatus });
        setSuccessMsg(`Course successfully ${newStatus === "PUBLISHED" ? "Published to Public Catalog" : "Unpublished to Draft"}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!confirm(`Are you sure you want to delete course "${course.title}"? This will permanently delete all its modules and lessons.`)) return;

    try {
      const res = await fetch(`/api/trainer/courses?courseId=${course.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/trainer/courses");
      }
    } catch {
      // ignore
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingModule(true);

    try {
      const res = await fetch("/api/trainer/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MODULE",
          courseId,
          title: moduleTitle,
          description: moduleDesc,
          orderIndex: (course?.modules.length || 0) + 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModuleModalOpen(false);
        setModuleTitle("");
        setModuleDesc("");
        fetchCourse();
      }
    } catch {
      // ignore
    } finally {
      setAddingModule(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleId) return;
    setAddingLesson(true);

    try {
      const res = await fetch("/api/trainer/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "LESSON",
          moduleId: activeModuleId,
          title: lessonTitle,
          contentType: lessonContentType,
          durationMinutes: Number(lessonDuration),
          contentUrl: lessonContentUrl || undefined,
          orderIndex: 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLessonModalOpen(false);
        setLessonTitle("");
        setLessonContentUrl("");
        fetchCourse();
      }
    } catch {
      // ignore
    } finally {
      setAddingLesson(false);
    }
  };

  const handleDeleteItem = async (type: "MODULE" | "LESSON", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) return;

    try {
      const res = await fetch(`/api/trainer/curriculum?type=${type}&id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchCourse();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 max-w-4xl mx-auto glass-panel mt-12 rounded-3xl border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
        Loading curriculum studio...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center text-slate-400 max-w-lg mx-auto glass-panel mt-12 rounded-3xl border border-slate-800 space-y-3">
        <p className="font-bold text-white">Course Track Not Found</p>
        <Link href="/trainer/courses" className="text-amber-400 font-bold underline mt-2 block">
          Return to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl w-full mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Courses
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/trainer/courses/${course.id}/edit`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Metadata
          </Link>

          <button
            onClick={handleDeleteCourse}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Course
          </button>

          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer ${
              course.status === "PUBLISHED"
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
            }`}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : course.status === "PUBLISHED" ? (
              <>
                <Lock className="w-3.5 h-3.5" /> Unpublish (Set to Draft)
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" /> Publish Course
              </>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* Header Info */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full font-mono border ${
              course.status === "PUBLISHED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            Status: {course.status}
          </span>
          <span className="text-xs text-slate-400 font-mono">Level: {course.level}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{course.title}</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{course.description}</p>
      </div>

      {/* Curriculum Studio Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Syllabus Modules & Lessons ({course.modules.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Organize lessons into chronological module units.</p>
          </div>

          <button
            onClick={() => setModuleModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Syllabus Module
          </button>
        </div>

        {course.modules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-amber-400/40" />
            <p className="text-sm font-semibold text-slate-300">Curriculum is Currently Empty</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Add Syllabus Module&quot; above to initialize your first teaching module unit.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {course.modules.map((mod, modIdx) => (
              <div
                key={mod.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                      Module {modIdx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">{mod.title}</h3>
                    {mod.description && <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveModuleId(mod.id);
                        setLessonModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/20 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Lesson
                    </button>
                    <button
                      onClick={() => handleDeleteItem("MODULE", mod.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-2 pt-1">
                  {mod.lessons.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">
                      No lessons added yet. Click &quot;Add Lesson&quot; to attach content.
                    </div>
                  ) : (
                    mod.lessons.map((les, lesIdx) => (
                      <div
                        key={les.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-500">{lesIdx + 1}.</span>
                          <span className="font-bold text-white">{les.title}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]">
                            {les.contentType}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{les.durationMinutes} mins</span>
                        </div>

                        <button
                          onClick={() => handleDeleteItem("LESSON", les.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" /> Add Syllabus Module Unit
              </h3>
              <button
                onClick={() => setModuleModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Module Unit Title
                </label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Module 1: Distributed State & Micro-Frontends"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Unit Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  placeholder="Overview of topics and objectives covered in this module..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingModule}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  {addingModule ? <Loader2 className="w-4 h-4 animate-spin" /> : "Attach Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" /> Add Lesson Item to Module
              </h3>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Setting Up Redis Cache Clusters"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Content Type
                  </label>
                  <select
                    value={lessonContentType}
                    onChange={(e) => setLessonContentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  >
                    <option value="VIDEO">VIDEO</option>
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="CODE">CODE</option>
                    <option value="TEXT">TEXT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Content / Video Stream URL (Optional)
                </label>
                <input
                  type="url"
                  value={lessonContentUrl}
                  onChange={(e) => setLessonContentUrl(e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLesson}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  {addingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : "Attach Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
