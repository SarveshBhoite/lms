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
  const [activeCategory, setActiveCategory] = useState<"ALL" | "ACADEMIC" | "EVALUATION" | "CREDENTIALS">("ALL");
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
      category: "ACADEMIC" as const,
      title: "Student Cohort Registry",
      desc: "Full roster with progress percentages, enrolled batches, phone, and joining dates.",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50 text-blue-700 border-blue-200",
      columns: ["Student ID", "Full Name", "Email", "Phone", "Status", "Joined Date", "Enrolled Courses", "Assigned Batches", "Average Progress"],
    },
    {
      id: "attendance",
      category: "ACADEMIC" as const,
      title: "Attendance & Live Participation",
      desc: "Session logs, Google Meet participation, trainer verification, and excuse notes.",
      icon: CheckSquare,
      color: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
      columns: ["Attendance ID", "Student Name", "Session Title", "Course", "Batch", "Trainer", "Date", "Status", "Verified", "Join Timestamp"],
    },
    {
      id: "courses",
      category: "ACADEMIC" as const,
      title: "Course Completion & Milestone Audit",
      desc: "Module counts, enrollment metrics, pass completion rates, and instructor details.",
      icon: BookOpen,
      color: "from-amber-600 to-orange-600",
      textColor: "text-amber-600",
      bgLight: "bg-amber-50 text-amber-700 border-amber-200",
      columns: ["Course ID", "Title", "Level", "Status", "Trainer", "Modules", "Lessons", "Enrolled", "Completed", "Completion %"],
    },
    {
      id: "quizzes",
      category: "EVALUATION" as const,
      title: "Quiz Assessment Results",
      desc: "Scores, percentage metrics, pass/fail thresholds, and student attempt logs.",
      icon: HelpCircle,
      color: "from-purple-600 to-pink-600",
      textColor: "text-purple-600",
      bgLight: "bg-purple-50 text-purple-700 border-purple-200",
      columns: ["Attempt ID", "Student Name", "Student Email", "Quiz Title", "Course Title", "Score (%)", "Pass Criteria", "Result", "Date"],
    },
    {
      id: "assignments",
      category: "EVALUATION" as const,
      title: "Assignment Submissions & Feedback",
      desc: "Student project links, grading feedback, awarded marks, and evaluator records.",
      icon: FileCheck,
      color: "from-rose-600 to-red-600",
      textColor: "text-rose-600",
      bgLight: "bg-rose-50 text-rose-700 border-rose-200",
      columns: ["Submission ID", "Student Name", "Assignment Title", "Course", "Status", "Submitted Date", "Marks Awarded", "Graded By"],
    },
    {
      id: "certificates",
      category: "CREDENTIALS" as const,
      title: "Issued Certificates Registry",
      desc: "Official certificate IDs, verification status, recipient details, and issue timestamps.",
      icon: Award,
      color: "from-[#7C248C] to-[#E01E6A]",
      textColor: "text-[#E01E6A]",
      bgLight: "bg-pink-50 text-[#E01E6A] border-pink-200",
      columns: ["Certificate ID", "Recipient Name", "Recipient Email", "Course Title", "Course Level", "Issue Date", "Status"],
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

  const hasActiveFilters = Boolean(startDate || endDate || courseId || batchId);

  const filteredReports = reportTypes.filter((r) => {
    if (activeCategory === "ALL") return true;
    return r.category === activeCategory;
  });

  const activeReportObj = reportTypes.find((r) => r.id === selectedReport) || reportTypes[0];

  return (
    <div className="space-y-8">
      {/* 1. FILTER CONTROLS & QUERY TUNER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C248C]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Custom Export Filters</h2>
              <p className="text-xs text-slate-500 font-mono">
                Narrow down generated records by date ranges, course curriculums, or assigned batch cohorts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#7C248C]" /> From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7C248C] transition font-mono"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#7C248C]" /> To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7C248C] transition font-mono"
            />
          </div>

          {/* Course Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-[#1E2B88]" /> Specific Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7C248C] transition"
            >
              <option value="">All Assigned Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-600" /> Specific Batch / Cohort
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7C248C] transition"
            >
              <option value="">All Assigned Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Format Selector & Execute Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 font-mono">Export Format:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition font-mono cursor-pointer ${
                  format === "xlsx"
                    ? "bg-white text-[#7C248C] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition font-mono cursor-pointer ${
                  format === "csv"
                    ? "bg-white text-[#7C248C] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                CSV (.csv)
              </button>
            </div>

            {hasActiveFilters && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                Filters Applied
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDownload()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Compiling Report...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download {activeReportObj.title.split(" ")[0]} ({format.toUpperCase()})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Alert Feedback Messages */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <span className="font-bold uppercase font-mono">Error:</span> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
          </div>
        )}
      </div>

      {/* 2. REPORT DIRECTORY WITH CATEGORY TABS */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Available Report Registries</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Select a registry card to customize its parameters or click &quot;Export&quot; to download immediately.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition font-mono whitespace-nowrap cursor-pointer ${
                activeCategory === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Types ({reportTypes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("ACADEMIC")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition font-mono whitespace-nowrap cursor-pointer ${
                activeCategory === "ACADEMIC" ? "bg-white text-[#1E2B88] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Academic
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("EVALUATION")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition font-mono whitespace-nowrap cursor-pointer ${
                activeCategory === "EVALUATION" ? "bg-white text-purple-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Evaluations
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("CREDENTIALS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition font-mono whitespace-nowrap cursor-pointer ${
                activeCategory === "CREDENTIALS" ? "bg-white text-[#E01E6A] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Credentials
            </button>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedReport === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`relative p-6 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? "bg-white border-[#7C248C] shadow-md ring-2 ring-purple-100"
                    : "bg-white border-slate-200/80 hover:border-purple-300 hover:shadow-xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${r.color} flex items-center justify-center text-white shadow-xs`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border font-mono ${r.bgLight}`}>
                        {r.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {format.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900 tracking-tight">{r.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                  </div>

                  {/* Schema Columns Pill Badges */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">
                      Report Schema Fields:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.columns.slice(0, 4).map((col, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600"
                        >
                          {col}
                        </span>
                      ))}
                      {r.columns.length > 4 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-400">
                          +{r.columns.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span
                    className={`text-[11px] font-bold font-mono transition ${
                      isSelected ? "text-[#7C248C] font-extrabold" : "text-slate-400"
                    }`}
                  >
                    {isSelected ? "● Active Target" : "Select Report"}
                  </span>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(r.id);
                      handleDownload(r.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition font-mono cursor-pointer ${
                      isSelected
                        ? "jvm-gradient-bg jvm-gradient-hover text-white shadow-xs"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
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
