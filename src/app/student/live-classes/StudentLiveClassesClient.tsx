"use client";

import { useState, useEffect } from "react";
import {
  Video,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

export interface StudentLiveClassItem {
  id: string;
  courseId?: string | null;
  course?: { id: string; title: string } | null;
  batch: { id: string; name: string; course?: { title: string } | null };
  trainer: { id: string; name: string; email: string };
  title: string;
  description?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  lateCutoffMinutes: number;
  recordingUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  attendances: {
    id: string;
    status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
    isApproved: boolean;
    joinClickTime?: string | null;
    excuseReason?: string | null;
  }[];
}

// Consistent date/time formatting helpers to prevent hydration mismatches
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = hours.toString().padStart(2, "0");
  return `${formattedHours}:${minutes} ${ampm}`;
}

export default function StudentLiveClassesClient({
  initialClasses,
}: {
  initialClasses: StudentLiveClassItem[];
}) {
  const [classes, setClasses] = useState<StudentLiveClassItem[]>(initialClasses);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [excuseModalClass, setExcuseModalClass] = useState<StudentLiveClassItem | null>(null);
  const [excuseReason, setExcuseReason] = useState("");
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mount flag & live timer clock
  useEffect(() => {
    setMounted(true);
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Secure Join Trigger
  const handleJoinClass = async (classItem: StudentLiveClassItem) => {
    setJoiningId(classItem.id);
    try {
      const res = await fetch(`/api/student/live-classes/${classItem.id}/join`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to join live session");
      }

      // Update local state to reflect join click
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id === classItem.id) {
            const updatedAttendances = [
              {
                id: "temp-" + Date.now(),
                status: data.status as any,
                isApproved: false,
                joinClickTime: data.joinTime,
              },
            ];
            return { ...c, attendances: updatedAttendances };
          }
          return c;
        })
      );

      if (data.isLate) {
        showToast("error", "Joined after scheduled start time (Logged as Late). Connecting to Meet...");
      } else {
        showToast("success", "Attendance check-in logged (Present)! Launching Google Meet...");
      }

      // Securely open Google Meet
      if (data.meetUrl) {
        window.open(data.meetUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to initiate session join");
    } finally {
      setJoiningId(null);
    }
  };

  // Submit Absence Excuse
  const handleExcuseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseModalClass || !excuseReason.trim()) return;

    setSubmittingExcuse(true);
    try {
      const res = await fetch(`/api/student/live-classes/${excuseModalClass.id}/excuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: excuseReason.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit excuse");
      }

      showToast("success", "Absence excuse submitted for trainer review");
      setClasses((prev) =>
        prev.map((c) =>
          c.id === excuseModalClass.id
            ? {
                ...c,
                attendances: [
                  {
                    id: data.data.id,
                    status: "EXCUSED",
                    isApproved: false,
                    excuseReason: excuseReason.trim(),
                  },
                ],
              }
            : c
        )
      );
      setExcuseModalClass(null);
      setExcuseReason("");
    } catch (err: any) {
      showToast("error", err.message || "Error submitting excuse");
    } finally {
      setSubmittingExcuse(false);
    }
  };

  // Live session status & countdown computation
  // Rule: Class is ONLY COMPLETED if status is explicitly COMPLETED or CANCELLED.
  // When currentTime reaches near startTime (or anytime thereafter while not explicitly completed), the session is LIVE NOW.
  const getSessionTimeInfo = (classItem: StudentLiveClassItem) => {
    if (classItem.status === "COMPLETED") {
      return { statusLabel: "COMPLETED", canJoin: false, countdownText: "Session Completed" };
    }
    if (classItem.status === "CANCELLED") {
      return { statusLabel: "CANCELLED", canJoin: false, countdownText: "Session Cancelled" };
    }

    const startTimeMs = new Date(classItem.startTime).getTime();
    const lateCutoffMs = startTimeMs + (classItem.lateCutoffMinutes || 10) * 60 * 1000;
    const diffToStart = startTimeMs - currentTime;

    // Room opens 10 minutes prior to scheduled start time
    const isUpcoming = diffToStart > 10 * 60 * 1000;

    if (isUpcoming) {
      const hours = Math.floor(diffToStart / (1000 * 60 * 60));
      const mins = Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffToStart % (1000 * 60)) / 1000);
      return {
        statusLabel: "UPCOMING",
        canJoin: false,
        countdownText: `${hours > 0 ? `${hours}h ` : ""}${mins}m ${secs}s until start`,
      };
    }

    // Automatically active & joinable once reached start window
    const isLateNow = currentTime > lateCutoffMs;
    return {
      statusLabel: "LIVE NOW",
      canJoin: true,
      countdownText: isLateNow ? "⚠️ Live (Late Check-in)" : "🟢 Live Room Open",
    };
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredClasses = classes.filter((lc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lc.title.toLowerCase().includes(q) ||
      (lc.course?.title || "").toLowerCase().includes(q) ||
      lc.batch.name.toLowerCase().includes(q) ||
      lc.trainer.name.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "LIVE" && (lc.status === "LIVE" || lc.status === "SCHEDULED")) ||
      lc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Compact Header (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Video className="w-3 h-3 text-[#7C248C]" /> Live Studio Sessions
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Interactive Classroom & <span className="jvm-gradient-text">Google Meet</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Join scheduled interactive studio sessions with your instructor, log attendance, and stream session recordings.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {classes.length} {classes.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>
      </div>

      {/* Stylized Search & Filter Console */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-purple-200/50 via-slate-100 to-indigo-200/50 shadow-sm">
        <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/80">
          {/* Stylized Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C] transition group-focus-within:bg-[#7C248C] group-focus-within:text-white group-focus-within:scale-105 shadow-2xs">
              <Video className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, course, batch, or faculty..."
              className="w-full pl-13 pr-10 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold flex items-center justify-center transition cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stylish Status Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              {[
                { id: "ALL", label: "All Sessions" },
                { id: "SCHEDULED", label: "Upcoming" },
                { id: "COMPLETED", label: "Completed" },
              ].map((st) => {
                const isSelected = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Match Counter Badge */}
            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#7C248C] font-mono text-[11px] font-bold shrink-0">
              {filteredClasses.length} Found
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Classes */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((lc) => {
            const timeInfo = getSessionTimeInfo(lc);
            const attendance = lc.attendances[0];
            const isCourseClass = Boolean(lc.courseId || lc.course);
            const isLive = timeInfo.statusLabel === "LIVE NOW";
            const isCompleted = timeInfo.statusLabel === "COMPLETED";

            return (
              <div
                key={lc.id}
                className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* Visual Top Ribbon Accent */}
                <div
                  className={`h-2.5 w-full ${
                    isLive
                      ? "bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 animate-pulse"
                      : isCompleted
                      ? "bg-slate-300"
                      : "jvm-gradient-bg"
                  }`}
                />

                <div className="p-6 space-y-4">
                  {/* Status & Category Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-3 py-1 rounded-full border shadow-2xs flex items-center gap-1.5 ${
                        isLive
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : isCompleted
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-purple-100 text-[#7C248C] border-purple-200/60"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isLive ? "bg-rose-600 animate-ping" : isCompleted ? "bg-slate-400" : "bg-[#7C248C]"
                        }`}
                      />
                      {isLive ? "BROADCAST LIVE" : isCompleted ? "COMPLETED" : "UPCOMING STUDIO"}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        isCourseClass
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isCourseClass ? "Course Class" : "Cohort Session"}
                    </span>
                  </div>

                  {/* Title & Context */}
                  <div>
                    <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1 truncate">
                      {lc.course?.title || lc.batch.course?.title || lc.batch.name}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#7C248C] transition line-clamp-2">
                      {lc.title}
                    </h3>
                    {lc.description && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                        {lc.description}
                      </p>
                    )}
                  </div>

                  {/* Date, Timing & Instructor Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200/70 space-y-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-[#7C248C]" />
                        {formatDate(lc.scheduledDate)}
                      </span>
                      <span className="text-[#7C248C] font-bold">
                        {formatTime(lc.startTime)} - {formatTime(lc.endTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md jvm-gradient-bg text-white font-bold text-[10px] flex items-center justify-center">
                          {lc.trainer.name.charAt(0)}
                        </div>
                        <span className="text-slate-500">Lead:</span>
                      </div>
                      <strong className="text-slate-900 font-bold">{lc.trainer.name}</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                      <span className="text-slate-400">Live Status / Timer:</span>
                      <strong
                        className={`font-bold ${
                          isLive ? "text-rose-600 animate-pulse" : "text-[#7C248C]"
                        }`}
                      >
                        {mounted ? timeInfo.countdownText : "Loading schedule..."}
                      </strong>
                    </div>
                  </div>

                  {/* Attendance Status */}
                  {attendance ? (
                    <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-purple-50/70 border border-purple-200/60 font-mono">
                      <span className="text-slate-500 text-[11px]">My Attendance:</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            attendance.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : attendance.status === "LATE"
                              ? "bg-amber-100 text-amber-800"
                              : attendance.status === "EXCUSED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {attendance.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          {attendance.isApproved ? "✓ Verified" : "⏳ Pending"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                      <span>Late cutoff: {lc.lateCutoffMinutes || 10} mins</span>
                      <span className="text-slate-500">Not attended yet</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="p-6 pt-0 space-y-2">
                  {timeInfo.canJoin ? (
                    <button
                      type="button"
                      onClick={() => handleJoinClass(lc)}
                      disabled={joiningId === lc.id}
                      className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/25 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      {joiningId === lc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Video className="w-4 h-4 fill-white animate-pulse" /> Join Google Meet & Check In
                        </>
                      )}
                    </button>
                  ) : isCompleted ? (
                    lc.recordingUrl ? (
                      <a
                        href={lc.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C248C] font-bold text-xs flex items-center justify-center gap-2 transition shadow-2xs"
                      >
                        <Video className="w-4 h-4" /> Watch Class Recording <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div className="text-center py-2.5 text-xs text-slate-500 font-mono bg-slate-50 rounded-2xl border border-slate-200/60">
                        Class Completed (Recording Pending)
                      </div>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200/80"
                    >
                      <Clock className="w-4 h-4" /> Room Opens Near Start Time
                    </button>
                  )}

                  {!attendance && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => setExcuseModalClass(lc)}
                      className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-[#7C248C] transition pt-1 cursor-pointer"
                    >
                      Cannot attend? Submit Absence Excuse
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
          <Video className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No live classes matching your current filter.</p>
        </div>
      )}

      {/* Submit Excuse Modal */}
      {excuseModalClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExcuseSubmit}
            className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Submit Absence Excuse</h3>
              <button
                type="button"
                onClick={() => setExcuseModalClass(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 text-[#7C248C]">
                <strong>Class:</strong> {excuseModalClass.title}
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Scheduled for {formatDate(excuseModalClass.startTime)} at {formatTime(excuseModalClass.startTime)}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Absence *</label>
                <textarea
                  required
                  rows={3}
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  placeholder="e.g. Health emergency / unavoidable conflict. Please approve leave."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#7C248C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExcuseModalClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingExcuse}
                className="px-5 py-2 rounded-xl jvm-gradient-bg text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {submittingExcuse && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit for Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
