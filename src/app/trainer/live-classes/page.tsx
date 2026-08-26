"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  Users,
} from "lucide-react";

interface LiveClassItem {
  id: string;
  title: string;
  description: string;
  meetUrl?: string;
  meetingUrl?: string;
  recordingUrl: string | null;
  scheduledDate: string;
  batch: { id: string; name: string };
  attendances: Array<{ id: string; status: string }>;
}

interface BatchOption {
  id: string;
  name: string;
}

export default function TrainerLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("https://meet.google.com/xyz-tech-lms");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, batchRes] = await Promise.all([
        fetch("/api/trainer/live-classes"),
        fetch("/api/admin/batches"),
      ]);

      const classData = await classRes.json();
      if (classData.success && classData.liveClasses) {
        setClasses(classData.liveClasses);
      }

      const batchData = await batchRes.json();
      if (batchData.success && batchData.batches) {
        setBatches(batchData.batches);
        if (batchData.batches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(batchData.batches[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/trainer/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          batchId: selectedBatchId,
          meetUrl: meetingUrl.trim(),
          meetingUrl: meetingUrl.trim(),
          recordingUrl: recordingUrl.trim() || undefined,
          scheduledDate: new Date(scheduledDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule live workshop");
      }

      setModalOpen(false);
      setTitle("");
      setDescription("");
      setSuccessMsg(`Live mentoring session "${title}" scheduled and saved to database!`);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred while scheduling the class.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string, classTitle: string) => {
    if (!confirm(`Are you sure you want to delete session "${classTitle}"?`)) return;

    try {
      const res = await fetch(`/api/trainer/live-classes?classId=${classId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Live class session "${classTitle}" deleted successfully.`);
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.error || "Failed to delete session");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to delete session.");
      }
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Video className="w-3.5 h-3.5" /> Interactive Video Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Live Classes & Mentoring</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Schedule live workshops, connect via Google Meet or Zoom, and archive recordings for cohort review.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Schedule Live Session
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
          Loading scheduled workshops...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => {
            const url = cls.meetUrl || cls.meetingUrl || "https://meet.google.com";

            return (
              <div
                key={cls.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4 hover:border-cyan-500/40 transition shadow-xl flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/20">
                      Cohort: {cls.batch?.name || "Alpha Cohort"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {new Date(cls.scheduledDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white">{cls.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{cls.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                  >
                    <Video className="w-4 h-4" /> Join Live Classroom <ExternalLink className="w-3 h-3" />
                  </a>

                  {cls.recordingUrl && (
                    <a
                      href={cls.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold text-center transition"
                    >
                      View Recording
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Live Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" /> Schedule Live Classroom
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleScheduleClass} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Real-Time RBAC Implementation Q&A"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Cohort / Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Description & Agenda
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Live coding demonstration, architectural walkthrough, and open student questions..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Session Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Google Meet / Zoom URL
                </label>
                <input
                  type="url"
                  required
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Recording URL (Optional)
                </label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://drive.google.com/... (optional)"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Live Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
