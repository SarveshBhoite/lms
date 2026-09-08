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
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes by title or course name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Quiz Statuses</option>
            <option value="UNATTEMPTED">Pending / Unattempted</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Needs Retake (Failed)</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((qz) => {
            const latestAttempt = qz.latestAttempt;

            return (
              <div
                key={qz.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                      {qz.course.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {qz.timeLimitMinutes} Mins
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{qz.title}</h3>
                    {qz.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{qz.description}</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <strong className="text-slate-900">{qz.questionCount} Questions</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Passing Score:</span>
                      <strong className="text-slate-900">{qz.passingMarks}%</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {latestAttempt ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-slate-600 font-mono">Previous Score:</span>
                      <strong
                        className={
                          latestAttempt.score >= qz.passingMarks
                            ? "text-emerald-700 font-bold"
                            : "text-rose-700 font-bold"
                        }
                      >
                        {latestAttempt.score}% ({latestAttempt.score >= qz.passingMarks ? "Passed" : "Failed"})
                      </strong>
                    </div>
                  ) : null}

                  <Link
                    href={`/student/quizzes/${qz.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {latestAttempt ? "Retake Assessment" : "Start Assessment"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No quizzes matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
