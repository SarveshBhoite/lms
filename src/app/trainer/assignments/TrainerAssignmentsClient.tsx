"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Users,
  ChevronRight,
  Filter,
  Trash2,
  Sparkles,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";

export interface SerializedAssignmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  moduleTitle?: string | null;
  batchIds: string[];
  batchNames: string[];
  title: string;
  description: string;
  instructions?: string | null;
  deadline: string | null;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  submissionsCount: number;
  evaluatedCount: number;
  pendingCount: number;
  revisionCount: number;
  avgScore: number | null;
  createdAt: string;
}

export interface CourseFilterItem {
  id: string;
  title: string;
}

export default function TrainerAssignmentsClient({
  initialAssignments,
  courses,
}: {
  initialAssignments: SerializedAssignmentItem[];
  courses: CourseFilterItem[];
}) {
  const [assignments, setAssignments] = useState<SerializedAssignmentItem[]>(initialAssignments);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Computed KPI Metrics
  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((acc, a) => acc + a.submissionsCount, 0);
  const totalPending = assignments.reduce((acc, a) => acc + a.pendingCount, 0);
  const totalEvaluated = assignments.reduce((acc, a) => acc + a.evaluatedCount, 0);
  const overallAvgScore =
    assignments.filter((a) => a.avgScore !== null).length > 0
      ? Math.round(
          assignments
            .filter((a) => a.avgScore !== null)
            .reduce((sum, a) => sum + (a.avgScore || 0), 0) /
            assignments.filter((a) => a.avgScore !== null).length
        )
      : null;

  // Filter logic
  const filteredAssignments = assignments.filter((asgn) => {
    const matchesSearch =
      asgn.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asgn.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asgn.lessonTitle && asgn.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asgn.moduleTitle && asgn.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      asgn.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourseId === "ALL" || asgn.courseId === selectedCourseId;

    let matchesType = true;
    if (selectedType === "STANDALONE") {
      matchesType = !asgn.lessonId;
    } else if (selectedType === "LESSON_LINKED") {
      matchesType = !!asgn.lessonId;
    }

    let matchesStatus = true;
    if (selectedStatus === "PENDING") {
      matchesStatus = asgn.pendingCount > 0;
    } else if (selectedStatus === "EVALUATED") {
      matchesStatus = asgn.pendingCount === 0 && asgn.submissionsCount > 0;
    } else if (selectedStatus === "NO_SUBMISSIONS") {
      matchesStatus = asgn.submissionsCount === 0;
    }

    return matchesSearch && matchesCourse && matchesType && matchesStatus;
  });

  const handleDelete = async (assignmentId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete the assignment "${title}" and all its student submissions?`
      )
    ) {
      return;
    }

    setDeletingId(assignmentId);
    try {
      const res = await fetch(`/api/trainer/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete assignment");
      }
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err: any) {
      alert(err.message || "Failed to delete assignment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. COMPACT STUDIO BANNER (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-pink-50/40 to-purple-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-pink-400/10 to-purple-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#7C248C] to-[#E01E6A] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <FileCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100 text-[#E01E6A] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#E01E6A]" /> Projects & Tasks Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 text-[10px] font-mono font-bold uppercase">
                Standalone Assignments
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Course & Cohort Projects
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Create practical tasks, configure deadlines, target cohorts, and grade deliverables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Link
            href="/trainer/assignments/create"
            className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create New Assignment
          </Link>
        </div>
      </div>

      {/* 2. 5 HIGH-IMPACT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#7C248C]" /> Total Assignments
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalAssignments}</span>
            <span className="text-[11px] font-mono text-slate-400">Created</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Total Submissions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{totalSubmissions}</span>
            <span className="text-[11px] font-mono text-slate-400">Received</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Review
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{totalPending}</span>
            <span className="text-[11px] font-mono text-slate-400">Needs Grading</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Graded & Done
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{totalEvaluated}</span>
            <span className="text-[11px] font-mono text-slate-400">Feedback Sent</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#E01E6A]" /> Average Grade
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#E01E6A]">
              {overallAvgScore !== null ? `${overallAvgScore}%` : "N/A"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Across Cohorts</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments by title, course, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
          </div>

          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-[#7C248C] cursor-pointer shrink-0"
          >
            <option value="ALL">All Assigned Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-[#7C248C] cursor-pointer shrink-0"
          >
            <option value="ALL">All Project Types</option>
            <option value="STANDALONE">Standalone Course Projects</option>
            <option value="LESSON_LINKED">Lesson-Linked Tasks</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-[#7C248C] cursor-pointer shrink-0"
          >
            <option value="ALL">All Evaluation Statuses</option>
            <option value="PENDING">Pending Review ({totalPending})</option>
            <option value="EVALUATED">Fully Evaluated</option>
            <option value="NO_SUBMISSIONS">No Submissions Yet</option>
          </select>
        </div>
      </div>

      {/* 4. ASSIGNMENTS GRID */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((asgn) => {
            const isOverdue = asgn.deadline ? new Date(asgn.deadline).getTime() < Date.now() : false;

            return (
              <div
                key={asgn.id}
                className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* Top Badges: Deadline & Total Marks */}
                  <div className="flex items-center justify-between">
                    {asgn.lessonTitle ? (
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        Self-Paced Lesson Task
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          asgn.deadline
                            ? isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-purple-50 text-[#7C248C] border-purple-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {asgn.deadline
                          ? `${isOverdue ? "Closed: " : "Due: "}${new Date(asgn.deadline).toLocaleDateString()}`
                          : "No Deadline"}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {asgn.lessonTitle ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                          Lesson Task
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-50 text-[#E01E6A] border border-pink-200">
                          Standalone
                        </span>
                      )}
                      <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {asgn.totalMarks}m
                      </span>
                    </div>
                  </div>

                  {/* Course & Assignment Title */}
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-[#7C248C] font-extrabold uppercase tracking-wide">
                        {asgn.courseTitle}
                      </span>
                      {asgn.lessonTitle && (
                        <span className="text-[10px] font-mono text-slate-400">
                          / {asgn.moduleTitle ? `${asgn.moduleTitle} • ` : ""}{asgn.lessonTitle}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-[#7C248C] transition leading-snug">
                      {asgn.title}
                    </h3>
                    {asgn.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {asgn.description}
                      </p>
                    )}
                  </div>

                  {/* Batch Scoping Tags */}
                  <div className="pt-1">
                    {asgn.batchNames && asgn.batchNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">Cohorts:</span>
                        {asgn.batchNames.map((bn, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] border border-purple-200/60 text-[10px] font-mono font-bold"
                          >
                            {bn}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        <Users className="w-3 h-3 text-slate-400" /> All Enrolled Students
                      </span>
                    )}
                  </div>

                  {/* Stats Matrix */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Submissions</span>
                      <strong className="text-slate-900 text-sm font-extrabold">{asgn.submissionsCount}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Pending</span>
                      <strong
                        className={`text-sm font-extrabold ${
                          asgn.pendingCount > 0 ? "text-amber-600" : "text-slate-400"
                        }`}
                      >
                        {asgn.pendingCount}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg Score</span>
                      <strong className="text-emerald-700 text-sm font-extrabold">
                        {asgn.avgScore !== null ? `${asgn.avgScore}m` : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/trainer/assignments/${asgn.id}`}
                    className="w-full py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                  >
                    <span>Inspect Deliverables & Grade</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      Graded: <strong className="text-slate-700">{asgn.evaluatedCount} / {asgn.submissionsCount}</strong>
                    </span>

                    <button
                      onClick={() => handleDelete(asgn.id, asgn.title)}
                      disabled={deletingId === asgn.id}
                      className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[#E01E6A] border border-pink-200/60 flex items-center justify-center mx-auto shadow-2xs">
            <FileCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">No Assignments Found</h3>
            <p className="text-slate-500 text-xs">
              {searchQuery || selectedCourseId !== "ALL" || selectedStatus !== "ALL"
                ? "No projects match your current search and filter criteria."
                : "You have not created any standalone assignments for your assigned courses yet."}
            </p>
          </div>
          <Link
            href="/trainer/assignments/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl jvm-gradient-bg text-white font-bold text-xs shadow-md shadow-purple-900/20 hover:scale-[1.02] transition"
          >
            <Plus className="w-4 h-4" /> Create First Assignment
          </Link>
        </div>
      )}
    </div>
  );
}
