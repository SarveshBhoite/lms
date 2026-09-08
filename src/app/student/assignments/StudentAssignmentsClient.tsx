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
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title or course name..."
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
            <option value="ALL">All Submission Statuses</option>
            <option value="PENDING">Pending Submission</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="EVALUATED">Graded & Evaluated</option>
          </select>
        </div>
      </div>

      {/* Assignments Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((asgn) => {
            const submission = asgn.submission;

            return (
              <div
                key={asgn.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-pink-50 text-[#E01E6A] border border-pink-200">
                      {asgn.course.title}
                    </span>
                    <span className="text-xs text-[#E01E6A] font-mono font-bold">
                      {asgn.deadline ? new Date(asgn.deadline).toLocaleDateString() : "Flexible Deadline"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{asgn.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{asgn.description}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700 font-mono">
                    <div className="flex justify-between">
                      <span>Maximum Marks:</span>
                      <strong className="text-slate-900">{asgn.totalMarks} Points</strong>
                    </div>

                    {submission ? (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span>Status:</span>
                        <strong
                          className={
                            submission.status === "EVALUATED"
                              ? "text-emerald-700 font-bold"
                              : "text-[#7C248C] font-bold"
                          }
                        >
                          {submission.status === "EVALUATED"
                            ? `Graded (${submission.marksAwarded ?? 0}/${asgn.totalMarks})`
                            : "Submitted (Under Review)"}
                        </strong>
                      </div>
                    ) : (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span>Status:</span>
                        <strong className="text-amber-700 font-bold">Not Submitted Yet</strong>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/student/assignments/${asgn.id}`}
                  className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submission ? "Review / Resubmit Project" : "Submit Assignment"}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No assignments matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
