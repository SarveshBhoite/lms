"use client";

import { useState } from "react";
import {
  Download,
  Users,
  Calendar,
  BookOpen,
  Award,
  CheckSquare,
  FileCheck,
  HelpCircle,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

interface CourseOption {
  id: string;
  title: string;
}

interface BatchOption {
  id: string;
  name: string;
}

interface ReportsClientProps {
  role: "ADMIN" | "TRAINER";
  courses: CourseOption[];
  batches: BatchOption[];
}

export default function ReportsClient({ role, courses, batches }: ReportsClientProps) {
  const [selectedReport, setSelectedReport] = useState<string>("students");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reportTypes = [
    {
      id: "students",
      title: "Student Cohort Registry",
      desc: "Full roster with progress percentages, enrolled batches, phone, and joining dates.",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "attendance",
      title: "Attendance & Live Participation",
      desc: "Session logs, Google Meet participation, trainer verification, and excuse notes.",
      icon: CheckSquare,
      color: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "courses",
      title: "Course Completion & Milestone Audit",
      desc: "Module counts, enrollment metrics, pass completion rates, and instructor details.",
      icon: BookOpen,
      color: "from-amber-600 to-orange-600",
      textColor: "text-amber-600",
      bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "quizzes",
      title: "Quiz Assessment Results",
      desc: "Scores, percentage metrics, pass/fail thresholds, and student attempt logs.",
      icon: HelpCircle,
      color: "from-purple-600 to-pink-600",
      textColor: "text-purple-600",
      bgLight: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "assignments",
      title: "Assignment Submissions & Feedback",
      desc: "Student project links, grading feedback, awarded marks, and evaluator records.",
      icon: FileCheck,
      color: "from-rose-600 to-red-600",
      textColor: "text-rose-600",
      bgLight: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      id: "certificates",
      title: "Issued Certificates Registry",
      desc: "Official certificate IDs, verification status, recipient details, and issue timestamps.",
      icon: Award,
      color: "from-[#7C248C] to-[#E01E6A]",
      textColor: "text-[#E01E6A]",
      bgLight: "bg-pink-50 text-[#E01E6A] border-pink-200",
    },
  ];

  const handleDownload = async (customReportId?: string) => {
    const activeType = customReportId || selectedReport;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: activeType,
          format,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          courseId: courseId || undefined,
          batchId: batchId || undefined,
        }),
      });

      const contentType = res.headers.get("Content-Type") || "";
      if (!res.ok || contentType.includes("application/json")) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }

      // Extract filename from header or build default
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `Report_${activeType}_${Date.now()}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMsg(`Successfully generated & downloaded: ${filename}`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during export.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCourseId("");
    setBatchId("");
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Filter Controls Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Custom Export Filters</h2>
              <p className="text-xs text-slate-500">Filter report records by date range, course, or assigned batch.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(startDate || endDate || courseId || batchId) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" /> To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition"
            />
          </div>

          {/* Course Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Specific Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-600" /> Specific Batch / Cohort
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Format & Quick Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Export Format:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  format === "xlsx"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  format === "csv"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                CSV (.csv)
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDownload()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Selected ({format.toUpperCase()})
              </>
            )}
          </button>
        </div>

        {/* Alert Feedback Messages */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" /> {successMsg}
          </div>
        )}
      </div>

      {/* Reports Directory & Direct Download Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Available Report Types</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on a card to select it for custom filtered download, or click &quot;Export&quot; to download that report type immediately with your active filters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedReport === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`relative p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-purple-50/50 border-purple-400 shadow-md ring-2 ring-purple-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${r.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.bgLight}`}>
                      {format.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{r.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-purple-700">
                    {isSelected ? "● Selected for Export" : "Click to select"}
                  </span>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(r.id);
                      handleDownload(r.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
