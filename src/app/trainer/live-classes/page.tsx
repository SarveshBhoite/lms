"use client";

import { useState, useEffect } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  User,
} from "lucide-react";

interface LiveClassItem {
  id: string;
  batchId: string;
  trainerId: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  meetUrl: string;
  recordingUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  batch: { id: string; name: string; course: { title: string } };
  trainer: { id: string; name: string; email: string };
  attendances: { id: string }[];
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
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    batchId: "",
    title: "",
    description: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
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

  useEffect(() => {
    fetchLiveClasses();
    fetch("/api/trainer/batches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBatches(data.data);
          if (data.data.length > 0) {
            setForm((prev) => ({ ...prev, batchId: data.data[0].id }));
          }
        }
      });
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId || !form.title || !form.scheduledDate || !form.startTime || !form.endTime || !form.meetUrl) {
      showToast("error", "Please fill in all required live class fields");
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
          batchId: form.batchId,
          title: form.title,
          description: form.description || null,
          scheduledDate: new Date(form.scheduledDate).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          meetUrl: form.meetUrl,
          recordingUrl: form.recordingUrl || null,
          status: "SCHEDULED",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to schedule live class");

      showToast("success", `Live class "${form.title}" scheduled & students notified!`);
      setIsScheduleModalOpen(false);
      setForm({
        batchId: batches[0]?.id || "",
        title: "",
        description: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        endTime: "11:30",
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
      lc.batch.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBatch = !selectedBatchId || lc.batchId === selectedBatchId;
    const matchStatus = !selectedStatus || lc.status === selectedStatus;
    const matchDate =
      !selectedDate ||
      new Date(lc.scheduledDate).toISOString().split("T")[0] === selectedDate;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Video className="w-7 h-7 text-[#1E2B88]" /> Live Interactive Classes Studio
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Schedule Google Meet live interactive classes for assigned cohorts, stream recordings, and track attendance.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Schedule Live Class
        </button>
      </div>

      {/* Filters & View Switcher Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by title, batch, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 shadow-xs"
            />
          </div>

          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
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
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">SCHEDULED / UPCOMING</option>
            <option value="LIVE">LIVE NOW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
          />
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-end md:self-auto shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "calendar"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {/* Content Rendering: LIST VIEW */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Fetching live interactive classes...
        </div>
      ) : viewMode === "list" ? (
        filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((lc) => (
              <div
                key={lc.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        lc.status === "LIVE"
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : lc.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : lc.status === "CANCELLED"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {lc.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(lc.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{lc.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Batch: <span className="text-cyan-700 font-bold">{lc.batch.name}</span> ({lc.batch.course.title})
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700 font-mono">
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <strong className="text-slate-900">
                        {new Date(lc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(lc.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <strong className="text-cyan-700">{lc.trainer.name}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <a
                    href={lc.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Video className="w-4 h-4" /> Join Google Meet <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <Link
                    href={`/trainer/live-classes/${lc.id}`}
                    className="block text-center w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Class Studio & Attendance <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
            <Video className="w-10 h-10 mx-auto text-slate-400" />
            <p className="text-sm">No live classes matching criteria found.</p>
          </div>
        )
      ) : (
        /* CALENDAR VIEW */
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-600" /> Schedule Calendar Stream
          </h2>

          <div className="space-y-4">
            {filteredClasses.map((lc) => (
              <div
                key={lc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex flex-col items-center justify-center font-mono shrink-0">
                    <span className="text-[10px] uppercase font-extrabold">{new Date(lc.scheduledDate).toLocaleString('default', { month: 'short' })}</span>
                    <strong className="text-base font-black">{new Date(lc.scheduledDate).getDate()}</strong>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{lc.title}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Batch: {lc.batch.name} • {new Date(lc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(lc.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      lc.status === "LIVE"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {lc.status}
                  </span>
                  <Link
                    href={`/trainer/live-classes/${lc.id}`}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    View Studio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Live Class Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScheduleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Schedule Live Class (Google Meet)</h3>
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Batch *</label>
                <select
                  required
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.course.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Architecture & Async Design Q&A"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google Meet Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={form.meetUrl}
                  onChange={(e) => setForm({ ...form, meetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recording URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={form.recordingUrl}
                  onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Schedule & Notify Students
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
