"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Video,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Link2,
  Layers,
  BookOpen,
  CheckSquare,
  Check,
  Radio,
  Users,
  Calendar,
} from "lucide-react";

interface LiveClassItem {
  id: string;
  courseId?: string | null;
  batchId: string;
  batchIds: string[];
  trainerId: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  lateCutoffMinutes: number;
  meetUrl: string;
  recordingUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  course?: { id: string; title: string } | null;
  batch: {
    id: string;
    name: string;
    course: { title: string };
    students?: { id: string }[];
  };
  trainer: { id: string; name: string; email: string };
  attendances: { id: string; userId: string; status: string; isApproved: boolean }[];
}

interface BatchOption {
  id: string;
  name: string;
  course: { id: string; title: string };
}

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

export default function TrainerLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Google Account Status
  const [googleStatus, setGoogleStatus] = useState<{
    isConnected: boolean;
    email: string | null;
    isConfigured: boolean;
    authUrl: string | null;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [classTypeFilter, setClassTypeFilter] = useState<"ALL" | "COURSE" | "GENERAL">("ALL");

  // Schedule Modal State & Stepper
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Batch dropdown selector in Step 2
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    platformType: "MANUAL" as "MANUAL" | "GOOGLE_MEET",
    classType: "COURSE" as "COURSE" | "GENERAL",
    courseId: "",
    batchId: "",
    selectedBatchIds: [] as string[],
    title: "",
    description: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startHour: "05",
    startMinute: "30",
    startPeriod: "PM" as "AM" | "PM",
    lateCutoffMinutes: 10,
    meetUrl: "",
    recordingUrl: "",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLiveClasses = async () => {
    try {
      const res = await fetch("/api/trainer/live-classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch live classes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch("/api/trainer/google-account");
      const data = await res.json();
      if (data.success) {
        setGoogleStatus(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch google account status:", e);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
    fetchGoogleStatus();

    const params = new URLSearchParams(window.location.search);
    const urlBatchId = params.get("batchId");
    const urlCourseId = params.get("courseId");

    fetch("/api/trainer/batches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBatches(data.data);
          if (data.data.length > 0) {
            const targetBatch = (urlBatchId && data.data.find((b: any) => b.id === urlBatchId)) || data.data[0];
            setForm((prev) => ({
              ...prev,
              batchId: targetBatch.id,
              courseId: targetBatch.course.id,
              selectedBatchIds: [targetBatch.id],
            }));

            // If arrived from batch creation or batch cockpit to schedule class, open modal
            if (urlBatchId) {
              setIsScheduleModalOpen(true);
            }
          }
        }
      });
  }, []);

  // Close batch dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setIsBatchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleBatch = (batchId: string) => {
    setForm((prev) => {
      const exists = prev.selectedBatchIds.includes(batchId);
      let updated: string[];
      if (exists) {
        if (prev.selectedBatchIds.length === 1) return prev;
        updated = prev.selectedBatchIds.filter((id) => id !== batchId);
      } else {
        updated = [...prev.selectedBatchIds, batchId];
      }
      const primary = updated[0] || "";
      const matchedBatch = batches.find((b) => b.id === primary);
      return {
        ...prev,
        selectedBatchIds: updated,
        batchId: primary,
        courseId: matchedBatch?.course?.id || prev.courseId,
      };
    });
  };

  const resetModal = () => {
    setStep(1);
    setIsScheduleModalOpen(false);
    setIsBatchDropdownOpen(false);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.selectedBatchIds.length === 0 || !form.title.trim() || !form.scheduledDate) {
      showToast("error", "Please fill in all required fields and select at least one batch");
      return;
    }

    if (form.platformType === "MANUAL" && !form.meetUrl.trim()) {
      showToast("error", "Please enter your meeting link (Meet / Zoom / Teams URL)");
      return;
    }

    if (form.platformType === "GOOGLE_MEET" && !googleStatus?.isConnected) {
      showToast("error", "Please connect your Google Account first or choose Custom Meeting Link.");
      return;
    }

    setSubmitting(true);
    try {
      let hour24 = parseInt(form.startHour, 10);
      if (form.startPeriod === "PM" && hour24 < 12) hour24 += 12;
      if (form.startPeriod === "AM" && hour24 === 12) hour24 = 0;
      const formatted24Time = `${String(hour24).padStart(2, "0")}:${form.startMinute}:00`;

      const startDateTime = new Date(`${form.scheduledDate}T${formatted24Time}`);

      const res = await fetch("/api/trainer/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: form.classType === "COURSE" ? form.courseId || null : null,
          batchId: form.batchId || form.selectedBatchIds[0],
          batchIds: form.selectedBatchIds,
          title: form.title.trim(),
          description: form.description?.trim() || null,
          scheduledDate: new Date(form.scheduledDate).toISOString(),
          startTime: startDateTime.toISOString(),
          lateCutoffMinutes: Number(form.lateCutoffMinutes) || 10,
          meetUrl: form.meetUrl.trim(),
          useConnectedGoogle: form.platformType === "GOOGLE_MEET",
          recordingUrl: form.recordingUrl || null,
          status: "SCHEDULED",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to schedule live class");

      showToast("success", `Live class "${form.title}" scheduled & notified to ${form.selectedBatchIds.length} batch(es)!`);
      resetModal();
      setForm({
        platformType: "MANUAL",
        classType: "COURSE",
        courseId: batches[0]?.course?.id || "",
        batchId: batches[0]?.id || "",
        selectedBatchIds: batches[0] ? [batches[0].id] : [],
        title: "",
        description: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        startHour: "05",
        startMinute: "30",
        startPeriod: "PM",
        lateCutoffMinutes: 10,
        meetUrl: "",
        recordingUrl: "",
      });
      fetchLiveClasses();
    } catch (err: any) {
      showToast("error", err.message || "Failed to schedule live class");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Live Classes
  const filteredClasses = classes.filter((lc) => {
    const matchSearch =
      lc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lc.batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lc.course?.title || lc.batch.course?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchBatch = !selectedBatchId || lc.batchId === selectedBatchId || (lc.batchIds && lc.batchIds.includes(selectedBatchId));
    const matchStatus = !selectedStatus || lc.status === selectedStatus;
    const matchDate = !selectedDate || new Date(lc.scheduledDate).toISOString().split("T")[0] === selectedDate;

    if (classTypeFilter === "COURSE" && !lc.courseId) return false;
    if (classTypeFilter === "GENERAL" && lc.courseId) return false;

    return matchSearch && matchBatch && matchStatus && matchDate;
  }).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <Video className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Live Broadcast Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                Cohorts & Courses
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Live Interactive Classes Studio
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Schedule cohort sessions, broadcast via Google Meet, and monitor real-time student attendance turnout.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          {/* Google Connect Button or Connected Pill */}
          {googleStatus?.isConnected ? (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-emerald-200 shadow-2xs text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-[11px] uppercase">
                {googleStatus.email?.[0] || "G"}
              </div>
              <div className="flex flex-col text-left">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                </span>
                <span className="text-[11px] font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                  {googleStatus.email}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Disconnect this Google Account?")) {
                    await fetch("/api/trainer/google-account", { method: "DELETE" });
                    fetchGoogleStatus();
                    showToast("success", "Google account unlinked");
                  }
                }}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline ml-1 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href={googleStatus?.authUrl || "/api/trainer/google-account"}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs transition hover:scale-[1.02] cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Connect Google</span>
            </a>
          )}

          {/* Schedule Live Class Main CTA */}
          <button
            onClick={() => {
              setStep(1);
              setIsScheduleModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Live Class
          </button>
        </div>
      </div>

      {/* 5 High-Impact KPI Metric Cards */}
      {(() => {
        // Calculate average attendance across completed sessions with enrolled students
        const completedSessionsWithStudents = classes.filter(
          (c) => (c.batch?.students?.length || 0) > 0 && (c.status === "COMPLETED" || c.status === "LIVE")
        );
        let avgAttendancePercent = 0;
        if (completedSessionsWithStudents.length > 0) {
          const totalPercentages = completedSessionsWithStudents.reduce((sum, c) => {
            const studentCount = c.batch?.students?.length || 1;
            const attendedCount = c.attendances?.filter((a) => a.status === "PRESENT" || a.status === "LATE").length || 0;
            return sum + Math.min(100, Math.round((attendedCount / studentCount) * 100));
          }, 0);
          avgAttendancePercent = Math.round(totalPercentages / completedSessionsWithStudents.length);
        }

        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#1E2B88]" /> Total Sessions
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{classes.length}</span>
                <span className="text-[11px] font-mono text-slate-400">Scheduled</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> Live Now
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600">
                  {classes.filter((c) => c.status === "LIVE").length}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Broadcasting</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7C248C]" /> Upcoming
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {classes.filter((c) => c.status === "SCHEDULED").length}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Queued</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">
                  {classes.filter((c) => c.status === "COMPLETED").length}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Archived</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#7C248C]" /> Avg Attendance %
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#7C248C]">
                  {avgAttendancePercent > 0 ? `${avgAttendancePercent}%` : "—"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Turnout</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Class Type Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setClassTypeFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
              classTypeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Classes ({classes.length})
          </button>
          <button
            onClick={() => setClassTypeFilter("COURSE")}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
              classTypeFilter === "COURSE" ? "bg-[#7C248C] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Course Classes
          </button>
          <button
            onClick={() => setClassTypeFilter("GENERAL")}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
              classTypeFilter === "GENERAL" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> General Batch Sessions
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by title, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            />
          </div>

          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
          >
            <option value="">All Accessible Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.course.title})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="LIVE">LIVE NOW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Classes Content: Skeleton Loader vs Real Grid vs Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-5 bg-slate-100 rounded-full" />
                  <div className="w-24 h-5 bg-slate-100 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="w-1/3 h-3 bg-slate-100 rounded-md" />
                  <div className="w-3/4 h-5 bg-slate-100 rounded-md" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                  <div className="flex justify-between">
                    <div className="w-12 h-3 bg-slate-200 rounded" />
                    <div className="w-20 h-3 bg-slate-200 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-16 h-3 bg-slate-200 rounded" />
                    <div className="w-16 h-3 bg-slate-200 rounded" />
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <div className="w-14 h-3 bg-slate-200 rounded" />
                    <div className="w-12 h-3 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 rounded-xl bg-slate-100" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
              </div>
              <div className="pt-2">
                <div className="w-full h-11 rounded-2xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((lc) => {
            const approvedAttCount = lc.attendances?.filter((a) => a.isApproved).length || 0;
            const pendingAttCount = lc.attendances?.filter((a) => !a.isApproved).length || 0;
            const isCourseClass = Boolean(lc.courseId || lc.course);
            const batchCount = lc.batchIds && lc.batchIds.length > 0 ? lc.batchIds.length : 1;
            const isCompleted = lc.status === "COMPLETED";

            return (
              <div
                key={lc.id}
                className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        lc.status === "LIVE"
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : isCompleted
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-purple-50 text-[#7C248C] border-purple-200"
                      }`}
                    >
                      {lc.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {batchCount > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                          {batchCount} Batches
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isCourseClass
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isCourseClass ? "Course Class" : "General Session"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1">
                      {lc.course?.title || lc.batch.course?.title || lc.batch.name}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg line-clamp-2">{lc.title}</h3>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <strong className="text-slate-900">
                        {new Date(lc.scheduledDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Time:</span>
                      <strong className="text-slate-900">
                        {new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span>Late cutoff:</span>
                      <strong className="text-amber-700">{lc.lateCutoffMinutes || 10} mins</strong>
                    </div>
                  </div>

                  {/* Attendance Check-in Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 font-bold block uppercase">Approved</span>
                      <strong className="text-emerald-900 text-sm">{approvedAttCount}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                      <span className="text-[10px] text-amber-800 font-bold block uppercase">Pending</span>
                      <strong className="text-amber-900 text-sm">{pendingAttCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/trainer/live-classes/${lc.id}`}
                    className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      isCompleted
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs"
                        : "jvm-gradient-bg jvm-gradient-hover text-white shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Review Session & Attendance
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" /> Manage & Verify Attendance
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Video className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No live classes found matching the selected filter criteria.</p>
        </div>
      )}

      {/* Stepper Schedule Live Class Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-xl w-full space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-visible animate-in fade-in zoom-in-95">
            {/* Modal Header & Step Indicator */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule Live Interactive Class</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      step === 1 ? "bg-[#7C248C] text-white" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {step > 1 ? "✓" : "1"}
                  </span>
                  <span className={`text-[11px] font-bold ${step === 1 ? "text-[#7C248C]" : "text-slate-400"}`}>
                    Platform
                  </span>
                  <span className="text-slate-300">—</span>
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      step === 2
                        ? "bg-[#7C248C] text-white"
                        : step > 2
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step > 2 ? "✓" : "2"}
                  </span>
                  <span className={`text-[11px] font-bold ${step === 2 ? "text-[#7C248C]" : "text-slate-400"}`}>
                    Scope & Batches
                  </span>
                  <span className="text-slate-300">—</span>
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      step === 3 ? "bg-[#7C248C] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    3
                  </span>
                  <span className={`text-[11px] font-bold ${step === 3 ? "text-[#7C248C]" : "text-slate-400"}`}>
                    Session Info
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Choose Meeting Platform */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">
                  Choose how you want to conduct this live session:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Google Meet Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, platformType: "GOOGLE_MEET" });
                      setStep(2);
                    }}
                    className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer hover:scale-[1.01] ${
                      form.platformType === "GOOGLE_MEET"
                        ? "border-[#7C248C] bg-purple-50/80 ring-2 ring-purple-200"
                        : "border-slate-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <GoogleIcon className="w-6 h-6" />
                      {googleStatus?.isConnected && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 text-sm">Google Meet</span>
                      <span className="text-[11px] text-slate-500 font-normal leading-tight block mt-0.5">
                        Auto-creates calendar event & Meet room directly via your connected Gmail.
                      </span>
                    </div>
                  </button>

                  {/* Custom Link Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, platformType: "MANUAL" });
                      setStep(2);
                    }}
                    className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer hover:scale-[1.01] ${
                      form.platformType === "MANUAL"
                        ? "border-[#7C248C] bg-purple-50/80 ring-2 ring-purple-200"
                        : "border-slate-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 text-sm">Custom Meeting Link</span>
                      <span className="text-[11px] text-slate-500 font-normal leading-tight block mt-0.5">
                        Paste any meeting room URL (Google Meet, Zoom, MS Teams, or web conferencing).
                      </span>
                    </div>
                  </button>
                </div>

                {/* Google Connection helper if Google Meet chosen without login */}
                {form.platformType === "GOOGLE_MEET" && !googleStatus?.isConnected && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Google Account Not Connected
                    </div>
                    <p className="text-amber-800 text-[11px]">
                      Connect your Google Account to auto-generate Meet rooms, or continue and switch to Custom Link.
                    </p>
                    {googleStatus?.authUrl && (
                      <a
                        href={googleStatus.authUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                      >
                        <GoogleIcon className="w-3.5 h-3.5" /> Connect Google Now
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Scope & Target Batches */}
            {step === 2 && (
              <div className="space-y-5 text-xs">
                {/* Class Scope Selection */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Class Scope *</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, classType: "COURSE" })}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        form.classType === "COURSE"
                          ? "border-[#7C248C] bg-purple-50 text-[#7C248C] font-bold ring-1 ring-purple-200"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mb-1 text-[#7C248C]" />
                      <span className="block text-xs font-bold text-slate-900">Course Live Class</span>
                      <span className="text-[10px] text-slate-500 font-normal">Linked to course index & player</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, classType: "GENERAL" })}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        form.classType === "GENERAL"
                          ? "border-[#7C248C] bg-purple-50 text-[#7C248C] font-bold ring-1 ring-purple-200"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Layers className="w-4 h-4 mb-1 text-indigo-600" />
                      <span className="block text-xs font-bold text-slate-900">General Batch Session</span>
                      <span className="text-[10px] text-slate-500 font-normal">Cohort webinar / doubt clearing</span>
                    </button>
                  </div>
                </div>

                {/* Target Batches: Direct Visible Card List with Nested Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      Target Cohort Batches * ({form.selectedBatchIds.length} of {batches.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (form.selectedBatchIds.length === batches.length) {
                          setForm((prev) => ({
                            ...prev,
                            selectedBatchIds: [batches[0]?.id || ""].filter(Boolean),
                          }));
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            selectedBatchIds: batches.map((b) => b.id),
                          }));
                        }
                      }}
                      className="text-[11px] text-purple-700 font-bold hover:underline cursor-pointer"
                    >
                      {form.selectedBatchIds.length === batches.length ? "Deselect All (Keep 1)" : "Select All Batches"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-56 overflow-y-auto space-y-2">
                    {batches.length > 0 ? (
                      batches.map((b) => {
                        const isChecked = form.selectedBatchIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                              isChecked
                                ? "bg-white border-[#7C248C] shadow-xs text-slate-900"
                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBatch(b.id)}
                              className="mt-0.5 rounded accent-[#7C248C] w-4 h-4 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-slate-900">{b.name}</span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                Course: {b.course.title}
                              </span>
                            </div>
                            {isChecked && (
                              <span className="text-[10px] font-bold text-[#7C248C] bg-purple-50 px-2 py-0.5 rounded-md shrink-0">
                                Assigned
                              </span>
                            )}
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">No batches available</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.selectedBatchIds.length === 0) {
                        showToast("error", "Please select at least one batch");
                        return;
                      }
                      setStep(3);
                    }}
                    className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                  >
                    Continue to Info <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Session Details & Link */}
            {step === 3 && (
              <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
                {/* Session Title */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Microservices Architecture & System Design Live Q&A"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                {/* Date & Start Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SCHEDULED DATE *</label>
                    <input
                      type="date"
                      required
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">START TIME *</label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={form.startHour}
                        onChange={(e) => setForm({ ...form, startHour: e.target.value })}
                        className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
                      >
                        {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="font-bold text-slate-400">:</span>
                      <select
                        value={form.startMinute}
                        onChange={(e) => setForm({ ...form, startMinute: e.target.value })}
                        className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
                      >
                        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, startPeriod: "AM" })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            form.startPeriod === "AM"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, startPeriod: "PM" })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            form.startPeriod === "PM"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Specific Input */}
                {form.platformType === "MANUAL" ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">Meeting Link URL (Meet / Zoom / Teams) *</label>
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                      >
                        Create Quick Meet <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
                      value={form.meetUrl}
                      onChange={(e) => setForm({ ...form, meetUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                    />
                    <p className="text-[10px] text-slate-500">
                      Students access this link securely at class time via the "Join Google Meet" button (which tracks their timestamp & late mark).
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                    {googleStatus?.isConnected ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-mono">Google Calendar Host</span>
                            <strong className="text-xs font-bold text-emerald-950">{googleStatus.email}</strong>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Auto-Generate Ready
                        </span>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
                        <span className="font-bold text-amber-800 block text-xs">⚠️ Google Account Disconnected</span>
                        <p className="text-[11px] text-slate-600">
                          Please connect your Google Account first or switch back to Step 1 to enter a Custom Meeting Link.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Late Arrival Threshold */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-900">Late Attendance Threshold</label>
                    <span className="font-mono text-xs font-bold text-amber-800">{form.lateCutoffMinutes} mins</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={45}
                    value={form.lateCutoffMinutes}
                    onChange={(e) => setForm({ ...form, lateCutoffMinutes: Number(e.target.value) })}
                    className="w-full mt-2 accent-[#7C248C]"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    Students clicking "Join" after {form.lateCutoffMinutes} minutes from scheduled start ({form.startHour}:{form.startMinute} {form.startPeriod}) are marked LATE.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Session Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please review the module assignment before joining the call."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer hover:scale-[1.01]"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Schedule & Dispatch Alerts
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
