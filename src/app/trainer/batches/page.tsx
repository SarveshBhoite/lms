"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Calendar,
  Users,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  course: { id: string; title: string };
  students: Array<{ id: string }>;
  liveClasses: Array<{ id: string }>;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [batchName, setBatchName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [status, setStatus] = useState("ONGOING");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );

  const fetchData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [batchRes, courseRes] = await Promise.all([
        fetch("/api/trainer/batches"),
        fetch("/api/trainer/courses"),
      ]);

      const batchData = await batchRes.json();
      if (batchData.success && batchData.batches) {
        setBatches(batchData.batches);
      } else if (!batchData.success && retryCount < 1) {
        // Auto-retry once in case of cold-start wake-up
        setTimeout(() => fetchData(retryCount + 1), 1500);
        return;
      }

      const courseData = await courseRes.json();
      if (courseData.success && courseData.courses) {
        setCourses(courseData.courses);
        if (courseData.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseData.courses[0].id);
        }
      }
    } catch (err: unknown) {
      if (retryCount < 1) {
        setTimeout(() => fetchData(retryCount + 1), 2000);
      } else {
        setErrorMsg("Database connection waking up. Please click refresh if needed.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/trainer/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: batchName,
          courseId: selectedCourseId,
          startDate,
          endDate,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize batch");
      }

      setModalOpen(false);
      setBatchName("");
      setSuccessMsg(`Batch "${batchName}" created & activated directly! No admin approval required.`);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred while creating the batch.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"?`)) return;

    try {
      const res = await fetch(`/api/trainer/batches?batchId=${batchId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Batch "${name}" deleted successfully.`);
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.error || "Failed to delete batch");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to delete batch.");
      }
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" /> Batch Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Batches
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Directly create and manage your student batches. All batches are immediately active without waiting for admin approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(0)}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh Batches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Batch
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchData(0)}
            className="text-xs underline font-bold hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
          Loading batches...
        </div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Batches Created Yet</h3>
          <p className="text-xs text-slate-400">Click &quot;Create New Batch&quot; above to create your first cohort directly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((batch) => {
            const studentCount = batch.students?.length || 0;
            const standardCap = 30;
            const capPercent = Math.min(100, Math.round((studentCount / standardCap) * 100));

            return (
              <div
                key={batch.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 hover:border-amber-500/40 transition shadow-xl flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> {batch.status}
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono">Self-Managed</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(batch.startDate).toLocaleDateString()} –{" "}
                        {new Date(batch.endDate).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteBatch(batch.id, batch.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{batch.name}</h3>
                    <p className="text-xs text-amber-400 font-medium mt-0.5">{batch.course?.title}</p>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Batch Capacity</span>
                      <span className="text-white font-bold">
                        {studentCount} / {standardCap} Students ({capPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${capPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" /> {studentCount} Enrolled Students
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" /> {batch.liveClasses?.length || 0} Live Classes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Batch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" /> Create New Batch
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>This batch will be created directly and activated immediately without needing any admin approval.</span>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Batch Name
                </label>
                <input
                  type="text"
                  required
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Next.js Masterclass Batch 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Course Track
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Batch Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="ONGOING">ONGOING (Active Immediately)</option>
                  <option value="UPCOMING">UPCOMING (Scheduled)</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
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
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Activate Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
