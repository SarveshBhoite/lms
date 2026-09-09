"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Layers,
  FileCode2,
  Users,
  ShieldAlert,
  Clock,
  Search,
  SlidersHorizontal,
  Sparkles,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileText,
  HelpCircle,
  Video,
} from "lucide-react";

export interface CourseCatalogItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  level: string;
  status: string;
  durationHours: number;
  createdAt: string | Date;
  modules: {
    id: string;
    lessons: { id: string }[];
  }[];
  enrollments: { id: string }[];
  batches: { id: string }[];
}

export default function TrainerCoursesClient({
  courses,
  isAdmin,
}: {
  courses: CourseCatalogItem[];
  isAdmin: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Summary Metrics
  const totalCourses = courses.length;
  const totalBatches = courses.reduce((acc, c) => acc + c.batches.length, 0);
  const totalLearners = courses.reduce((acc, c) => acc + c.enrollments.length, 0);
  const totalModules = courses.reduce((acc, c) => acc + c.modules.length, 0);
  const totalLessons = courses.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.lessons.length, 0),
    0
  );

  // Filtered List
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel =
        selectedLevel === "ALL" || c.level.toUpperCase() === selectedLevel.toUpperCase();

      const matchesStatus =
        selectedStatus === "ALL" || c.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [courses, searchQuery, selectedLevel, selectedStatus]);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Compact Studio Header Banner (~10% vh, matching JVM Institute studio standard) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Faculty Curriculum Command
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Assigned Courses 📚
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {totalCourses} Courses • {totalBatches} Cohorts • {totalLearners} Active Learners
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAdmin ? "Admin Super Faculty Mode" : "Core Creation Admin-Controlled"}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Courses</div>
          <div className="text-2xl font-black text-slate-900">{totalCourses}</div>
          <div className="text-[11px] font-mono text-[#7C248C] font-semibold">Active Curriculum</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Cohorts</div>
          <div className="text-2xl font-black text-slate-900">{totalBatches}</div>
          <div className="text-[11px] font-mono text-purple-600 font-semibold">Live Batches</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Learners</div>
          <div className="text-2xl font-black text-[#1E2B88]">{totalLearners}</div>
          <div className="text-[11px] font-mono text-indigo-600 font-semibold">Enrolled Students</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Course Modules</div>
          <div className="text-2xl font-black text-slate-900">{totalModules}</div>
          <div className="text-[11px] font-mono text-pink-600 font-semibold">Curriculum Chapters</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lesson Units</div>
          <div className="text-2xl font-black text-slate-900">{totalLessons}</div>
          <div className="text-[11px] font-mono text-emerald-600 font-semibold">Lectures & Code</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assigned courses by title, topic, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
          />
        </div>

        {/* Filter Dropdowns / Chips */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Level:</span>
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const courseLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

            return (
              <div
                key={course.id}
                className="group rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={
                        course.thumbnailUrl ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full backdrop-blur-md text-white font-mono text-[10px] font-black uppercase tracking-wider ${
                          course.status === "PUBLISHED"
                            ? "bg-emerald-600/85"
                            : "bg-amber-600/85"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-mono text-[10px] font-bold uppercase">
                      {course.level}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90 text-xs font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        {course.durationHours ? `${course.durationHours} Hours` : "Self-Paced"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {course.enrollments.length} Learners
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg line-clamp-1 group-hover:text-[#7C248C] transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono text-xs">
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Modules</div>
                        <strong className="text-slate-900 text-sm">{course.modules.length}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Lessons</div>
                        <strong className="text-slate-900 text-sm">{courseLessons}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                        <div className="text-[10px] text-[#7C248C] font-bold uppercase">Batches</div>
                        <strong className="text-[#7C248C] text-sm">{course.batches.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-6 pt-0 space-y-2">
                  <Link
                    href={`/trainer/courses/${course.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Manage Course Cockpit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {course.modules.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/trainer/courses/${course.id}?tab=modules`}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-bold text-center transition"
                      >
                        Modules ({course.modules.length})
                      </Link>
                      <Link
                        href={`/trainer/courses/${course.id}?tab=students`}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-bold text-center transition"
                      >
                        Students ({course.enrollments.length})
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-purple-400" />
          <h3 className="text-base font-bold text-slate-800">No matching courses found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedLevel !== "ALL" || selectedStatus !== "ALL"
              ? "Try adjusting your search criteria or resetting filters to view assigned courses."
              : "No courses currently assigned to your faculty profile. Contact institute administration to assign courses."}
          </p>
          {(searchQuery || selectedLevel !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLevel("ALL");
                setSelectedStatus("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 text-[#7C248C] text-xs font-bold hover:bg-purple-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
