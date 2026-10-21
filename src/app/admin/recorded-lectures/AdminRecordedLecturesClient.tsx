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
  Folder,
  HardDrive,
  FolderOpen,
  ChevronRight,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  FileText,
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
  initialDriveStatus?: {
    isConnected: boolean;
    email: string | null;
    rootFolderId: string | null;
    rootFolderName: string | null;
  };
}

export default function AdminRecordedLecturesClient({
  initialRecordings,
  courses,
  batches,
  trainers,
  currentUserId,
  initialGoogleStatus,
  initialDriveStatus,
}: AdminRecordedLecturesClientProps) {
  const [recordings, setRecordings] = useState<AdminRecordedLecture[]>(initialRecordings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "TITLE">("NEWEST");

  // Google Account Connection Status (Meet)
  const [googleStatus, setGoogleStatus] = useState<{
    isConnected: boolean;
    email: string | null;
    authUrl?: string | null;
  }>({
    isConnected: initialGoogleStatus?.isConnected || false,
    email: initialGoogleStatus?.email || null,
  });

  // Google Drive Connection & Explorer Status
  const [driveStatus, setDriveStatus] = useState<{
    isConnected: boolean;
    email: string | null;
    authUrl?: string | null;
    rootFolderId: string | null;
    rootFolderName: string | null;
  }>({
    isConnected: initialDriveStatus?.isConnected || false,
    email: initialDriveStatus?.email || null,
    rootFolderId: initialDriveStatus?.rootFolderId || null,
    rootFolderName: initialDriveStatus?.rootFolderName || null,
  });

  // Drive Explorer Modal
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [driveCurrentFolder, setDriveCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [driveFolderHistory, setDriveFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [settingRoot, setSettingRoot] = useState(false);

  // Active Tab: PUBLISHED_LECTURES vs DRIVE_ARCHIVE
  const [activeTab, setActiveTab] = useState<"PUBLISHED" | "DRIVE">("PUBLISHED");

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activePreviewLecture, setActivePreviewLecture] = useState<AdminRecordedLecture | null>(null);
  const [previewDriveFile, setPreviewDriveFile] = useState<{ id: string; name: string; mimeType?: string } | null>(null);
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

  // Disconnect Google Drive
  const handleDisconnectDrive = async () => {
    if (confirm("Disconnect this Google Drive Account?")) {
      try {
        const res = await fetch("/api/admin/google-drive", { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setDriveStatus({
            isConnected: false,
            email: null,
            authUrl: null,
            rootFolderId: null,
            rootFolderName: null,
          });
          setDriveItems([]);
          showToast("success", "Google Drive disconnected successfully");
        }
      } catch {
        showToast("error", "Failed to disconnect Google Drive");
      }
    }
  };

  // Load Google Drive Folder contents
  const loadDriveFolder = async (folderId?: string, folderName?: string) => {
    setDriveLoading(true);
    try {
      const url = folderId
        ? `/api/admin/google-drive?folderId=${encodeURIComponent(folderId)}`
        : "/api/admin/google-drive";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setDriveItems(data.data.items || []);
        setDriveCurrentFolder(data.data.currentFolder || null);

        // Update breadcrumb history if navigating deeper
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
      } else {
        showToast("error", data.error || "Failed to query Google Drive files");
      }
    } catch {
      showToast("error", "Network error communicating with Google Drive");
    } finally {
      setDriveLoading(false);
    }
  };

  // Set current folder as the default root folder for student lectures
  const handleSetCurrentAsRoot = async () => {
    if (!driveCurrentFolder) return;
    setSettingRoot(true);
    try {
      const res = await fetch("/api/admin/google-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootFolderId: driveCurrentFolder.id,
          rootFolderName: driveCurrentFolder.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDriveStatus((prev) => ({
          ...prev,
          rootFolderId: driveCurrentFolder.id,
          rootFolderName: driveCurrentFolder.name,
        }));
        showToast("success", `Root lecture folder set to: "${driveCurrentFolder.name}"`);
      } else {
        showToast("error", data.error || "Failed to set root folder");
      }
    } catch {
      showToast("error", "Failed to set root folder");
    } finally {
      setSettingRoot(false);
    }
  };

  // On mount check auth redirects & fetch status asynchronously
  useEffect(() => {
    let isMounted = true;

    // Fetch Google Meet status
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

    // Fetch Google Drive status
    fetch("/api/admin/google-drive")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data) {
          setDriveStatus({
            isConnected: Boolean(data.data.isConnected),
            email: data.data.email || null,
            authUrl: data.data.authUrl || null,
            rootFolderId: data.data.rootFolderId || null,
            rootFolderName: data.data.rootFolderName || null,
          });
          if (data.data.isConnected && data.data.items) {
            setDriveItems(data.data.items);
            setDriveCurrentFolder(data.data.currentFolder);
          }
        }
      })
      .catch((e) => {
        console.error("Failed to query Google Drive status:", e);
      });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const googleAuth = params.get("google_auth");
      const driveAuth = params.get("drive_auth");

      if (driveAuth === "success") {
        const email = params.get("email");
        setTimeout(() => {
          showToast("success", `Google Drive connected successfully: ${email || ""}`);
        }, 100);
        window.history.replaceState({}, "", window.location.pathname);
      } else if (driveAuth === "error" || driveAuth === "failed") {
        const msg = params.get("msg");
        setTimeout(() => {
          showToast("error", msg || "Failed to link Google Drive");
        }, 100);
        window.history.replaceState({}, "", window.location.pathname);
      }

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

          {/* Action Group: Google Meet + Google Drive + Upload CTA */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Google Drive Account Pill */}
            {driveStatus?.isConnected ? (
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 border border-purple-200/90 shadow-sm text-xs">
                <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs shrink-0">
                  <HardDrive className="w-4 h-4 text-purple-700" />
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    <span>Drive Connected</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 truncate max-w-[160px]">
                    {driveStatus.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectDrive}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline ml-1 cursor-pointer transition hover:opacity-80 shrink-0"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <a
                href={driveStatus?.authUrl || "#"}
                onClick={(e) => {
                  if (!driveStatus?.authUrl) {
                    e.preventDefault();
                    showToast("error", "Google Client ID / Secret not set in .env");
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs flex items-center gap-2 shadow-sm transition hover:scale-[1.02] cursor-pointer border border-purple-200"
              >
                <HardDrive className="w-4 h-4 text-purple-700" />
                <span>Connect Google Drive</span>
              </a>
            )}

            {/* CTA: Upload Recorded Lecture */}
            <button
              id="admin-upload-lecture-cta-btn"
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-purple-50 text-[#7C248C] font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#7C248C] stroke-[3]" />
              <span>Upload Lecture</span>
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

      {/* TAB NAVIGATION: Published Lectures vs Google Drive Directory */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("PUBLISHED")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === "PUBLISHED"
              ? "bg-[#7C248C] text-white shadow-md shadow-purple-950/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Published Lectures ({recordings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("DRIVE");
            if (driveItems.length === 0 && driveStatus.isConnected) {
              loadDriveFolder(driveStatus.rootFolderId || undefined);
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === "DRIVE"
              ? "bg-[#7C248C] text-white shadow-md shadow-purple-950/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive Directory</span>
          {driveStatus.isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          )}
        </button>
      </div>

      {activeTab === "PUBLISHED" ? (
        <>
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
        </>
      ) : (
        <div className="space-y-6">
          {/* DRIVE STATUS & BREADCRUMBS CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Google Drive Cloud Archive
                  </h3>
                  <p className="text-xs text-slate-500">
                    {driveStatus.isConnected
                      ? `Browsing connected account: ${driveStatus.email}`
                      : "Connect your institution's Google Drive account to browse and share lecture folders."}
                  </p>
                </div>
              </div>

              {driveStatus.isConnected && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadDriveFolder(driveCurrentFolder?.id || driveStatus.rootFolderId || undefined)}
                    disabled={driveLoading}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSetCurrentAsRoot}
                    disabled={settingRoot || !driveCurrentFolder || driveCurrentFolder.id === driveStatus.rootFolderId}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-[#7C248C] text-[#7C248C] hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-purple-200"
                    title="Set this folder as the default home folder for students"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>
                      {driveCurrentFolder?.id === driveStatus.rootFolderId
                        ? "Current Root Folder"
                        : "Set as Default Root"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Configured Root Alert */}
            {driveStatus.rootFolderId && (
              <div className="px-4 py-3 rounded-2xl bg-purple-50/70 border border-purple-200/60 flex items-center justify-between text-xs text-purple-900">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Active Root Folder for Students:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200 text-[#7C248C] font-bold">
                    {driveStatus.rootFolderName || driveStatus.rootFolderId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => loadDriveFolder(driveStatus.rootFolderId || undefined, driveStatus.rootFolderName || "Root")}
                  className="text-xs font-bold text-[#7C248C] underline hover:opacity-80"
                >
                  Go to Root
                </button>
              </div>
            )}

            {/* Folder Breadcrumbs */}
            {driveStatus.isConnected && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => loadDriveFolder(driveStatus.rootFolderId || undefined)}
                  className="hover:text-[#7C248C] flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{driveStatus.rootFolderName || "Drive Home"}</span>
                </button>

                {driveFolderHistory.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1.5 shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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
            )}
          </div>

          {/* FOLDER CONTENTS GRID */}
          {!driveStatus.isConnected ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <HardDrive className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Google Drive Account Not Connected
                </h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Connect your Google Drive account with lecture folders. Students will be able to watch all
                  pre-recorded videos through the system without you manually managing individual Drive email access.
                </p>
              </div>
              <a
                href={driveStatus?.authUrl || "#"}
                onClick={(e) => {
                  if (!driveStatus?.authUrl) {
                    e.preventDefault();
                    showToast("error", "Google Client ID / Secret not set in .env");
                  }
                }}
                className="px-6 py-3 rounded-2xl jvm-gradient-bg text-white font-bold text-xs shadow-md transition cursor-pointer inline-flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" /> Connect Institution Google Drive
              </a>
            </div>
          ) : driveLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Fetching contents from Google Drive...</p>
            </div>
          ) : driveItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">This folder is empty</h4>
              <p className="text-xs text-slate-400">No subfolders or video files found in this directory.</p>
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

                // Video / Image / File card
                const isVideo = item.mimeType?.includes("video") || item.name?.match(/\.(mp4|mkv|webm|mov)$/i);
                const isImage = item.mimeType?.includes("image") || item.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Thumbnail or File placeholder */}
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
                          className="flex-1 py-1.5 rounded-xl bg-purple-50 hover:bg-[#7C248C] text-[#7C248C] hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" /> Watch Video
                        </button>
                      ) : isImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                          className="flex-1 py-1.5 rounded-xl bg-purple-50 hover:bg-[#7C248C] text-[#7C248C] hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Image
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPreviewDriveFile({ id: item.id, name: item.name, mimeType: item.mimeType })}
                          className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
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

      {/* GOOGLE DRIVE VIDEO STREAM PREVIEW MODAL */}
      {previewDriveFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-white text-sm sm:text-base truncate">
                    {previewDriveFile.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-purple-300 font-mono">
                    <span>Google Drive Proxy Stream</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDriveFile(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                title="Close player"
              >
                <X className="w-5 h-5" />
              </button>
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
            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] text-slate-400">
                Loaded securely from institution Google Drive via LMS proxy.
              </span>
              <button
                type="button"
                onClick={() => setPreviewDriveFile(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
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
