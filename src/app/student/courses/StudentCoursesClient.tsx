"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Play,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

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

  // Calculate high-level summary metrics
  const totalCourses = initialEnrollments.length;
  const completedCoursesCount = initialEnrollments.filter((e) => e.progressPercent >= 100).length;
  const inProgressCoursesCount = initialEnrollments.filter((e) => e.progressPercent > 0 && e.progressPercent < 100).length;

  return (
    <div className="space-y-8">
      {/* Overview Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-2 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">Total Enrolled</span>
            <div className="text-2xl font-extrabold text-slate-900">{totalCourses} Courses</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-[#7C248C] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-2 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">In Progress</span>
            <div className="text-2xl font-extrabold text-[#1E2B88]">{inProgressCoursesCount} Active</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E2B88] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-2 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">Completed</span>
            <div className="text-2xl font-extrabold text-emerald-700">{completedCoursesCount} Finished</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Premium Search & Filter Console */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-purple-200/50 via-slate-100 to-indigo-200/50 shadow-sm">
        <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/80">
          {/* Stylized Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C] transition group-focus-within:bg-[#7C248C] group-focus-within:text-white group-focus-within:scale-105 shadow-2xs">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course title, trainer, cohort or topic..."
              className="w-full pl-13 pr-10 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold flex items-center justify-center transition cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Level Filter Bar with Icon & Result Badge */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              {[
                { id: "ALL", label: "All Levels" },
                { id: "BEGINNER", label: "Beginner" },
                { id: "INTERMEDIATE", label: "Intermediate" },
                { id: "ADVANCED", label: "Advanced" },
              ].map((lvl) => {
                const isSelected = levelFilter === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setLevelFilter(lvl.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>

            {/* Showing Count Indicator */}
            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#7C248C] font-mono text-[11px] font-bold shrink-0">
              {filtered.length} {filtered.length === 1 ? "Program" : "Programs"}
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((en) => {
            const isFinished = en.progressPercent >= 100;

            return (
              <div
                key={en.id}
                className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* Course Header Surface */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60 shadow-2xs truncate max-w-[170px]">
                      {en.batch?.name || "Assigned Cohort"}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                        en.course.level === "ADVANCED"
                          ? "bg-pink-50 text-[#E01E6A] border-pink-200"
                          : en.course.level === "INTERMEDIATE"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {en.course.level}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#7C248C] transition">
                      {en.course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {en.course.description || "Comprehensive academic curriculum covering foundational and practical concepts."}
                    </p>
                  </div>

                  {/* Metadata Spec Box */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs font-mono space-y-2 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Instructor:</span>
                      <strong className="text-[#7C248C] font-bold">{en.course.trainer.name}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Lessons Completed:</span>
                      <strong className="text-slate-900 font-bold">
                        {en.completedLessonsCount} / {en.course.totalLessons}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500">Curriculum Length:</span>
                      <strong className="text-slate-700 font-bold">
                        {en.course.durationHours > 0 ? `${en.course.durationHours} Hours` : "Multi-week program"}
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-600">
                      <span>Curriculum Status:</span>
                      <strong className={isFinished ? "text-emerald-700 font-extrabold" : "text-slate-900 font-bold"}>
                        {isFinished ? "100% Completed" : `${en.progressPercent.toFixed(1)}%`}
                      </strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isFinished ? "bg-emerald-500" : "jvm-gradient-bg"
                        }`}
                        style={{ width: `${Math.min(en.progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="p-6 pt-0">
                  <Link
                    href={`/student/courses/${en.courseId}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isFinished ? "Review Course Studio" : "Open Course Studio"}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No enrolled courses matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
