"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Calendar,
  Users,
  Video,
  Plus,
  ArrowRight,
  Search,
  Sparkles,
  BookOpen,
  GraduationCap,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export interface BatchListItem {
  id: string;
  name: string;
  courseId: string;
  startDate: string | Date;
  endDate: string | Date;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED" | string;
  course: {
    title: string;
    slug: string;
  };
  students: { id: string }[];
  trainers: { trainer: { name: string } }[];
  liveClasses: { id: string; status: string }[];
}

export default function TrainerBatchesClient({
  batches,
  isAdmin,
}: {
  batches: BatchListItem[];
  isAdmin: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");

  // Unique list of courses from batches
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    batches.forEach((b) => {
      if (b.course) map.set(b.course.title, b.course.title);
    });
    return Array.from(map.values()).sort();
  }, [batches]);

  // Metrics
  const totalBatches = batches.length;
  const activeBatchesCount = batches.filter(
    (b) => b.status === "ONGOING" || b.status === "UPCOMING"
  ).length;
  const totalEnrolledStudents = batches.reduce((acc, b) => acc + b.students.length, 0);
  const totalLiveSessions = batches.reduce((acc, b) => acc + b.liveClasses.length, 0);
  const completedBatchesCount = batches.filter((b) => b.status === "COMPLETED").length;

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.course.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        selectedStatus === "ALL" || b.status.toUpperCase() === selectedStatus.toUpperCase();

      const matchCourse = selectedCourse === "ALL" || b.course.title === selectedCourse;

      return matchSearch && matchStatus && matchCourse;
    });
  }, [batches, searchQuery, selectedStatus, selectedCourse]);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "ONGOING") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-200";
    }
    if (s === "UPCOMING") {
      return "bg-purple-50 text-[#7C248C] border-purple-200";
    }
    if (s === "COMPLETED") {
      return "bg-slate-100 text-slate-600 border-slate-200";
    }
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Cohort Operations
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Academic Batches 🎓
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {totalBatches} Cohorts • {totalEnrolledStudents} Active Learners • {totalLiveSessions} Live Sessions
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            href="/trainer/batches/create"
            className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create New Batch
          </Link>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cohorts</div>
          <div className="text-2xl font-black text-slate-900">{totalBatches}</div>
          <div className="text-[11px] font-mono text-[#7C248C] font-semibold">Assigned Batches</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active / Upcoming</div>
          <div className="text-2xl font-black text-emerald-600">{activeBatchesCount}</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">In-Progress Cohorts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Learners Enrolled</div>
          <div className="text-2xl font-black text-[#1E2B88]">{totalEnrolledStudents}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">Batch Students</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Classes</div>
          <div className="text-2xl font-black text-cyan-600">{totalLiveSessions}</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">Google Meet Classes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Concluded</div>
          <div className="text-2xl font-black text-slate-700">{completedBatchesCount}</div>
          <div className="text-[11px] font-mono text-slate-500 font-semibold">Graduated Cohorts</div>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batches by cohort name or course title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="ONGOING">Ongoing</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {uniqueCourses.length > 1 && (
            <>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Course:</span>
              </div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition max-w-[180px] truncate"
              >
                <option value="ALL">All Courses</option>
                {uniqueCourses.map((cTitle) => (
                  <option key={cTitle} value={cTitle}>
                    {cTitle}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* 4. Batches Grid Cards */}
      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const startDateStr = new Date(batch.startDate).toLocaleDateString();
            const endDateStr = new Date(batch.endDate).toLocaleDateString();
            const trainersList = batch.trainers.map((t) => t.trainer.name).join(", ") || "Faculty Assigned";

            return (
              <div
                key={batch.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  {/* Top Badge & Date Range */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border font-mono ${getStatusBadge(
                        batch.status
                      )}`}
                    >
                      {batch.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {startDateStr} – {endDateStr}
                    </span>
                  </div>

                  {/* Course Title & Batch Name */}
                  <div>
                    <span className="text-[11px] font-mono text-[#7C248C] font-bold block mb-1 truncate">
                      📚 {batch.course.title}
                    </span>
                    <h3 className="font-black text-slate-900 text-lg group-hover:text-[#7C248C] transition line-clamp-1">
                      {batch.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      Instructor: {trainersList}
                    </p>
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                    <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/80">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
                        Enrolled Cohort
                      </span>
                      <strong className="text-slate-900 text-base font-black">
                        {batch.students.length} Learners
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/80">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
                        Live Sessions
                      </span>
                      <strong className="text-[#7C248C] text-base font-black">
                        {batch.liveClasses.length} Classes
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/trainer/batches/${batch.id}`}
                    className="flex-1 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Manage Cohort Cockpit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/trainer/live-classes`}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7C248C] border border-slate-200 transition shrink-0"
                    title="Live Meet Sessions"
                  >
                    <Video className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Layers className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No batches found matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedStatus !== "ALL" || selectedCourse !== "ALL"
              ? "Try adjusting your search criteria or reset filters to view all cohorts."
              : "No batches mapped to your trainer account yet. Click 'Create New Batch' to start a new student cohort."}
          </p>
          {(searchQuery || selectedStatus !== "ALL" || selectedCourse !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
                setSelectedCourse("ALL");
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
