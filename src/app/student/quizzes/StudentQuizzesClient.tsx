"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Clock, CheckCircle2, XCircle, Search, Filter } from "lucide-react";

interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  course: { id: string; title: string };
  questionCount: number;
  latestAttempt?: {
    score: number;
    isPassed: boolean;
    startedAt: string;
  } | null;
}

export default function StudentQuizzesClient({
  initialQuizzes,
}: {
  initialQuizzes: QuizItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASSED" | "FAILED" | "UNATTEMPTED">("ALL");

  const filtered = initialQuizzes.filter((qz) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = qz.title.toLowerCase().includes(q);
    const courseMatch = qz.course.title.toLowerCase().includes(q);
    const matchesSearch = titleMatch || courseMatch;

    let matchesStatus = true;
    if (statusFilter === "UNATTEMPTED") {
      matchesStatus = !qz.latestAttempt;
    } else if (statusFilter === "PASSED") {
      matchesStatus = Boolean(qz.latestAttempt && qz.latestAttempt.isPassed);
    } else if (statusFilter === "FAILED") {
      matchesStatus = Boolean(qz.latestAttempt && !qz.latestAttempt.isPassed);
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stylized Search & Filter Console */}
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
              placeholder="Search evaluations by title, topic, or course..."
              className="w-full pl-13 pr-10 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold flex items-center justify-center transition cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Segmented Status Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              {[
                { id: "ALL", label: "All Quizzes" },
                { id: "UNATTEMPTED", label: "Pending" },
                { id: "PASSED", label: "Passed" },
                { id: "FAILED", label: "Retake" },
              ].map((st) => {
                const isSelected = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#7C248C] font-mono text-[11px] font-bold shrink-0">
              {filtered.length} {filtered.length === 1 ? "Quiz" : "Quizzes"}
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((qz) => {
            const latestAttempt = qz.latestAttempt;
            const isPassed = latestAttempt && latestAttempt.score >= qz.passingMarks;
            const isFailed = latestAttempt && !isPassed;

            return (
              <div
                key={qz.id}
                className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* Top Accent Ribbon */}
                <div
                  className={`h-2.5 w-full ${
                    isPassed
                      ? "bg-emerald-500"
                      : isFailed
                      ? "bg-rose-500"
                      : "jvm-gradient-bg"
                  }`}
                />

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60 shadow-2xs truncate max-w-[190px]">
                      {qz.course.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                      <Clock className="w-3.5 h-3.5 text-[#7C248C]" /> {qz.timeLimitMinutes} Mins
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#7C248C] transition">
                      {qz.title}
                    </h3>
                    {qz.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {qz.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Spec Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200/70 text-xs font-mono space-y-2 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Questions:</span>
                      <strong className="text-slate-900 font-bold">{qz.questionCount} Questions</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Passing Criteria:</span>
                      <strong className="text-[#7C248C] font-bold">{qz.passingMarks}% Score</strong>
                    </div>
                  </div>

                  {/* Previous Attempt Status */}
                  {latestAttempt ? (
                    <div
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-mono ${
                        isPassed
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                          : "bg-rose-50/80 border-rose-200 text-rose-900"
                      }`}
                    >
                      <span className="text-[11px] font-medium">Previous Result:</span>
                      <strong className="font-bold flex items-center gap-1">
                        {isPassed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        {latestAttempt.score}% ({isPassed ? "PASSED" : "NEEDS RETAKE"})
                      </strong>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-2 text-[11px] font-mono text-slate-400">
                      <span>Status: Not attempted yet</span>
                      <span className="text-purple-600 font-bold">First Attempt</span>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={`/student/quizzes/${qz.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>{latestAttempt ? "Retake Assessment Studio" : "Launch Assessment Studio"}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No quizzes matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
