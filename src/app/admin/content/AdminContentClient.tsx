"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  Download,
  Trash2,
  FileText,
  Video,
  FileCode,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  Layers,
  File,
  HardDrive,
  Copy,
  Check,
  Globe,
  Users2,
  GraduationCap,
  ShieldCheck,
  LayoutGrid,
  List,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ResourceData {
  id: string;
  courseId?: string | null;
  batchId?: string | null;
  lessonId?: string | null;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string | Date;
  course?: {
    id: string;
    title: string;
    trainer?: {
      id: string;
      name: string;
    } | null;
  } | null;
  batch?: {
    id: string;
    name: string;
  } | null;
  lesson?: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
        trainer?: {
          id: string;
          name: string;
        } | null;
      };
    };
  } | null;
}

export interface CourseOption {
  id: string;
  title: string;
  batches?: {
    id: string;
    name: string;
    status: string;
  }[];
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
  }[];
}

export default function AdminContentClient({
  initialCourses,
  initialResources,
}: {
  initialCourses: CourseOption[];
  initialResources: ResourceData[];
}) {
  const [resources, setResources] = useState<ResourceData[]>(initialResources);
  const [courses] = useState<CourseOption[]>(initialCourses);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<"ALL" | "GENERAL" | "LESSON">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Target Modal
  const [deletingResource, setDeletingResource] = useState<ResourceData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Metrics Calculations
  const totalAssetsCount = resources.length;
  const totalSizeMb = (
    resources.reduce((acc, r) => acc + (r.fileSize || 0), 0) /
    (1024 * 1024)
  ).toFixed(1);

  const pdfCount = resources.filter((r) => r.fileType?.toUpperCase().includes("PDF")).length;
  const codeCount = resources.filter(
    (r) =>
      r.fileType?.toUpperCase().includes("CODE") ||
      r.fileType?.toUpperCase().includes("ZIP") ||
      r.fileType?.toUpperCase().includes("TAR")
  ).length;
  const videoCount = resources.filter(
    (r) => r.fileType?.toUpperCase().includes("VIDEO") || r.fileType?.toUpperCase().includes("MP4")
  ).length;
  const otherCount = totalAssetsCount - (pdfCount + codeCount + videoCount);

  // Filtered Assets across the whole system
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const courseTitle = r.course?.title || r.lesson?.module.course.title || "";
      const courseId = r.courseId || r.course?.id || r.lesson?.module.course.id || "";
      const lessonTitle = r.lesson?.title || "";
      const batchName = r.batch?.name || "";
      const trainerName = r.course?.trainer?.name || r.lesson?.module.course.trainer?.name || "";

      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fileType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCourse = !selectedCourseFilter || courseId === selectedCourseFilter;

      const matchType =
        selectedTypeFilter === "ALL" ||
        (selectedTypeFilter === "PDF" && r.fileType?.toUpperCase().includes("PDF")) ||
        (selectedTypeFilter === "VIDEO" &&
          (r.fileType?.toUpperCase().includes("VIDEO") || r.fileType?.toUpperCase().includes("MP4"))) ||
        (selectedTypeFilter === "CODE" &&
          (r.fileType?.toUpperCase().includes("CODE") || r.fileType?.toUpperCase().includes("ZIP"))) ||
        (selectedTypeFilter === "OTHER" &&
          !r.fileType?.toUpperCase().includes("PDF") &&
          !r.fileType?.toUpperCase().includes("VIDEO") &&
          !r.fileType?.toUpperCase().includes("CODE") &&
          !r.fileType?.toUpperCase().includes("ZIP"));

      const isGeneral = !r.lessonId && !r.lesson;
      const matchScope =
        selectedScopeFilter === "ALL" ||
        (selectedScopeFilter === "GENERAL" && isGeneral) ||
        (selectedScopeFilter === "LESSON" && !isGeneral);

      return matchSearch && matchCourse && matchType && matchScope;
    });
  }, [resources, searchQuery, selectedCourseFilter, selectedTypeFilter, selectedScopeFilter]);

  // Delete Resource
  const handleDeleteConfirm = async () => {
    if (!deletingResource) return;
    setActionLoading(true);
    try {
      const courseId =
        deletingResource.courseId ||
        deletingResource.course?.id ||
        deletingResource.lesson?.module.course.id ||
        courses[0]?.id;

      const res = await fetch(`/api/trainer/courses/${courseId}/resources/${deletingResource.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete resource");
      }

      setResources((prev) => prev.filter((r) => r.id !== deletingResource.id));
      showToast("success", "Resource removed from content repository.");
      setDeletingResource(null);
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete resource");
    } finally {
      setActionLoading(false);
    }
  };

  const copyUrlToClipboard = (id: string, url: string) => {
    const fullUrl = url.startsWith("http") ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getAssetBadgeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("PDF")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (t.includes("VIDEO") || t.includes("MP4")) return "bg-cyan-50 text-cyan-700 border-cyan-200";
    if (t.includes("CODE") || t.includes("ZIP")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (t.includes("DOC") || t.includes("PPT")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-purple-50 text-[#7C248C] border-purple-200";
  };

  const getAssetIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("PDF")) return <FileText className="w-5 h-5 text-rose-600" />;
    if (t.includes("VIDEO") || t.includes("MP4")) return <Video className="w-5 h-5 text-cyan-600" />;
    if (t.includes("CODE") || t.includes("ZIP")) return <FileCode className="w-5 h-5 text-indigo-600" />;
    if (t.includes("DATABASE") || t.includes("CSV") || t.includes("XLS"))
      return <Database className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Content Repository
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#7C248C]" /> Content Library & Assets 🗂️
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {totalAssetsCount} Learning Assets across all courses • {totalSizeMb} MB Consumed • {courses.length} Active Courses
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <span className="px-4 py-2 rounded-xl bg-purple-100/80 border border-purple-200 text-[#7C248C] text-xs font-mono font-bold flex items-center gap-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#7C248C]" />
            <span>Universal Repository (Read-Only)</span>
          </span>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assets</div>
          <div className="text-2xl font-black text-slate-900">{totalAssetsCount}</div>
          <div className="text-[11px] font-mono text-[#7C248C] font-semibold">{totalSizeMb} MB Consumed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PDFs & Notes</div>
          <div className="text-2xl font-black text-rose-600">{pdfCount}</div>
          <div className="text-[11px] font-mono text-rose-700 font-semibold">Docs & Handouts</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Code & Archives</div>
          <div className="text-2xl font-black text-indigo-600">{codeCount}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">ZIPs & Code Repos</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Video Lectures</div>
          <div className="text-2xl font-black text-cyan-600">{videoCount}</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">Offline Streams</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Other Media</div>
          <div className="text-2xl font-black text-slate-900">{otherCount}</div>
          <div className="text-[11px] font-mono text-slate-500 font-semibold">Datasets & Spreadsheets</div>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets by file title, lesson name, faculty, batch, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          {/* Scope Filter Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold shrink-0">
            <button
              onClick={() => setSelectedScopeFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedScopeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedScopeFilter("GENERAL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedScopeFilter === "GENERAL" ? "bg-white text-[#7C248C] shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Course-Wide
            </button>
            <button
              onClick={() => setSelectedScopeFilter("LESSON")}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedScopeFilter === "LESSON" ? "bg-white text-[#1E2B88] shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Lesson
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Course:</span>
          </div>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition max-w-[180px] truncate shrink-0"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type:</span>
          </div>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition shrink-0"
          >
            <option value="ALL">All Types</option>
            <option value="PDF">PDFs & Docs</option>
            <option value="VIDEO">Videos</option>
            <option value="CODE">Code & ZIPs</option>
            <option value="OTHER">Datasets / Other</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold shrink-0 ml-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table" ? "bg-white text-[#7C248C] shadow-xs" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid" ? "bg-white text-[#7C248C] shadow-xs" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Content Library Views (Table or Grid) */}
      {filteredResources.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((res) => {
              const kb = (res.fileSize / 1024).toFixed(1);
              const mb = (res.fileSize / (1024 * 1024)).toFixed(2);
              const sizeStr = res.fileSize > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
              const courseTitle = res.course?.title || res.lesson?.module.course.title || "Course Material";
              const trainerName = res.course?.trainer?.name || res.lesson?.module.course.trainer?.name;
              const isGeneral = !res.lessonId && !res.lesson;

              return (
                <div
                  key={res.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                        {getAssetIcon(res.fileType)}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border flex items-center gap-1 shrink-0 ${getAssetBadgeColor(
                          res.fileType
                        )}`}
                      >
                        {res.fileType.split("/")[1]?.toUpperCase() || res.fileType || "FILE"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-black text-slate-900 text-sm line-clamp-2 hover:text-[#7C248C] transition" title={res.title}>
                        {res.title}
                      </h3>
                      <div className="text-xs font-mono text-slate-400">
                        {sizeStr} • {formatDate(res.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] text-[10px] font-mono font-bold border border-purple-200 shrink-0 truncate max-w-full">
                        📚 {courseTitle}
                      </span>
                      {trainerName && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200 shrink-0">
                          Faculty: {trainerName}
                        </span>
                      )}
                      {res.batch && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-200 shrink-0">
                          Cohort: {res.batch.name}
                        </span>
                      )}
                      {isGeneral ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-mono font-bold border border-amber-200 shrink-0">
                          Course-Wide
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-mono font-bold border border-blue-200 shrink-0 truncate max-w-full">
                          Lesson: {res.lesson?.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyUrlToClipboard(res.id, res.fileUrl)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7C248C] border border-slate-200 transition"
                      title="Copy Direct URL"
                    >
                      {copiedId === res.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center gap-1.5 transition border border-purple-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button
                        onClick={() => setDeletingResource(res)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
                        title="Delete Resource"
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
          /* Table View Rows */
          <div className="glass-card rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px] font-bold">
                  <tr>
                    <th className="p-4 pl-6">Resource Asset</th>
                    <th className="p-4">Course & Faculty</th>
                    <th className="p-4">Scope / Lesson</th>
                    <th className="p-4">Size & Date</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredResources.map((res) => {
                    const kb = (res.fileSize / 1024).toFixed(1);
                    const mb = (res.fileSize / (1024 * 1024)).toFixed(2);
                    const sizeStr = res.fileSize > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
                    const courseTitle = res.course?.title || res.lesson?.module.course.title || "Course Material";
                    const trainerName = res.course?.trainer?.name || res.lesson?.module.course.trainer?.name;
                    const isGeneral = !res.lessonId && !res.lesson;

                    return (
                      <tr key={res.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                              {getAssetIcon(res.fileType)}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-slate-900 line-clamp-1 text-xs sm:text-sm hover:text-[#7C248C] transition">
                                {res.title}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-bold uppercase border ${getAssetBadgeColor(
                                    res.fileType
                                  )}`}
                                >
                                  {res.fileType.split("/")[1]?.toUpperCase() || res.fileType || "FILE"}
                                </span>
                                {res.batch && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {res.batch.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 inline-block max-w-[200px] truncate" title={courseTitle}>
                            {courseTitle}
                          </span>
                          {trainerName ? (
                            <div className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-[#7C248C]" /> Faculty: {trainerName}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 mt-1">
                              {res.lesson?.module?.title || "Institute Wide"}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          {isGeneral ? (
                            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Universal Course Asset
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-indigo-600" /> {res.lesson?.title}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{res.lesson?.module?.title}</div>
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          <div>{sizeStr}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(res.createdAt)}</div>
                        </td>

                        <td className="p-4 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyUrlToClipboard(res.id, res.fileUrl)}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7C248C] border border-slate-200 transition"
                              title="Copy Direct URL"
                            >
                              {copiedId === res.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>

                            <a
                              href={res.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center gap-1.5 transition border border-purple-200"
                              title="Download Asset"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>

                            <button
                              onClick={() => setDeletingResource(res)}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
                              title="Delete Resource"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <FolderOpen className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No resources found matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCourseFilter || selectedTypeFilter !== "ALL" || selectedScopeFilter !== "ALL"
              ? "Try adjusting your search criteria or reset filters to view all learning assets."
              : "No learning materials or files found in the platform repository."}
          </p>
          {(searchQuery || selectedCourseFilter || selectedTypeFilter !== "ALL" || selectedScopeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourseFilter("");
                setSelectedTypeFilter("ALL");
                setSelectedScopeFilter("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 text-[#7C248C] text-xs font-bold hover:bg-purple-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-sm w-full space-y-4 text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Delete Learning Asset?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove "{deletingResource.title}" from the platform content repository?
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingResource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
