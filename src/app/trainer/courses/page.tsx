"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Layers,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
  Video,
  FileText,
  Target,
  GraduationCap,
  ListOrdered,
  FileCode,
  Users,
  Check,
} from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  contentType: "VIDEO" | "PDF" | "PPT" | "DOC" | "CODE" | "LINK" | "TEXT";
  durationMinutes: number;
  resources?: Array<{ id: string; fileType: string }>;
}

interface ModuleItem {
  id: string;
  title: string;
  lessons: LessonItem[];
}

interface CourseCardItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  durationHours: number;
  level: string;
  status: string;
  objectives?: string[];
  prerequisites?: string[];
  modules: ModuleItem[];
  enrollments: Array<{ id: string }>;
}

export default function TrainerCoursesPage() {
  const [courses, setCourses] = useState<CourseCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trainer/courses");
      const data = await res.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete course "${courseTitle}"? This will permanently remove its syllabus modules and lessons.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/trainer/courses?courseId=${courseId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Course "${courseTitle}" deleted successfully.`);
        await fetchCourses();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.error || "Failed to delete course");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to delete course.");
      }
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Curriculum Studio & Authoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Assigned Courses & Curricula
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Author comprehensive curricula with rich thumbnails, objectives, prerequisites, modules, video lessons, and PDF resources.
          </p>
        </div>

        <Link
          href="/trainer/courses/create"
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Course
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
          Loading assigned courses & curricula...
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Courses Created Yet</h3>
          <p className="text-xs text-slate-400">
            Click &quot;Create New Course&quot; above to initialize your first syllabus track.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((c) => {
            const isPublished = c.status === "PUBLISHED";
            const allLessons = c.modules?.flatMap((m) => m.lessons || []) || [];
            const totalLessons = allLessons.length;
            const videoCount = allLessons.filter((l) => l.contentType === "VIDEO").length;
            const pdfCount = allLessons.filter((l) => l.contentType === "PDF").length;
            const objectivesList = Array.isArray(c.objectives) ? c.objectives : [];
            const prerequisitesList = Array.isArray(c.prerequisites) ? c.prerequisites : [];

            return (
              <div
                key={c.id}
                className="glass-panel rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-amber-500/40 transition shadow-2xl relative group overflow-hidden"
              >
                {/* Thumbnail Image Banner */}
                <div className="relative w-full h-44 sm:h-48 bg-slate-900 overflow-hidden border-b border-slate-800">
                  {c.thumbnailUrl ? (
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 flex items-center justify-center p-6 text-center">
                      <div className="space-y-1">
                        <BookOpen className="w-10 h-10 text-amber-500/40 mx-auto" />
                        <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
                          Course Thumbnail
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Level & Status Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full backdrop-blur-md border font-mono ${
                        isPublished
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-950/80 text-indigo-300 border border-indigo-500/30 backdrop-blur-md font-mono">
                      {c.level}
                    </span>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 text-white border border-slate-700 backdrop-blur-md font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> {c.durationHours}h
                    </span>
                    <button
                      onClick={() => handleDeleteCourse(c.id, c.title)}
                      className="p-1.5 rounded-full bg-slate-950/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer backdrop-blur-md"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Course Content Body */}
                <div className="p-6 sm:p-7 space-y-4">
                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  </div>

                  {/* Content Stats Bar: Modules, Lessons, Videos, PDFs, Enrolled */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Modules</div>
                      <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                        {c.modules?.length || 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Lessons</div>
                      <div className="text-sm font-extrabold text-indigo-300 font-mono mt-0.5">
                        {totalLessons}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
                        <Video className="w-3 h-3 text-cyan-400" /> Videos
                      </div>
                      <div className="text-sm font-extrabold text-cyan-300 font-mono mt-0.5">
                        {videoCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
                        <FileText className="w-3 h-3 text-purple-400" /> PDFs / Docs
                      </div>
                      <div className="text-sm font-extrabold text-purple-300 font-mono mt-0.5">
                        {pdfCount}
                      </div>
                    </div>
                  </div>

                  {/* Objectives & Prerequisites Pills */}
                  {(objectivesList.length > 0 || prerequisitesList.length > 0) && (
                    <div className="space-y-2 pt-1">
                      {objectivesList.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-amber-400 font-mono flex items-center gap-1">
                            <Target className="w-3 h-3" /> Learning Objectives:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {objectivesList.slice(0, 3).map((obj, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                              >
                                ✓ {obj}
                              </span>
                            ))}
                            {objectivesList.length > 3 && (
                              <span className="text-[10px] text-slate-500 self-center">
                                +{objectivesList.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {prerequisitesList.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-indigo-400 font-mono flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> Prerequisites:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {prerequisitesList.slice(0, 2).map((pre, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700 text-[10px]"
                              >
                                {pre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Action Links */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {c.enrollments?.length || 0} Enrolled Scholars
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trainer/courses/${c.id}`}
                        className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition"
                      >
                        <Layers className="w-3.5 h-3.5" /> Curriculum Studio
                      </Link>

                      <Link
                        href={`/trainer/courses/${c.id}/edit`}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

