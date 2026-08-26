"use client";

import { useState } from "react";
import { BarChart3, Download, FileSpreadsheet, Sparkles, CheckCircle2 } from "lucide-react";

export default function TrainerReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    {
      id: "rep-1",
      title: "Cohort Academic Progress & Completion Ledger",
      description: "Complete student progress metrics, completed lessons count, and course completion percentages.",
      csvHeader: "Student Name,Email,Cohort,Course Title,Progress %,Completed Lessons,Status\n",
      sampleRows: [
        "Sophia Martinez,sophia.student@institute.edu,Next.js Alpha Cohort 2026,Full-Stack Next.js 15,40%,2,In Progress",
        "David Chen,david.c@institute.edu,Next.js Alpha Cohort 2026,Full-Stack Next.js 15,65%,4,In Progress",
        "Emma Watson,emma.w@institute.edu,Next.js Alpha Cohort 2026,Full-Stack Next.js 15,100%,7,Completed",
      ],
      filename: "cohort_progress_report.csv",
    },
    {
      id: "rep-2",
      title: "Quiz & Knowledge Assessment Transcripts",
      description: "Full question breakdown, individual attempt scores, time taken, and pass/fail audit logs.",
      csvHeader: "Attempt ID,Student Name,Quiz Title,Score %,Passed,Attempt Date\n",
      sampleRows: [
        "qa-101,Sophia Martinez,Next.js 15 App Router & RBAC,92%,YES,2026-08-25",
        "qa-102,David Chen,Next.js 15 App Router & RBAC,84%,YES,2026-08-24",
        "qa-103,Liam Johnson,Next.js 15 App Router & RBAC,54%,NO,2026-08-23",
      ],
      filename: "quiz_assessment_transcripts.csv",
    },
    {
      id: "rep-3",
      title: "Project Milestone Lab Grading Summary",
      description: "Code repository links, evaluation scores awarded, and feedback review commentary.",
      csvHeader: "Submission ID,Student Name,Milestone Title,Points Awarded,Max Points,Repository URL,Feedback\n",
      sampleRows: [
        "sub-201,Sophia Martinez,Capstone 1: Auth & RBAC Architecture,95,100,https://github.com/sophia/next15-lms,Outstanding architecture",
        "sub-202,David Chen,Capstone 1: Auth & RBAC Architecture,88,100,https://github.com/david/next15-rbac,Good middleware structure",
      ],
      filename: "project_milestone_grades.csv",
    },
  ];

  const handleExportCSV = (report: typeof reports[0]) => {
    setDownloading(report.id);
    const content = report.csvHeader + report.sampleRows.join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", report.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(null);
    }, 800);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <BarChart3 className="w-3.5 h-3.5" /> Academic Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reports & Grade Transcripts
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Export standardized CSV and Excel performance transcripts for your academic cohorts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div
            key={r.id}
            className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between hover:border-slate-700 transition shadow-xl"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{r.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
            </div>

            <button
              onClick={() => handleExportCSV(r)}
              disabled={downloading === r.id}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold font-mono flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {downloading === r.id ? "Preparing CSV..." : "Export CSV Report"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
