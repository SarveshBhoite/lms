"use client";

import { useState } from "react";
import Link from "next/link";
import { FileCheck, Search, Filter, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  deadline: string | null;
  course: { id: string; title: string };
  submission?: {
    id: string;
    status: string;
    submittedAt: string;
    marksAwarded?: number | null;
    feedbackText?: string | null;
  } | null;
}

// Hydration-safe date formatter
function formatDateSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function StudentAssignmentsClient({
  initialAssignments,
}: {
  initialAssignments: AssignmentItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SUBMITTED" | "EVALUATED">("ALL");

  const filtered = initialAssignments.filter((asgn) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = asgn.title.toLowerCase().includes(q);
    const courseMatch = asgn.course.title.toLowerCase().includes(q);
    const matchesSearch = titleMatch || courseMatch;

    let matchesStatus = true;
    if (statusFilter === "PENDING") {
      matchesStatus = !asgn.submission;
    } else if (statusFilter === "SUBMITTED") {
      matchesStatus = Boolean(asgn.submission && asgn.submission.status !== "EVALUATED");
    } else if (statusFilter === "EVALUATED") {
      matchesStatus = Boolean(asgn.submission && asgn.submission.status === "EVALUATED");
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stylized Search & Filter Console */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-purple-200/50 via-slate-100 to-pink-200/50 shadow-sm">
        <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/80">
          {/* Stylized Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A] transition group-focus-within:bg-[#E01E6A] group-focus-within:text-white group-focus-within:scale-105 shadow-2xs">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, deliverable, or course..."
              className="w-full pl-13 pr-10 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition"
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
                { id: "ALL", label: "All Projects" },
                { id: "PENDING", label: "Pending" },
                { id: "SUBMITTED", label: "Under Review" },
                { id: "EVALUATED", label: "Graded" },
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

            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200/60 text-[#E01E6A] font-mono text-[11px] font-bold shrink-0">
              {filtered.length} {filtered.length === 1 ? "Project" : "Projects"}
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((asgn) => {
            const submission = asgn.submission;
            const isEvaluated = submission && submission.status === "EVALUATED";
            const isSubmitted = submission && !isEvaluated;

            return (
              <div
                key={asgn.id}
                className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-pink-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* Top Accent Ribbon */}
                <div
                  className={`h-2.5 w-full ${
                    isEvaluated
                      ? "bg-emerald-500"
                      : isSubmitted
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                      : "bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600"
                  }`}
                />

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-pink-50 text-[#E01E6A] border border-pink-200/60 shadow-2xs truncate max-w-[180px]">
                      {asgn.course.title}
                    </span>
                    <span className="text-xs text-[#E01E6A] font-mono font-bold bg-pink-50/50 px-2.5 py-1 rounded-xl border border-pink-200/60 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {asgn.deadline ? formatDateSafe(asgn.deadline) : "Flexible"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#E01E6A] transition">
                      {asgn.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {asgn.description || "Practical hands-on implementation project evaluated directly by faculty."}
                    </p>
                  </div>

                  {/* Metadata Spec Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-pink-50/20 border border-slate-200/70 space-y-2 text-xs font-mono text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Weight:</span>
                      <strong className="text-slate-900 font-bold">{asgn.totalMarks} Points</strong>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400">Submission State:</span>
                      {isEvaluated ? (
                        <strong className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Graded ({submission.marksAwarded ?? 0}/{asgn.totalMarks})
                        </strong>
                      ) : isSubmitted ? (
                        <strong className="text-[#7C248C] font-bold">
                          Submitted (Reviewing)
                        </strong>
                      ) : (
                        <strong className="text-amber-700 font-bold">
                          Pending Submission
                        </strong>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={`/student/assignments/${asgn.id}`}
                    className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                      isEvaluated
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20"
                        : isSubmitted
                        ? "jvm-gradient-bg jvm-gradient-hover text-white shadow-purple-900/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{isEvaluated ? "View Evaluation & Feedback" : isSubmitted ? "Inspect / Update Project" : "Open Project Workspace"}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No assignments matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
