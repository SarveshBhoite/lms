"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Video,
  ExternalLink,
  Users,
  CheckSquare,
  Clock,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Calendar,
  Save,
  Upload,
  Sparkles,
  Layers,
  Radio,
  FileVideo,
  ShieldCheck,
  Check,
  AlertCircle,
  Award,
} from "lucide-react";

interface StudentMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile?: { phone?: string | null; avatarUrl?: string | null } | null;
  };
}

interface AttendanceRecord {
  id: string;
  liveClassId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  isApproved: boolean;
  joinClickTime?: string | null;
  excuseReason?: string | null;
  excuseDocumentUrl?: string | null;
  user: { id: string; name: string; email: string };
}

interface LiveClassDetailData {
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
    courseId: string;
    course: { id: string; title: string };
    students: StudentMember[];
  };
  trainer: { id: string; name: string; email: string };
  attendances: AttendanceRecord[];
}

export default function LiveClassDetailClient({
  initialClass,
  currentUserId,
}: {
  initialClass: LiveClassDetailData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [liveClass, setLiveClass] = useState<LiveClassDetailData>(initialClass);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "attendance" | "recording">("overview");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: initialClass.title,
    scheduledDate: new Date(initialClass.scheduledDate).toISOString().split("T")[0],
    startTime: new Date(initialClass.startTime).toTimeString().substring(0, 5),
    endTime: new Date(initialClass.endTime).toTimeString().substring(0, 5),
    meetUrl: initialClass.meetUrl,
    recordingUrl: initialClass.recordingUrl || "",
    description: initialClass.description || "",
    status: initialClass.status,
  });

  // Attendance Marking State
  const [attendanceState, setAttendanceState] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">>(() => {
    const stateObj: Record<string, any> = {};
    initialClass.attendances.forEach((att) => {
      stateObj[att.userId] = att.status;
    });
    return stateObj;
  });

  // Recording State
  const [recordingUrlInput, setRecordingUrlInput] = useState(initialClass.recordingUrl || "");
  const [uploadingRecording, setUploadingRecording] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshClass = async () => {
    try {
      const res = await fetch(`/api/trainer/live-classes/${liveClass.id}`);
      const data = await res.json();
      if (data.success) {
        setLiveClass(data.data);
      }
    } catch (err) {
      console.error("Failed to refresh live class:", err);
    }
  };

  // Edit Class Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const startDateTime = new Date(`${editForm.scheduledDate}T${editForm.startTime}:00`);
      const endDateTime = new Date(`${editForm.scheduledDate}T${editForm.endTime}:00`);

      const res = await fetch(`/api/trainer/live-classes/${liveClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          scheduledDate: new Date(editForm.scheduledDate).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          meetUrl: editForm.meetUrl,
          recordingUrl: editForm.recordingUrl || null,
          description: editForm.description || null,
          status: editForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update live class");

      showToast("success", "Live class details updated & students notified!");
      setIsEditModalOpen(false);
      refreshClass();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update class");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Class Status
  const handleStatusChange = async (newStatus: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/live-classes/${liveClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update status");

      showToast("success", `Class status changed to ${newStatus}`);
      refreshClass();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to change status");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    setActionLoading(true);
    try {
      const records = Object.entries(attendanceState).map(([userId, status]) => ({
        userId,
        status,
      }));

      const res = await fetch("/api/trainer/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveClassId: liveClass.id, records }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save attendance");

      showToast("success", "Attendance records saved successfully!");
      refreshClass();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save attendance");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Recording URL
  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/live-classes/${liveClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingUrl: recordingUrlInput }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save recording link");

      showToast("success", "Recording link published & students notified!");
      refreshClass();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save recording link");
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Metrics Calculation
  const totalEnrolled = liveClass.batch.students.length;
  const verifiedAttendanceCount = liveClass.attendances.filter((a) => a.isApproved).length;
  const presentCount = liveClass.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const pendingReviewCount = liveClass.attendances.filter((a) => !a.isApproved).length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

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

      {/* Navigation Top */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/live-classes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Live Classes Studio
        </Link>
      </div>

      {/* Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <Video className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Live Interactive Cockpit
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  liveClass.status === "LIVE"
                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    : liveClass.status === "COMPLETED"
                    ? "bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-purple-50 text-[#7C248C] border-purple-200"
                }`}
              >
                {liveClass.status}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
                Batch: {liveClass.batch.name}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{liveClass.title}</h1>
            <p className="text-slate-500 text-xs font-mono flex items-center gap-2 flex-wrap">
              <span>Course: <strong className="text-slate-800">{liveClass.batch.course.title}</strong></span>
              <span>•</span>
              <span>Date: {new Date(liveClass.scheduledDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
              <span>•</span>
              <span>Time: {new Date(liveClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(liveClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap relative z-10 shrink-0 self-end md:self-auto">
          {liveClass.status === "COMPLETED" ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Session Completed</span>
            </div>
          ) : (
            <>
              <a
                href={liveClass.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Video className="w-4 h-4" /> Launch Meet <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-[#7C248C] font-bold text-xs transition shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Edit2 className="w-4 h-4 inline mr-1" /> Edit / Reschedule
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1E2B88]" /> Cohort Enrolled
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1E2B88]">{totalEnrolled}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-600" /> Attended / Present
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{presentCount}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" /> Attendance %
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{attendanceRate}%</span>
            <span className="text-[11px] font-mono text-slate-400">Turnout</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Absent / Unlogged
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{Math.max(0, totalEnrolled - presentCount)}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Verified / Approved
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{verifiedAttendanceCount}</span>
            <span className="text-[11px] font-mono text-slate-400">Approved</span>
          </div>
        </div>
      </div>

      {/* 4 Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-[#1E2B88] text-[#1E2B88] bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#1E2B88]" /> Overview & Status
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "students"
              ? "border-cyan-600 text-cyan-800 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-600" /> Batch Students ({liveClass.batch.students.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "attendance"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" /> Attendance Roster ({liveClass.attendances.length} marked)
        </button>

        <button
          onClick={() => setActiveTab("recording")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "recording"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4 text-[#7C248C]" /> Recording Archive {liveClass.recordingUrl ? "✓" : ""}
        </button>
      </div>

      {/* ---------------- SECTION 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1E2B88]" /> Session Schedule & Real-Time Status Controls
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor runtime session parameters, manage completion workflows, and review automated audit timestamps.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-purple-50 text-[#7C248C] border border-purple-200">
                  Late Window: {liveClass.lateCutoffMinutes || 10} Mins
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
                  <Clock className="w-4 h-4 text-[#1E2B88]" /> Timing & Logistics
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Scheduled Date:</span>
                    <strong className="text-slate-900 font-bold">
                      {new Date(liveClass.scheduledDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Start Time:</span>
                    <strong className="text-slate-900 font-bold">
                      {new Date(liveClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">End Time:</span>
                    <strong className="text-slate-900 font-bold">
                      {new Date(liveClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500">Session Room State:</span>
                    <strong className={`font-bold ${liveClass.status === "LIVE" ? "text-rose-600" : liveClass.status === "COMPLETED" ? "text-slate-600" : "text-emerald-600"}`}>
                      {liveClass.status === "LIVE" ? "Active Live Stream" : liveClass.status === "COMPLETED" ? "Closed / Archived" : "Room Prepped (Scheduled)"}
                    </strong>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1 uppercase font-mono">Session Topic / Description</span>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs leading-relaxed">
                    {liveClass.description || "No session description provided for this live class."}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Lifecycle Status Transitions
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    The live room link is automatically active for enrolled cohort students. When you have finished broadcasting, mark the class as <strong>COMPLETED</strong> to freeze join timestamps and unlock verified attendance approval.
                  </p>

                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {liveClass.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleStatusChange("COMPLETED")}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Mark Session as COMPLETED
                      </button>
                    )}
                    {liveClass.status !== "CANCELLED" && liveClass.status !== "COMPLETED" && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this live session?")) {
                            handleStatusChange("CANCELLED");
                          }
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        Cancel Session
                      </button>
                    )}
                    {liveClass.status === "COMPLETED" && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1 w-full">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Session Successfully Concluded
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Attendance timestamps are locked. You can now verify, override, and approve all student attendance records in the <strong>Attendance Roster</strong> tab.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-[#7C248C] text-[11px] font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#7C248C]" />
                  <span>Google Meet ID & Calendar event stay synchronized with batch cohorts.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" /> Batch Cohort Students ({liveClass.batch.students.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students authorized to attend this live session from cohort batch <strong>{liveClass.batch.name}</strong>.
              </p>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
              {liveClass.batch.course.title}
            </span>
          </div>

          {liveClass.batch.students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveClass.batch.students.map((bs) => (
                <div
                  key={bs.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-purple-200 transition duration-150 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E2B88]/10 to-[#7C248C]/20 border border-purple-100 flex items-center justify-center font-black text-[#7C248C] text-sm shrink-0">
                      {bs.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{bs.user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{bs.user.email}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold shrink-0">
                    Enrolled
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-400" />
              <p>No active students enrolled in this batch cohort.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 3: ATTENDANCE ---------------- */}
      {activeTab === "attendance" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" /> Attendance Roster & Check-In Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students who click "Join Google Meet" are timestamped automatically. Review join clicks, evaluate excuses, and approve records.
              </p>
            </div>

            {liveClass.status === "COMPLETED" ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/trainer/live-classes/${liveClass.id}/attendance`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "APPROVE_ALL" }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) throw new Error(data.error || "Failed to approve all");
                      showToast("success", "All student check-in records have been verified & approved!");
                      refreshClass();
                      router.refresh();
                    } catch (e: any) {
                      showToast("error", e.message || "Failed to approve records");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  ✓ Approve All Check-Ins
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> Save Overrides
                </button>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Approval controls unlock when class is marked <strong>COMPLETED</strong> in Overview.</span>
              </div>
            )}
          </div>

          {liveClass.batch.students.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold font-mono">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Join Click Time</th>
                    <th className="p-4">Computed Status</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Actions / Excuse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {liveClass.batch.students.map((bs) => {
                    const existingAtt = liveClass.attendances.find((a) => a.userId === bs.userId);
                    const currentStatus = attendanceState[bs.userId] || existingAtt?.status || "ABSENT";
                    const isApproved = existingAtt?.isApproved || false;

                    return (
                      <tr key={bs.id} className="hover:bg-purple-50/20 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{bs.user.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{bs.user.email}</div>
                        </td>

                        <td className="p-4 font-mono text-xs">
                          {existingAtt?.joinClickTime ? (
                            <span className="text-slate-800 font-bold">
                              {new Date(existingAtt.joinClickTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not joined yet</span>
                          )}
                        </td>

                        <td className="p-4">
                          {liveClass.status === "COMPLETED" ? (
                            <div className="flex items-center gap-1.5">
                              {(["PRESENT", "LATE", "EXCUSED", "ABSENT"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setAttendanceState((prev) => ({
                                      ...prev,
                                      [bs.userId]: st,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                                    currentStatus === st
                                      ? st === "PRESENT"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : st === "LATE"
                                        ? "bg-amber-500 text-white shadow-xs"
                                        : st === "EXCUSED"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-rose-600 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] inline-block ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : currentStatus === "LATE"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : currentStatus === "EXCUSED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {currentStatus}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {isApproved ? (
                            <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {existingAtt?.excuseReason ? (
                            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 space-y-1 max-w-xs">
                              <span className="font-bold block text-[10px] text-blue-700 uppercase font-mono">Absence Reason:</span>
                              <p className="line-clamp-2">{existingAtt.excuseReason}</p>
                            </div>
                          ) : !isApproved && existingAtt && liveClass.status === "COMPLETED" ? (
                            <button
                              type="button"
                              onClick={async () => {
                                setActionLoading(true);
                                try {
                                  await fetch(`/api/trainer/live-classes/${liveClass.id}/attendance`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "APPROVE_SELECTED", attendanceIds: [existingAtt.id] }),
                                  });
                                  showToast("success", `Attendance for ${bs.user.name} approved!`);
                                  refreshClass();
                                  router.refresh();
                                } catch (e: any) {
                                  showToast("error", e.message || "Approval failed");
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C248C] font-bold text-[10px] transition cursor-pointer"
                            >
                              Approve Check-In
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No students enrolled in this batch to mark attendance.
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 4: RECORDING ---------------- */}
      {activeTab === "recording" && (
        <form onSubmit={handleSaveRecording} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileVideo className="w-5 h-5 text-[#7C248C]" /> Class Session Recording File or Link
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload a recorded video session file directly from your computer or paste an external streaming URL (Google Drive / YouTube).
            </p>
          </div>

          {/* Direct File Upload Box */}
          <div className="p-6 rounded-2xl bg-purple-50/40 border border-dashed border-purple-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2B88] to-[#7C248C] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Upload Video Recording File from Device</h3>
                <p className="text-[10px] text-slate-500 font-mono">Supports .mp4, .webm, .mkv, .mov files up to 500MB</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs cursor-pointer transition inline-flex items-center gap-2 shadow-sm shadow-purple-900/20">
                {uploadingRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingRecording ? "Uploading Recording..." : "Choose Video File"}
                <input
                  type="file"
                  accept="video/*"
                  disabled={uploadingRecording}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingRecording(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("category", "recordings");
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json();
                      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
                      setRecordingUrlInput(data.data.url);
                      showToast("success", `File "${data.data.fileName}" uploaded successfully!`);
                    } catch (err: any) {
                      showToast("error", err.message || "Failed to upload video file");
                    } finally {
                      setUploadingRecording(false);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {recordingUrlInput && (
                <span className="text-xs font-mono text-[#7C248C] font-bold truncate">
                  Uploaded File: {recordingUrlInput}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider block">Recording File URL or Path</label>
            <input
              type="text"
              required
              placeholder="/uploads/recordings/... or https://drive.google.com/..."
              value={recordingUrlInput}
              onChange={(e) => setRecordingUrlInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] focus:bg-white shadow-xs font-mono transition"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={actionLoading || uploadingRecording}
              className="px-6 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publish Recording & Notify Students
            </button>
          </div>
        </form>
      )}

      {/* Edit / Reschedule Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit / Reschedule Live Class</h3>
                <p className="text-slate-500 text-xs mt-0.5">Adjust timing, status, or meet links for this session.</p>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.scheduledDate}
                    onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google Meet Link *</label>
                <input
                  type="url"
                  required
                  value={editForm.meetUrl}
                  onChange={(e) => setEditForm({ ...editForm, meetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save & Notify
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
