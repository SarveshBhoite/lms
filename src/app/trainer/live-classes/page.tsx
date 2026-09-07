"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Video,
  Plus,
  Search,
  Calendar as CalendarIcon,
  List,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  User,
  Sparkles,
  Link2,
  Layers,
  BookOpen,
  CheckSquare,
  Check,
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
  batch: { id: string; name: string; course: { title: string } };
  trainer: { id: string; name: string; email: string };
  attendances: { id: string; userId: string; status: string; isApproved: boolean }[];
}

interface BatchOption {
  id: string;
  name: string;
  course: { id: string; title: string };
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

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    classType: "COURSE" as "COURSE" | "GENERAL",
    platformType: "MANUAL" as "MANUAL" | "GOOGLE_MEET",
    courseId: "",
    batchId: "",
    selectedBatchIds: [] as string[],
    title: "",
    description: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
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
    fetch("/api/trainer/batches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBatches(data.data);
          if (data.data.length > 0) {
            setForm((prev) => ({
              ...prev,
              batchId: data.data[0].id,
              courseId: data.data[0].course.id,
              selectedBatchIds: [data.data[0].id],
            }));
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
        if (prev.selectedBatchIds.length === 1) return prev; // keep at least 1
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

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.selectedBatchIds.length === 0 || !form.title || !form.scheduledDate || !form.startTime || !form.endTime) {
      showToast("error", "Please fill in all required fields and select at least one batch");
      return;
    }

    if (form.platformType === "MANUAL" && !form.meetUrl.trim()) {
      showToast("error", "Please enter your meeting link (Meet / Zoom / Teams URL)");
      return;
    }

    if (form.platformType === "GOOGLE_MEET" && !googleStatus?.isConnected) {
      showToast("error", "Please connect your Google Account first or switch to Custom Link.");
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(`${form.scheduledDate}T${form.startTime}:00`);
      const endDateTime = new Date(`${form.scheduledDate}T${form.endTime}:00`);

      const res = await fetch("/api/trainer/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: form.classType === "COURSE" ? form.courseId || null : null,
          batchId: form.batchId || form.selectedBatchIds[0],
          batchIds: form.selectedBatchIds,
          title: form.title,
          description: form.description || null,
          scheduledDate: new Date(form.scheduledDate).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          lateCutoffMinutes: Number(form.lateCutoffMinutes) || 10,
          meetUrl: form.meetUrl.trim(),
          useConnectedGoogle: form.platformType === "GOOGLE_MEET",
          recordingUrl: form.recordingUrl || null,
          status: "SCHEDULED",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to schedule live class");

      showToast("success", `Live class "${form.title}" scheduled & alerts sent!`);
      setIsScheduleModalOpen(false);
      setForm({
        classType: "COURSE",
        platformType: "MANUAL",
        courseId: batches[0]?.course?.id || "",
        batchId: batches[0]?.id || "",
        selectedBatchIds: batches[0] ? [batches[0].id] : [],
        title: "",
        description: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        endTime: "11:30",
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
  });

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

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Video className="w-7 h-7 text-[#1E2B88]" /> Live Interactive Classes Studio
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Schedule live interactive sessions for cohorts, manage Google Meet / Custom links, and verify student attendance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-black text-xs shadow-lg shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Live Class
          </button>
        </div>
      </div>

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

      {/* Grid of Classes */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((lc) => {
            const approvedAttCount = lc.attendances?.filter((a) => a.isApproved).length || 0;
            const pendingAttCount = lc.attendances?.filter((a) => !a.isApproved).length || 0;
            const isCourseClass = Boolean(lc.courseId || lc.course);
            const batchCount = lc.batchIds && lc.batchIds.length > 0 ? lc.batchIds.length : 1;

            return (
              <div
                key={lc.id}
                className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        lc.status === "LIVE"
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : lc.status === "COMPLETED"
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
                      <span>Time:</span>
                      <strong className="text-slate-900">
                        {new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(lc.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Manage & Verify Attendance
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

      {/* Schedule Live Class Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleScheduleSubmit}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-2xl w-full space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule Live Interactive Class</h3>
                <p className="text-[11px] text-slate-500">Create meeting, select target batch cohorts, and set live timers.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option: Platform Type Selection (Custom vs Google Meet) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Meeting Platform *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, platformType: "MANUAL" })}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      form.platformType === "MANUAL"
                        ? "border-[#7C248C] bg-purple-50/70 text-[#7C248C] font-bold ring-2 ring-purple-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Link2 className="w-4 h-4 mb-1 text-slate-700" />
                    <span className="block text-xs font-bold text-slate-900">Custom Meeting Link</span>
                    <span className="text-[10px] text-slate-500 font-normal">Paste Meet, Zoom, MS Teams or web URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, platformType: "GOOGLE_MEET" })}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      form.platformType === "GOOGLE_MEET"
                        ? "border-[#7C248C] bg-purple-50/70 text-[#7C248C] font-bold ring-2 ring-purple-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1 text-purple-600" />
                    <span className="block text-xs font-bold text-slate-900">Google Meet (Auto-Schedule)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Auto-creates Google Calendar & Meet link</span>
                  </button>
                </div>
              </div>

              {/* Class Scope Selection */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Class Scope *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, classType: "COURSE" })}
                    className={`p-3 rounded-xl border text-left transition ${
                      form.classType === "COURSE"
                        ? "border-[#7C248C] bg-purple-50 text-[#7C248C] font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 mb-0.5 text-[#7C248C]" />
                    <span className="block text-xs font-bold text-slate-900">Course Live Class</span>
                    <span className="text-[10px] text-slate-500 font-normal">Linked to course index & player</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, classType: "GENERAL" })}
                    className={`p-3 rounded-xl border text-left transition ${
                      form.classType === "GENERAL"
                        ? "border-[#7C248C] bg-purple-50 text-[#7C248C] font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mb-0.5 text-indigo-600" />
                    <span className="block text-xs font-bold text-slate-900">General Batch Session</span>
                    <span className="text-[10px] text-slate-500 font-normal">Cohort webinar / doubt clearance</span>
                  </button>
                </div>
              </div>

              {/* Target Batches: Dropdown with Nested Checkboxes */}
              <div ref={batchDropdownRef} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Target Batches *</label>
                  <span className="text-[11px] font-bold text-purple-700">
                    {form.selectedBatchIds.length} batch(es) selected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs flex items-center justify-between hover:border-slate-300 transition text-left"
                >
                  <span className="truncate">
                    {form.selectedBatchIds.length === 0
                      ? "Select target batches..."
                      : form.selectedBatchIds.length === batches.length
                      ? `All Batches Selected (${batches.length})`
                      : batches
                          .filter((b) => form.selectedBatchIds.includes(b.id))
                          .map((b) => b.name)
                          .join(", ")}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isBatchDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isBatchDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 space-y-1.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 mb-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Select Batches</span>
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
                        className="text-[10px] text-purple-700 font-bold hover:underline"
                      >
                        {form.selectedBatchIds.length === batches.length ? "Deselect All (Keep 1)" : "Select All"}
                      </button>
                    </div>

                    {batches.map((b) => {
                      const isChecked = form.selectedBatchIds.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition ${
                            isChecked ? "bg-purple-50 text-slate-900" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBatch(b.id)}
                            className="rounded accent-[#7C248C] w-4 h-4"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-bold truncate">{b.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{b.course.title}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

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

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">DATE *</label>
                  <input
                    type="date"
                    required
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">START TIME *</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">END TIME *</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Platform Specific Inputs */}
              {form.platformType === "MANUAL" ? (
                /* Custom Link Input */
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Meeting Link URL (Meet / Zoom / Teams) *</label>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                    >
                      Quick Meet <ExternalLink className="w-3 h-3" />
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
                    Students will not see the raw URL beforehand. The timer "Join Class" button will log their attendance and direct them at class time.
                  </p>
                </div>
              ) : (
                /* Google Meet Auto-Schedule Details */
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2.5">
                  {googleStatus?.isConnected ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono">Connected Gmail Account</span>
                          <strong className="text-xs font-bold text-emerald-950">{googleStatus.email}</strong>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Calendar Ready
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Google Account Not Connected
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Connect your Gmail account once to enable automated Google Calendar event & Meet URL scheduling.
                      </p>
                      {googleStatus?.authUrl ? (
                        <a
                          href={googleStatus.authUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Connect Google Account Now
                        </a>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          To use auto-creation, set Google OAuth credentials or switch to <strong>"Custom Meeting Link"</strong>.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Late Arrival Cutoff Setting */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-900">Late Attendance Threshold</label>
                  <span className="font-mono text-xs font-bold text-amber-800">{form.lateCutoffMinutes} minutes</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Students clicking "Join" after {form.lateCutoffMinutes} minutes from scheduled start will be recorded as "LATE".
                </p>
                <input
                  type="range"
                  min={1}
                  max={45}
                  value={form.lateCutoffMinutes}
                  onChange={(e) => setForm({ ...form, lateCutoffMinutes: Number(e.target.value) })}
                  className="w-full mt-2 accent-[#7C248C]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Session Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please review the module code repository before joining."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
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
        </div>
      )}
    </div>
  );
}
