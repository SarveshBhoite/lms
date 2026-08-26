"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Plus, Layers, Edit, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface CourseCardItem {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  level: string;
  status: string;
  modules: Array<{ lessons?: Array<{ id: string }> }>;
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
    if (!confirm(`Are you sure you want to delete course "${courseTitle}"? This will permanently remove its syllabus modules and lessons.`)) {
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
            <BookOpen className="w-3.5 h-3.5" /> Curriculum Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Courses & Curricula</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Author comprehensive syllabus tracks, attach rich learning resources, and manage publishing states.
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
          Loading courses...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => {
            const isPublished = c.status === "PUBLISHED";
            const totalLessons = c.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;

            return (
              <div
                key={c.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition shadow-xl relative group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border font-mono ${
                        isPublished
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {c.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{c.level}</span>
                      <button
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between items-center font-mono text-[11px] text-slate-400">
                    <span>Duration:</span>
                    <span className="text-white font-semibold">{c.durationHours} Hours</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px] text-slate-400">
                    <span>Curriculum:</span>
                    <span className="text-white font-semibold">
                      {c.modules?.length || 0} Modules ({totalLessons} Lessons)
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px] text-slate-400">
                    <span>Enrolled Learners:</span>
                    <span className="text-amber-400 font-bold">{c.enrollments?.length || 0} Students</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/trainer/courses/${c.id}`}
                      className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md transition"
                    >
                      <Layers className="w-3.5 h-3.5" /> Curriculum
                    </Link>

                    <Link
                      href={`/trainer/courses/${c.id}/edit`}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold text-center border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Info
                    </Link>
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
