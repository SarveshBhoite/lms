"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Film,
  Plus,
  Search,
  Layers,
  User,
  X,
  Play,
  Upload,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Bell,
  Link as LinkIcon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Google SVG Icon Component
function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export interface AdminRecordedLecture {
  id: string;
  sourceType: "LIVE_CLASS" | "RESOURCE";
  title: string;
  description?: string | null;
  videoUrl: string;
  recordedDate: string;
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

interface CourseOption {
  id: string;
  title: string;
  trainerId: string;
  batches: { id: string; name: string; status: string }[];
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
  course: { id: string; title: string };
  status: string;
}

interface TrainerOption {
  id: string;
  name: string;
  email: string;
  role: string;
  profile?: { avatarUrl?: string | null; designation?: string | null } | null;
}

interface AdminRecordedLecturesClientProps {
  initialRecordings: AdminRecordedLecture[];
  courses: CourseOption[];
  batches: BatchOption[];
  trainers: TrainerOption[];
  currentUserId: string;
  initialGoogleStatus?: {
    isConnected: boolean;
    email: string | null;
  };
}

export default function AdminRecordedLecturesClient({
  initialRecordings,
  courses,
  batches,
  trainers,
  currentUserId,
  initialGoogleStatus,
}: AdminRecordedLecturesClientProps) {
  const [recordings, setRecordings] = useState<AdminRecordedLecture[]>(initialRecordings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "TITLE">("NEWEST");

  // Google Account Connection Status
  const [googleStatus, setGoogleStatus] = useState<{
    isConnected: boolean;
    email: string | null;
    authUrl?: string | null;
  }>({
    isConnected: initialGoogleStatus?.isConnected || false,
    email: initialGoogleStatus?.email || null,
  });

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activePreviewLecture, setActivePreviewLecture] = useState<AdminRecordedLecture | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [uploadSource, setUploadSource] = useState<"FILE" | "URL">("FILE");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    courseId: "",
    batchId: "",
    trainerId: currentUserId,
    recordedDate: new Date().toISOString().split("T")[0],
    durationMinutes: 60,
    notifyStudents: true,
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };


  // Disconnect Google Account
  const handleDisconnectGoogle = async () => {
    if (confirm("Disconnect this Google Account?")) {
      try {
        const res = await fetch("/api/trainer/google-account", { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setGoogleStatus({
            isConnected: false,
            email: null,
            authUrl: null,
          });
          showToast("success", "Google account disconnected successfully");
        }
      } catch {
        showToast("error", "Failed to disconnect Google account");
      }
    }
  };

  // On mount check auth redirects & fetch status asynchronously
  useEffect(() => {
    let isMounted = true;

    fetch("/api/trainer/google-account")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data) {
          setGoogleStatus({
            isConnected: Boolean(data.data.isConnected),
            email: data.data.email || null,
            authUrl: data.data.authUrl || null,
          });
        }
      })
      .catch((e) => {
        console.error("Failed to query Google account status:", e);
      });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const googleAuth = params.get("google_auth");
      if (googleAuth === "success") {
        const email = params.get("email");
        setTimeout(() => {
          showToast("success", `Google account connected: ${email || ""}`);
        }, 100);
        window.history.replaceState({}, "", window.location.pathname);
      } else if (googleAuth === "error" || googleAuth === "failed") {
        const msg = params.get("msg");
        setTimeout(() => {
          showToast("error", msg || "Failed to link Google account");
        }, 100);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // When course changes in upload form, auto-suggest first batch
  const handleCourseChange = (cId: string) => {
    const courseBatches = batches.filter((b) => b.courseId === cId);
    setFormData((prev) => ({
      ...prev,
      courseId: cId,
      batchId: courseBatches.length > 0 ? courseBatches[0].id : "",
    }));
  };

  // Upload video file directly to /api/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress(20);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("category", "recordings");

      setUploadProgress(50);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload video file");
      }

      setUploadProgress(100);
      setFormData((prev) => ({
        ...prev,
        videoUrl: json.data.url,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      }));
      showToast("success", `Video file "${file.name}" uploaded successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Video upload failed";
      showToast("error", msg);
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit new recorded lecture
  const handleSubmitLecture = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast("error", "Please provide a lecture title");
      return;
    }

    if (!formData.batchId) {
      showToast("error", "Please select a target cohort batch");
      return;
    }

    if (!formData.videoUrl.trim()) {
      showToast("error", "Please upload a video or provide a video URL");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to publish lecture recording");
      }

      setRecordings((prev) => [json.data, ...prev]);
      showToast("success", "Recorded lecture published! Enrolled students notified.");
      setIsUploadModalOpen(false);

      // Reset form
      setFormData({
        title: "",
        description: "",
        videoUrl: "",
        courseId: "",
        batchId: "",
        trainerId: currentUserId,
        recordedDate: new Date().toISOString().split("T")[0],
        durationMinutes: 60,
        notifyStudents: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save lecture";
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete lecture
  const handleDeleteLecture = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the recording "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/recordings/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete lecture");
      }

      setRecordings((prev) => prev.filter((r) => r.id !== id));
      showToast("success", "Lecture recording deleted successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete lecture";
      showToast("error", msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered and sorted list
  const filteredLectures = useMemo(() => {
    return recordings
      .filter((lec) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          lec.title.toLowerCase().includes(query) ||
          (lec.description && lec.description.toLowerCase().includes(query)) ||
          (lec.course && lec.course.title.toLowerCase().includes(query)) ||
          (lec.batch && lec.batch.name.toLowerCase().includes(query)) ||
          (lec.trainer && lec.trainer.name.toLowerCase().includes(query));

        const matchesCourse =
          selectedCourse === "ALL" || (lec.course && lec.course.id === selectedCourse);
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

  // Video embed renderer
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
        className="w-full h-full object-contain bg-black"
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 border ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl jvm-gradient-bg p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide">
              <Film className="w-3.5 h-3.5 text-purple-200" />
              <span>FACULTY RECORDINGS MANAGEMENT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Recorded Lectures Control
            </h1>
            <p className="text-purple-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Upload and manage class session recordings. When you publish a lecture here, it
              immediately appears on enrolled students&apos; dashboards under Recorded Lectures.
            </p>
          </div>

          {/* Action Group: Google Status Pill + Upload Recorded Lecture CTA */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Google Connected Pill from Screenshot */}
            {googleStatus?.isConnected ? (
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-emerald-300 shadow-sm text-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs uppercase shrink-0">
                  {googleStatus.email?.[0] || "A"}
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Connected</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">
                    {googleStatus.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 underline ml-2 cursor-pointer transition hover:opacity-80 shrink-0"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <a
                href={googleStatus?.authUrl || "/api/trainer/google-account"}
                className="px-4 py-2.5 rounded-full bg-white border border-slate-200 hover:border-purple-300 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-sm transition hover:scale-[1.02] cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Connect Google</span>
              </a>
            )}

            {/* CTA: Upload Recorded Lecture */}
            <button
              id="admin-upload-lecture-cta-btn"
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-purple-50 text-[#7C248C] font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#7C248C] stroke-[3]" />
              <span>Upload Recorded Lecture</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{recordings.length}</div>
            <div className="text-xs font-medium text-slate-500">Published Recordings</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{batches.length}</div>
            <div className="text-xs font-medium text-slate-500">Active Cohort Batches</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{trainers.length}</div>
            <div className="text-xs font-medium text-slate-500">Faculty Trainers</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lectures by title, faculty, or cohort..."
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Course Filter */}
            <select
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

            {/* Batch Filter */}
            <select
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

            {/* Sort */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "NEWEST" | "OLDEST" | "TITLE")}
                className="bg-transparent border-0 text-slate-700 font-bold text-xs focus:outline-none cursor-pointer py-1"
              >
                <option value="NEWEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="TITLE">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* RECORDINGS TABLE / GRID */}
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
              Click &ldquo;Upload Recorded Lecture&rdquo; to upload an MP4/WebM file or link a video stream for
              any cohort.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold text-xs shadow-md transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Upload First Lecture
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Lecture Title</th>
                  <th className="py-3.5 px-4">Course & Cohort</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Recorded Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredLectures.map((lecture) => (
                  <tr key={lecture.id} className="hover:bg-purple-50/40 transition group">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActivePreviewLecture(lecture)}
                          className="w-10 h-10 rounded-xl jvm-gradient-bg text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-xs cursor-pointer"
                          title="Preview Lecture"
                        >
                          <Play className="w-4 h-4 fill-white translate-x-0.5" />
                        </button>
                        <div className="overflow-hidden max-w-xs sm:max-w-md">
                          <div className="font-extrabold text-slate-900 group-hover:text-[#7C248C] transition truncate">
                            {lecture.title}
                          </div>
                          {lecture.description && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {lecture.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {lecture.course && (
                          <div className="font-bold text-slate-800 text-xs">
                            {lecture.course.title}
                          </div>
                        )}
                        {lecture.batch && (
                          <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-[#7C248C] font-mono text-[10px] font-bold border border-purple-200">
                            {lecture.batch.name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {lecture.trainer ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg jvm-gradient-bg text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {lecture.trainer.name.charAt(0)}
                          </div>
                          <span className="text-slate-800 font-bold truncate max-w-[120px]">
                            {lecture.trainer.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Faculty</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(lecture.recordedDate)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePreviewLecture(lecture)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-[#7C248C] text-[#7C248C] hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" /> Preview
                        </button>

                        <a
                          href={lecture.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Open Video URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          disabled={deletingId === lecture.id}
                          onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Lecture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD RECORDED LECTURE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl jvm-gradient-bg text-white flex items-center justify-center shadow-sm">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Upload Recorded Lecture
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Publish a recorded lecture to make it instantly visible on the student dashboard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitLecture} className="space-y-4">
              {/* Lecture Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Session 12: Data Structures & Trees Masterclass"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-medium focus:outline-none transition"
                />
              </div>

              {/* Course & Batch Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                    Associated Course
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-medium focus:outline-none transition cursor-pointer"
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                    Target Cohort Batch *
                  </label>
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-medium focus:outline-none transition cursor-pointer"
                  >
                    <option value="">Select Batch Cohort...</option>
                    {batches
                      .filter((b) => !formData.courseId || b.courseId === formData.courseId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.course.title})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Faculty & Recorded Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                    Instructor / Faculty
                  </label>
                  <select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-medium focus:outline-none transition cursor-pointer"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                    Recorded Date
                  </label>
                  <input
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => setFormData({ ...formData, recordedDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-medium focus:outline-none transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Video Source Choice Tabs */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                    Video Source *
                  </label>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUploadSource("FILE")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        uploadSource === "FILE"
                          ? "bg-white text-purple-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSource("URL")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        uploadSource === "URL"
                          ? "bg-white text-purple-700 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Video URL / Stream
                    </button>
                  </div>
                </div>

                {uploadSource === "FILE" ? (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/60 hover:bg-purple-50/20">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/mkv,.mp4,.webm"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {uploadingFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                          <span className="text-xs font-bold text-purple-700">
                            Uploading lecture video file... {uploadProgress}%
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-purple-100/70 text-purple-700 flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-bold text-purple-700 hover:underline">
                              Choose a video file from your computer
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Supports MP4, WebM, and standard video formats
                            </p>
                          </div>
                        </>
                      )}
                    </label>

                    {formData.videoUrl && (
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 text-xs">
                        <span className="font-mono text-purple-900 truncate font-bold">
                          Attached: {formData.videoUrl}
                        </span>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... or https://youtube.com/... or https://res.cloudinary.com/..."
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-mono focus:outline-none transition"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Supports direct Cloudinary videos, Google Drive preview links, and YouTube.
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts covered, slide references, homework tasks..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-xs text-slate-900 font-medium focus:outline-none transition resize-none"
                />
              </div>

              {/* Notify Students Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/60 border border-purple-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyStudents}
                  onChange={(e) =>
                    setFormData({ ...formData, notifyStudents: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-600" />
                    Push notification to enrolled students
                  </span>
                  <p className="text-purple-700/80 text-[11px]">
                    Instantly alert all enrolled cohort students that a new recorded lecture has
                    been published.
                  </p>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      <span>Publish Recorded Lecture</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PREVIEW PLAYER MODAL */}
      {activePreviewLecture && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[96vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl jvm-gradient-bg flex items-center justify-center text-white shrink-0">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-400/30">
                    Admin Preview
                  </span>
                  <h3 className="font-black text-white text-sm sm:text-base truncate mt-0.5">
                    {activePreviewLecture.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activePreviewLecture.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Open video URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setActivePreviewLecture(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black flex items-center justify-center shrink-0">
              {renderVideoPlayer(activePreviewLecture.videoUrl, activePreviewLecture.title)}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-purple-300">
                Cohort: {activePreviewLecture.batch?.name || "All Cohorts"}
              </span>
              <button
                type="button"
                onClick={() => setActivePreviewLecture(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
              >
                Exit Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
