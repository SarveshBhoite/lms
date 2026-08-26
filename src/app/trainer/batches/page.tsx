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
  TrendingUp,
  UserCheck,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

interface BatchItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  course: { id: string; title: string };
  students: StudentInfo[];
  liveClasses: Array<{ id: string; title: string; scheduledDate: string }>;
  attendanceRate: number;
  averageProgress: number;
  averagePerformance: number;
}

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const fetchData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/trainer/batches");
      const data = await res.json();
      if (data.success && data.batches) {
        setBatches(data.batches);
      } else if (!data.success && retryCount < 1) {
        setTimeout(() => fetchData(retryCount + 1), 1500);
        return;
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

  const toggleExpand = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" /> Cohort Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Assigned Batches & Cohorts
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Track batch status, active duration, student participation, attendance rates, curriculum progress, and performance scores.
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
          Loading assigned batches...
        </div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Batches Assigned Yet</h3>
          <p className="text-xs text-slate-400">
            Assigned student batches and cohort tracks will appear here once allocated by Administration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {batches.map((batch) => {
            const studentCount = batch.students?.length || 0;
            const isExpanded = expandedBatchId === batch.id;

            return (
              <div
                key={batch.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 hover:border-amber-500/40 transition shadow-2xl flex flex-col justify-between relative group"
              >
                <div className="space-y-4">
                  {/* Top Row: Status, Dates */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold font-mono px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          batch.status === "ONGOING"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : batch.status === "UPCOMING"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" /> {batch.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {new Date(batch.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span>–</span>
                      <span>
                        {new Date(batch.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Batch Name & Course */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
                      {batch.name}
                    </h3>
                    <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{batch.course?.title || "Curriculum Track"}</span>
                    </div>
                  </div>

                  {/* Core Metrics: Students, Attendance, Progress, Performance */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {/* Students */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-indigo-400" /> Students
                      </div>
                      <div className="text-base font-extrabold text-indigo-300 font-mono">
                        {studentCount}
                      </div>
                    </div>

                    {/* Attendance */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" /> Attendance
                      </div>
                      <div className="text-base font-extrabold text-emerald-300 font-mono">
                        {batch.attendanceRate}%
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3 text-cyan-400" /> Progress
                      </div>
                      <div className="text-base font-extrabold text-cyan-300 font-mono">
                        {batch.averageProgress}%
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
                        <Award className="w-3 h-3 text-purple-400" /> Performance
                      </div>
                      <div className="text-base font-extrabold text-purple-300 font-mono">
                        {batch.averagePerformance}%
                      </div>
                    </div>
                  </div>

                  {/* Progress & Performance Progress Bars */}
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Average Curriculum Completion</span>
                        <span className="font-bold text-cyan-400">{batch.averageProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${batch.averageProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Cohort Academic Performance Score</span>
                        <span className="font-bold text-purple-400">{batch.averagePerformance}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${batch.averagePerformance}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Enrolled Students Sub-roster */}
                  {studentCount > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExpand(batch.id)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          View Student Roster ({studentCount})
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                          {batch.students.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-900"
                            >
                              <span className="font-bold text-white">{st.name}</span>
                              <span className="font-mono text-[11px] text-slate-400">{st.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Calendar className="w-4 h-4" /> {batch.liveClasses?.length || 0} Scheduled Live Classes
                  </span>

                  <Link
                    href={`/trainer/students`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold transition"
                  >
                    Manage Learners
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

