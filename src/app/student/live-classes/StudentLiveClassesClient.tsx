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

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Video className="w-7 h-7 text-[#1E2B88]" /> Live Interactive Classes & Google Meet
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Join scheduled live interactive sessions with your instructor, track attendance, and stream recorded sessions.
          </p>
        </div>
      </div>

      {/* Grid of Classes */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((lc) => {
            const timeInfo = getSessionTimeInfo(lc);
            const attendance = lc.attendances[0];
            const isCourseClass = Boolean(lc.courseId || lc.course);

            return (
              <div
                key={lc.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        timeInfo.statusLabel === "LIVE NOW"
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : timeInfo.statusLabel === "COMPLETED"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-purple-50 text-[#7C248C] border-purple-200"
                      }`}
                    >
                      {timeInfo.statusLabel === "LIVE NOW" && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
                      {timeInfo.statusLabel}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isCourseClass
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isCourseClass ? "Course Class" : "Batch Workshop"}
                    </span>
                  </div>

                  {/* Title & Context */}
                  <div>
                    <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1">
                      {lc.course?.title || lc.batch.course?.title || lc.batch.name}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg line-clamp-2">{lc.title}</h3>
                    {lc.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lc.description}</p>}
                  </div>

                  {/* Date & Time with Countdown */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        {formatDate(lc.scheduledDate)}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">
                        {formatTime(lc.startTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono text-[11px]">
                      <span className="text-slate-400">Status / Timer:</span>
                      <strong
                        className={`font-bold ${
                          timeInfo.statusLabel === "LIVE NOW" ? "text-emerald-700" : "text-[#7C248C]"
                        }`}
                      >
                        {mounted ? timeInfo.countdownText : "Loading schedule..."}
                      </strong>
                    </div>
                  </div>

                  {/* Attendance Verification Status */}
                  <div className="pt-1">
                    {attendance ? (
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl border bg-slate-50">
                        <span className="font-mono text-slate-500">My Attendance:</span>
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
                          <span className="text-[10px] text-slate-400 font-mono">
                            {attendance.isApproved ? "✓ Verified" : "⏳ Pending Approval"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Instructor: {lc.trainer.name}</span>
                        <span>Late cutoff: {lc.lateCutoffMinutes || 10}m</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-2">
                  {/* Join Button */}
                  {timeInfo.canJoin ? (
                    <button
                      type="button"
                      onClick={() => handleJoinClass(lc)}
                      disabled={joiningId === lc.id}
                      className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      {joiningId === lc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Video className="w-4 h-4" /> Join Google Meet & Check In
                        </>
                      )}
                    </button>
                  ) : timeInfo.statusLabel === "COMPLETED" ? (
                    lc.recordingUrl ? (
                      <a
                        href={lc.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-indigo-100"
                      >
                        <Video className="w-3.5 h-3.5" /> Watch Session Recording <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-400 font-mono bg-slate-50 rounded-xl">
                        Class Completed (Recording Pending)
                      </div>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
                    >
                      <Clock className="w-3.5 h-3.5" /> Room Opens Near Start Time
                    </button>
                  )}

                  {/* Submit Excuse Action if not attended */}
                  {!attendance && timeInfo.statusLabel !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => setExcuseModalClass(lc)}
                      className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-purple-700 transition pt-1"
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
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Video className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No live classes scheduled for your enrolled batches currently.</p>
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
