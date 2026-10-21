"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Film,
  Play,
  Search,
  Calendar,
  Clock,
  BookOpen,
  X,
  ExternalLink,
  ChevronRight,
  Tv,
  Share2,
  Check,
  List,
  LayoutGrid,
  ArrowUpDown,
  Folder,
  HardDrive,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface StudentRecordedLecture {
  id: string;
  sourceType: "LIVE_CLASS" | "RESOURCE";
  title: string;
  description?: string | null;
  videoUrl: string;
  recordedDate: string;
  durationMinutes?: number | null;
  course?: {
    id: string;
    title: string;
    slug?: string;
  } | null;
  batch?: {
    id: string;
    name: string;
  } | null;
  trainer?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    designation?: string | null;
  } | null;
  createdAt: string;
}

interface StudentRecordedLecturesClientProps {
  initialRecordings: StudentRecordedLecture[];
  courses: { id: string; title: string }[];
  batches: { id: string; name: string }[];
}

export default function StudentRecordedLecturesClient({
  initialRecordings,
  courses,
  batches,
}: StudentRecordedLecturesClientProps) {
  const [recordings] = useState<StudentRecordedLecture[]>(initialRecordings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "TITLE">("NEWEST");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [activeLecture, setActiveLecture] = useState<StudentRecordedLecture | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tab: CLASS_RECORDINGS vs DRIVE_ARCHIVE
  const [activeTab, setActiveTab] = useState<"RECORDINGS" | "DRIVE">("RECORDINGS");

  // Google Drive state
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [driveCurrentFolder, setDriveCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [driveFolderHistory, setDriveFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveRootName, setDriveRootName] = useState<string>("Drive Directory");
  const [previewDriveFile, setPreviewDriveFile] = useState<{ id: string; name: string; mimeType?: string } | null>(null);

  // Load Drive Folder
  const loadDriveFolder = async (folderId?: string, folderName?: string) => {
    setDriveLoading(true);
    try {
      const url = folderId
        ? `/api/student/drive-recordings?folderId=${encodeURIComponent(folderId)}`
        : "/api/student/drive-recordings";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setDriveItems(data.data.items || []);
        setDriveCurrentFolder(data.data.currentFolder || null);
        if (data.data.rootFolderName) {
          setDriveRootName(data.data.rootFolderName);
        }

        if (folderId && folderName) {
          setDriveFolderHistory((prev) => {
            const existsIdx = prev.findIndex((f) => f.id === folderId);
            if (existsIdx >= 0) {
              return prev.slice(0, existsIdx + 1);
            }
            return [...prev, { id: folderId, name: folderName }];
          });
        } else if (!folderId) {
          setDriveFolderHistory([]);
        }
      }
    } catch (e) {
      console.error("Failed to load Google Drive folder:", e);
    } finally {
      setDriveLoading(false);
    }
  };

  // Close player with Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLecture(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered and sorted lectures
  const filteredLectures = useMemo(() => {
    return recordings
      .filter((lec) => {
        // Search filter
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          lec.title.toLowerCase().includes(query) ||
          (lec.description && lec.description.toLowerCase().includes(query)) ||
          (lec.course && lec.course.title.toLowerCase().includes(query)) ||
          (lec.batch && lec.batch.name.toLowerCase().includes(query)) ||
          (lec.trainer && lec.trainer.name.toLowerCase().includes(query));

        // Course filter
        const matchesCourse =
          selectedCourse === "ALL" || (lec.course && lec.course.id === selectedCourse);

        // Batch filter
        const matchesBatch =
          selectedBatch === "ALL" || (lec.batch && lec.batch.id === selectedBatch);

        return matchesQuery && matchesCourse && matchesBatch;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") {
          return new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime();
        }
        if (sortBy === "OLDEST") {
          return new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime();
        }
        if (sortBy === "TITLE") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [recordings, searchQuery, selectedCourse, selectedBatch, sortBy]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper to render responsive embed
  const renderVideoPlayer = (url: string, title: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const embedUrl = url.includes("youtu.be/")
        ? `https://www.youtube.com/embed/${url.split("youtu.be/")[1]?.split("?")[0]}`
        : url.replace("watch?v=", "embed/").split("&")[0];
      return (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      );
    }

    if (url.includes("drive.google.com")) {
      const embedUrl = url.replace("/view", "/preview").replace("/edit", "/preview");
      return (
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay"
          allowFullScreen
          className="w-full h-full border-0"
        />
      );
    }

    return (
      <video
        key={url}
        src={url}
        controls
        autoPlay
        controlsList="nodownload"
        className="w-full h-full object-contain bg-black"
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl jvm-gradient-bg p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide">
              <Film className="w-3.5 h-3.5 text-purple-200" />
              <span>FACULTY LECTURE ARCHIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Recorded Lectures
            </h1>
            <p className="text-purple-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Access complete recordings of your live classes, faculty masterclasses, and cohort
              training sessions anytime. Revisit explanations and learn at your own pace.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-24">
              <div className="text-2xl sm:text-3xl font-black">{recordings.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Total Sessions
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-24">
              <div className="text-2xl sm:text-3xl font-black">{courses.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Courses
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS: Class Recordings vs Google Drive Cloud Directory */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("RECORDINGS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === "RECORDINGS"
              ? "bg-[#7C248C] text-white shadow-md shadow-purple-950/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Cohort Class Recordings ({recordings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("DRIVE");
            if (driveItems.length === 0) {
              loadDriveFolder();
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === "DRIVE"
              ? "bg-[#7C248C] text-white shadow-md shadow-purple-950/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Pre-Recorded Drive Archive</span>
        </button>
      </div>

      {activeTab === "RECORDINGS" ? (
        <>
          {/* FILTER CONTROLS BAR */}
          <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5 justify-between">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="recorded-lecture-search-input"
              type="text"
              placeholder="Search lectures by topic, faculty, or cohort..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-600 focus:outline-none text-xs text-slate-800 transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Actions Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Course Filter */}
            {courses.length > 0 && (
              <select
                id="recorded-lecture-course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:border-purple-300 focus:border-purple-600 focus:outline-none transition cursor-pointer"
              >
                <option value="ALL">All Courses ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}

            {/* Batch Filter */}
            {batches.length > 0 && (
              <select
                id="recorded-lecture-batch-filter"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:border-purple-300 focus:border-purple-600 focus:outline-none transition cursor-pointer"
              >
                <option value="ALL">All Cohort Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="recorded-lecture-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "NEWEST" | "OLDEST" | "TITLE")}
                className="bg-transparent border-0 text-slate-700 font-bold text-xs focus:outline-none cursor-pointer py-1"
              >
                <option value="NEWEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="TITLE">Title A-Z</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                id="recorded-lecture-grid-view-btn"
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "GRID"
                    ? "bg-white text-purple-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="recorded-lecture-list-view-btn"
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "LIST"
                    ? "bg-white text-purple-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Pill Row */}
        {(searchQuery || selectedCourse !== "ALL" || selectedBatch !== "ALL") && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
              Filters:
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                &ldquo;{searchQuery}&rdquo;
                <X
                  className="w-3 h-3 cursor-pointer hover:text-purple-900"
                  onClick={() => setSearchQuery("")}
                />
              </span>
            )}
            {selectedCourse !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
                Course: {courses.find((c) => c.id === selectedCourse)?.title}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                  onClick={() => setSelectedCourse("ALL")}
                />
              </span>
            )}
            {selectedBatch !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-medium">
                Batch: {batches.find((b) => b.id === selectedBatch)?.name}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-pink-900"
                  onClick={() => setSelectedBatch("ALL")}
                />
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("ALL");
                setSelectedBatch("ALL");
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* RECORDINGS DISPLAY */}
      {filteredLectures.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {recordings.length === 0
                ? "No recorded lectures uploaded yet"
                : "No lectures match your filters"}
            </h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              {recordings.length === 0
                ? "When your faculty or admin publishes a class recording, it will appear here directly in your archive."
                : "Try adjusting your search terms or clearing your course and batch filters."}
            </p>
          </div>
          {(searchQuery || selectedCourse !== "ALL" || selectedBatch !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("ALL");
                setSelectedBatch("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "GRID" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLectures.map((lecture) => (
            <div
              key={lecture.id}
              onClick={() => setActiveLecture(lecture)}
              className="group bg-white rounded-3xl border border-slate-200/90 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-900/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
            >
              {/* VIDEO THUMBNAIL / PREVIEW COVER */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                {/* Background decorative mesh / gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#7C248C] via-[#4A154B] to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-500" />

                {/* Film watermark logo */}
                <Tv className="w-20 h-20 text-white/10 absolute -bottom-4 -right-4 pointer-events-none" />

                {/* Big Animated Play Button */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-115 group-hover:bg-[#7C248C] group-hover:border-purple-400 transition-all duration-300 shadow-lg">
                  <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                </div>

                {/* Top Badge: Course */}
                {lecture.course && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                      <BookOpen className="w-3 h-3 text-purple-300" />
                      <span className="truncate max-w-[160px]">{lecture.course.title}</span>
                    </span>
                  </div>
                )}

                {/* Bottom Badges: Duration & Batch */}
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-white">
                  {lecture.batch ? (
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/70 backdrop-blur-md border border-purple-400/30 text-purple-200 font-mono text-[10px] font-bold">
                      {lecture.batch.name}
                    </span>
                  ) : (
                    <span />
                  )}

                  {lecture.durationMinutes ? (
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-300" />
                      {lecture.durationMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>{formatDate(lecture.recordedDate)}</span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#7C248C] transition line-clamp-2 leading-snug">
                    {lecture.title}
                  </h3>

                  {lecture.description && (
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {lecture.description}
                    </p>
                  )}
                </div>

                {/* Trainer Info & Watch CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {lecture.trainer ? (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {lecture.trainer.avatarUrl ? (
                        <img
                          src={lecture.trainer.avatarUrl}
                          alt={lecture.trainer.name}
                          className="w-7 h-7 rounded-lg object-cover border border-purple-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg jvm-gradient-bg text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {lecture.trainer.name.charAt(0)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {lecture.trainer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {lecture.trainer.designation || "Faculty"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono">Faculty Archive</div>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 group-hover:bg-[#7C248C] text-[#7C248C] group-hover:text-white font-bold text-xs transition duration-200 shrink-0 shadow-2xs">
                    <span>Watch</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {filteredLectures.map((lecture) => (
            <div
              key={lecture.id}
              onClick={() => setActiveLecture(lecture)}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-md p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-4 flex-1 overflow-hidden">
                <div className="w-12 h-12 rounded-2xl jvm-gradient-bg text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-sm">
                  <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                </div>

                <div className="space-y-1 flex-1 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2">
                    {lecture.course && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                        {lecture.course.title}
                      </span>
                    )}
                    {lecture.batch && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {lecture.batch.name}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(lecture.recordedDate)}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#7C248C] transition truncate">
                    {lecture.title}
                  </h3>

                  {lecture.trainer && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <span>Instructor:</span>
                      <span className="font-bold text-slate-800">{lecture.trainer.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {lecture.durationMinutes && (
                  <span className="text-xs text-slate-400 font-mono">
                    {lecture.durationMinutes} min
                  </span>
                )}
                <span className="px-4 py-2 rounded-xl jvm-gradient-bg text-white font-bold text-xs flex items-center gap-1.5 shadow-xs group-hover:shadow-md transition">
                  <Play className="w-3.5 h-3.5 fill-white" /> Watch Lecture
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* GOOGLE DRIVE PRE-RECORDED ARCHIVE DIRECTORY */
        <div className="space-y-6">
          {/* Breadcrumbs & Navigation Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#7C248C] flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {driveCurrentFolder ? driveCurrentFolder.name : driveRootName}
                </h3>
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 overflow-x-auto pt-1">
                <button
                  type="button"
                  onClick={() => loadDriveFolder()}
                  className="hover:text-[#7C248C] flex items-center gap-1 shrink-0 cursor-pointer text-slate-500"
                >
                  <span>{driveRootName}</span>
                </button>

                {driveFolderHistory.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1.5 shrink-0">
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => loadDriveFolder(crumb.id, crumb.name)}
                      className={`hover:text-[#7C248C] cursor-pointer ${
                        idx === driveFolderHistory.length - 1
                          ? "text-[#7C248C] font-extrabold"
                          : "text-slate-500"
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadDriveFolder(driveCurrentFolder?.id)}
              disabled={driveLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? "animate-spin" : ""}`} />
              <span>Refresh Directory</span>
            </button>
          </div>

          {/* FOLDER CONTENTS */}
          {driveLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Fetching lecture materials...</p>
            </div>
          ) : driveItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No content available</h4>
              <p className="text-xs text-slate-400">
                No recorded lectures found in this directory folder yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {driveItems.map((item) => {
                if (item.isFolder) {
                  return (
                    <div
                      key={item.id}
                      onClick={() => loadDriveFolder(item.id, item.name)}
                      className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Folder className="w-5 h-5 fill-purple-100" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 group-hover:text-[#7C248C] transition text-xs line-clamp-2">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">Directory Folder</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-[#7C248C]">
                        <span>Open Folder</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  );
                }

                // Video item card
                const isVideo = item.mimeType?.includes("video") || item.name?.match(/\.(mp4|mkv|webm|mov)$/i);
                const isImage = item.mimeType?.includes("image") || item.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Video Thumbnail */}
                      <div className="w-full aspect-video rounded-xl bg-slate-900 overflow-hidden relative flex items-center justify-center mb-3">
                        {item.thumbnailLink ? (
                          <img
                            src={item.thumbnailLink}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition"
                          />
                        ) : isVideo ? (
                          <Film className="w-8 h-8 text-slate-500" />
                        ) : isImage ? (
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        ) : (
                          <FileText className="w-8 h-8 text-slate-500" />
                        )}
                        {isVideo ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                            className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/90 text-[#7C248C] flex items-center justify-center shadow-lg group-hover:scale-110 transition cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current translate-x-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                            className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/90 text-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="font-bold text-slate-900 text-xs line-clamp-2" title={item.name}>
                        {item.name}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        {item.videoDurationMinutes && (
                          <span>{item.videoDurationMinutes} mins</span>
                        )}
                        {item.size && (
                          <span>{(Number(item.size) / (1024 * 1024)).toFixed(1)} MB</span>
                        )}
                        <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                          {isVideo ? "Video" : isImage ? "Image" : "Document"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      {isVideo ? (
                        <button
                          type="button"
                          onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                          className="flex-1 py-2 rounded-xl bg-purple-50 hover:bg-[#7C248C] text-[#7C248C] hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Watch Lecture
                        </button>
                      ) : isImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                          className="flex-1 py-2 rounded-xl bg-purple-50 hover:bg-[#7C248C] text-[#7C248C] hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Image
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Document
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CINEMATIC VIDEO PLAYER MODAL */}
      {activeLecture && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[96vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl jvm-gradient-bg flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-400/30">
                      Recorded Lecture
                    </span>
                    {activeLecture.course && (
                      <span className="text-slate-400 text-xs truncate font-medium">
                        {activeLecture.course.title}
                      </span>
                    )}
                  </div>
                  <h2 className="font-black text-white text-sm sm:text-base truncate mt-0.5">
                    {activeLecture.title}
                  </h2>
                </div>
              </div>

              {/* Close & External Link Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeLecture.videoUrl)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                  title="Copy video link"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline font-bold">
                    {copiedLink ? "Copied" : "Share"}
                  </span>
                </button>

                <a
                  href={activeLecture.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveLecture(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Close player (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player Frame */}
            <div className="w-full aspect-video bg-black flex items-center justify-center shrink-0">
              {renderVideoPlayer(activeLecture.videoUrl, activeLecture.title)}
            </div>

            {/* Modal Footer / Details Bar */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 overflow-y-auto">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Recorded on {formatDate(activeLecture.recordedDate)}
                  </span>
                  {activeLecture.batch && (
                    <span className="font-mono text-purple-300">
                      Cohort: {activeLecture.batch.name}
                    </span>
                  )}
                  {activeLecture.trainer && (
                    <span className="text-slate-300">
                      Faculty: <strong className="text-white">{activeLecture.trainer.name}</strong>
                    </span>
                  )}
                </div>
                {activeLecture.description && (
                  <p className="text-slate-400 text-xs leading-relaxed max-w-3xl">
                    {activeLecture.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLecture(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE VIDEO PLAYER MODAL */}
      {previewDriveFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[96vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl jvm-gradient-bg flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-400/30">
                      Google Drive Pre-Recorded Lecture
                    </span>
                  </div>
                  <h2 className="font-black text-white text-sm sm:text-base truncate mt-0.5">
                    {previewDriveFile.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDriveFile(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Close player (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* File Viewer (Video vs Image vs Document) */}
            <div className="w-full aspect-video max-h-[75vh] bg-black flex items-center justify-center overflow-hidden">
              {previewDriveFile.mimeType?.includes("image") || previewDriveFile.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                <img
                  src={`/api/drive/stream/${previewDriveFile.id}`}
                  alt={previewDriveFile.name}
                  className="max-w-full max-h-[75vh] object-contain p-2"
                />
              ) : previewDriveFile.mimeType?.includes("video") || previewDriveFile.name.match(/\.(mp4|mkv|webm|mov)$/i) ? (
                <video
                  key={previewDriveFile.id}
                  src={`/api/drive/stream/${previewDriveFile.id}`}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              ) : (
                <iframe
                  src={`https://drive.google.com/file/d/${previewDriveFile.id}/preview`}
                  title={previewDriveFile.name}
                  className="w-full h-[70vh] border-0 bg-white"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span className="text-[11px] text-slate-400">
                Loaded directly from institution Drive securely via LMS proxy. No downloads or email shares needed.
              </span>
              <button
                type="button"
                onClick={() => setPreviewDriveFile(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
