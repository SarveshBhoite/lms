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
  user: { id: string; name: string; email: string };
}

interface LiveClassDetailData {
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
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-cyan-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Live Classes Studio
        </Link>
      </div>

      {/* Class Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                liveClass.status === "LIVE"
                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                  : liveClass.status === "COMPLETED"
                  ? "bg-slate-100 text-slate-700 border-slate-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {liveClass.status}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
              Batch: {liveClass.batch.name}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{liveClass.title}</h1>
          <p className="text-xs text-slate-600 font-mono">
            Course: <strong className="text-slate-900">{liveClass.batch.course.title}</strong> • Date: {new Date(liveClass.scheduledDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <a
            href={liveClass.meetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-2 transition"
          >
            <Video className="w-4 h-4" /> Launch Meet <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Edit2 className="w-4 h-4 inline mr-1" /> Edit / Reschedule
          </button>
        </div>
      </div>

      {/* 4 Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview & Status
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Batch Students ({liveClass.batch.students.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Attendance Roster ({liveClass.attendances.length} marked)
        </button>

        <button
          onClick={() => setActiveTab("recording")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "recording"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Recording Link
        </button>
      </div>

      {/* ---------------- SECTION 1: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Class Details & Status Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 font-mono">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500">SCHEDULED SESSION TIME</div>
                <div className="text-sm font-bold text-slate-900">
                  {new Date(liveClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(liveClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-slate-500 pt-2">DESCRIPTION</div>
                <p className="text-slate-700 text-xs leading-relaxed">{liveClass.description || "No session description provided."}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-slate-500">STATUS CONTROLS</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleStatusChange("LIVE")}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                  >
                    Set LIVE NOW
                  </button>
                  <button
                    onClick={() => handleStatusChange("COMPLETED")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    Mark COMPLETED
                  </button>
                  <button
                    onClick={() => handleStatusChange("CANCELLED")}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
                  >
                    Cancel Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Batch Cohort Students ({liveClass.batch.students.length})</h2>

          {liveClass.batch.students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveClass.batch.students.map((bs) => (
                <div key={bs.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{bs.user.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{bs.user.email}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                    Batch Member
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No students enrolled in this batch.</div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 3: ATTENDANCE ---------------- */}
      {activeTab === "attendance" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Mark Live Class Attendance</h2>
            <button
              onClick={handleSaveAttendance}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
              Save Attendance Records
            </button>
          </div>

          {liveClass.batch.students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold font-mono">
                  <tr>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {liveClass.batch.students.map((bs) => {
                    const existingAtt = liveClass.attendances.find((a) => a.userId === bs.userId);
                    const currentStatus = attendanceState[bs.userId] || existingAtt?.status || "PRESENT";

                    return (
                      <tr key={bs.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-900">{bs.user.name}</td>
                        <td className="p-4 font-mono text-slate-500">{bs.user.email}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  setAttendanceState((prev) => ({
                                    ...prev,
                                    [bs.userId]: st,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition ${
                                  currentStatus === st
                                    ? st === "PRESENT"
                                      ? "bg-emerald-600 text-white"
                                      : st === "ABSENT"
                                      ? "bg-rose-600 text-white"
                                      : st === "LATE"
                                      ? "bg-amber-600 text-white"
                                      : "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No students enrolled in batch to mark attendance.</div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 4: RECORDING ---------------- */}
      {activeTab === "recording" && (
        <form onSubmit={handleSaveRecording} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-600" /> Class Session Recording Link
          </h2>
          <p className="text-xs text-slate-500">
            Publish Google Drive or YouTube recording URL. Saving sends an automated notification to all batch students.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Recording URL</label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/file/d/..."
              value={recordingUrlInput}
              onChange={(e) => setRecordingUrlInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 shadow-xs"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-2 transition"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publish Recording & Notify Students
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Edit / Reschedule Live Class</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save & Notify
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
