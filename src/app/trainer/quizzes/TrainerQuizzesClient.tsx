"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
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
  ExternalLink,
  BookOpen,
  Sparkles,
} from "lucide-react";

export interface SerializedQuizItem {
  id: string;
  courseId: string;
  courseTitle: string;
  batchIds: string[];
  batchNames: string[];
  title: string;
  description: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  maxAttempts: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  questionsCount: number;
  totalMarks?: number;
  attemptsCount: number;
  passedAttemptsCount: number;
  createdAt: string;
}

export interface CourseFilterItem {
  id: string;
  title: string;
}

export default function TrainerQuizzesClient({
  initialQuizzes,
  courses,
}: {
  initialQuizzes: SerializedQuizItem[];
  courses: CourseFilterItem[];
}) {
  const [quizzes, setQuizzes] = useState<SerializedQuizItem[]>(initialQuizzes);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Computed KPI Metrics
  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter((q) => q.status === "PUBLISHED").length;
  const draftQuizzes = quizzes.filter((q) => q.status === "DRAFT").length;
  const totalQuestions = quizzes.reduce((acc, q) => acc + q.questionsCount, 0);
  const totalAttempts = quizzes.reduce((acc, q) => acc + q.attemptsCount, 0);
  const totalPassedAttempts = quizzes.reduce((acc, q) => acc + q.passedAttemptsCount, 0);
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassedAttempts / totalAttempts) * 100) : 0;

  // Filter logic
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourse = selectedCourseId === "ALL" || q.courseId === selectedCourseId;
    const matchesStatus = selectedStatus === "ALL" || q.status === selectedStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = async (quizId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the quiz "${title}" and all its recorded attempts?`)) {
      return;
    }

    setDeletingId(quizId);
    try {
      const res = await fetch(`/api/trainer/quizzes/${quizId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete quiz");
      }
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err: any) {
      alert(err.message || "Failed to delete quiz");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. COMPACT STUDIO BANNER (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <HelpCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Assessments & Evaluation Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                Standalone Quizzes
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Course & Cohort Assessments
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Build timed evaluations, review question banks, and inspect real-time student attempt scores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Link
            href="/trainer/quizzes/create"
            className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create New Quiz
          </Link>
        </div>
      </div>

      {/* 2. 5 HIGH-IMPACT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#7C248C]" /> Total Quizzes
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalQuizzes}</span>
            <span className="text-[11px] font-mono text-slate-400">Created</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{publishedQuizzes}</span>
            <span className="text-[11px] font-mono text-slate-400">
              {draftQuizzes > 0 ? `(${draftQuizzes} Draft)` : "Active"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E2B88]" /> Total Questions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1E2B88]">{totalQuestions}</span>
            <span className="text-[11px] font-mono text-slate-400">In Bank</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Student Attempts
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{totalAttempts}</span>
            <span className="text-[11px] font-mono text-slate-400">Submitted</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-600" /> Cohort Pass Rate
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{overallPassRate}%</span>
            <span className="text-[11px] font-mono text-slate-400">{totalPassedAttempts} Passed</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes by title or course..."
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-[#7C248C] cursor-pointer shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* 4. QUIZZES GRID */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((qz) => {
            const passRate = qz.attemptsCount > 0 ? Math.round((qz.passedAttemptsCount / qz.attemptsCount) * 100) : 0;

            return (
              <div
                key={qz.id}
                className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        qz.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {qz.status}
                    </span>

                    <span className="text-xs text-slate-500 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {qz.timeLimitMinutes} mins
                    </span>
                  </div>

                  {/* Course & Quiz Title */}
                  <div>
                    <span className="text-[10px] font-mono text-[#7C248C] font-extrabold uppercase tracking-wide block mb-1">
                      {qz.courseTitle}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-[#7C248C] transition leading-snug">
                      {qz.title}
                    </h3>
                    {qz.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {qz.description}
                      </p>
                    )}
                  </div>

                  {/* Batch Scoping Tags */}
                  <div className="pt-1">
                    {qz.batchNames && qz.batchNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">Cohorts:</span>
                        {qz.batchNames.map((bn, i) => (
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
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Questions</span>
                      <strong className="text-slate-900 text-sm font-extrabold">{qz.questionsCount}</strong>
                      {typeof qz.totalMarks === "number" && (
                        <span className="block text-[9px] text-[#7C248C] font-semibold">{qz.totalMarks} Marks</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Attempts</span>
                      <strong className="text-[#7C248C] text-sm font-extrabold">{qz.attemptsCount}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Pass Mark</span>
                      <strong className="text-emerald-700 text-sm font-extrabold">{qz.passingMarks}%</strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/trainer/quizzes/${qz.id}`}
                    className="w-full py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                  >
                    <span>Manage Quiz & Review Attempts</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      Pass Rate: <strong className="text-slate-700">{passRate}%</strong>
                    </span>

                    <button
                      onClick={() => handleDelete(qz.id, qz.title)}
                      disabled={deletingId === qz.id}
                      className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                      title="Delete Quiz"
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
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7C248C] border border-purple-200/60 flex items-center justify-center mx-auto shadow-2xs">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">No Assessments Found</h3>
            <p className="text-slate-500 text-xs">
              {searchQuery || selectedCourseId !== "ALL" || selectedStatus !== "ALL"
                ? "No quizzes match your current search and filter criteria."
                : "You have not created any standalone quizzes for your assigned courses yet."}
            </p>
          </div>
          <Link
            href="/trainer/quizzes/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl jvm-gradient-bg text-white font-bold text-xs shadow-md shadow-purple-900/20 hover:scale-[1.02] transition"
          >
            <Plus className="w-4 h-4" /> Create First Quiz
          </Link>
        </div>
      )}
    </div>
  );
}
