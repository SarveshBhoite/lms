"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Play, Search, Filter, Clock, User, CheckCircle2 } from "lucide-react";

interface CourseEnrollmentItem {
  id: string;
  courseId: string;
  enrolledAt: string;
  batch?: { id: string; name: string } | null;
  course: {
    id: string;
    title: string;
    description: string;
    level: string;
    durationHours: number;
    trainer: { name: string };
    totalLessons: number;
  };
  progressPercent: number;
  completedLessonsCount: number;
}

export default function StudentCoursesClient({
  initialEnrollments,
}: {
  initialEnrollments: CourseEnrollmentItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  const filtered = initialEnrollments.filter((en) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = en.course.title.toLowerCase().includes(q);
    const trainerMatch = en.course.trainer.name.toLowerCase().includes(q);
    const batchMatch = (en.batch?.name || "").toLowerCase().includes(q);

    const matchesSearch = titleMatch || trainerMatch || batchMatch;
    const matchesLevel = levelFilter === "ALL" || en.course.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search enrolled courses by title, instructor, or cohort..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Program Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((en) => (
            <div
              key={en.id}
              className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                    {en.batch?.name || "Enrolled Cohort"}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {en.course.level}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{en.course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{en.course.description}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Instructor:</span>
                    <strong className="text-[#7C248C]">{en.course.trainer.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Lessons:</span>
                    <strong className="text-slate-900">
                      {en.completedLessonsCount} / {en.course.totalLessons} Lessons
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span>Duration:</span>
                    <strong className="text-slate-700">{en.course.durationHours} Hours Curriculum</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>Course Progress:</span>
                    <strong className="text-slate-900">{en.progressPercent.toFixed(1)}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="jvm-gradient-bg h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(en.progressPercent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <Link
                href={`/student/courses/${en.courseId}`}
                className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-white" /> Open Course Studio
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No enrolled courses matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
