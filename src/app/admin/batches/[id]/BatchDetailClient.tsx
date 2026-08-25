"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  ChevronLeft,
  Calendar,
  Users,
  Video,
  Clock,
  Sparkles,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CheckSquare,
  ExternalLink,
  UserCheck,
  UserX,
  Eye,
  BarChart2,
  Globe,
  Lock,
} from "lucide-react";

interface UserProfile {
  phone?: string | null;
  avatarUrl?: string | null;
  designation?: string | null;
}

interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profile?: UserProfile | null;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
  profile?: UserProfile | null;
}

interface AttendanceRecord {
  id: string;
  liveClassId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  recordedAt: string;
  user: { id: string; name: string; email: string };
}

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
  trainer: { id: string; name: string; email: string };
  attendances: AttendanceRecord[];
}

interface BatchStudentItem {
  id: string;
  userId: string;
  joinedAt: string;
  user: StudentUser;
}

interface BatchTrainerItem {
  id: string;
  trainerId: string;
  assignedAt: string;
  trainer: TrainerUser;
}

interface BatchDetail {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string | null;
    level: string;
    durationHours: number;
  };
  trainers: BatchTrainerItem[];
  students: BatchStudentItem[];
  liveClasses: LiveClassItem[];
  _count: {
    students: number;
    trainers: number;
    liveClasses: number;
  };
}

export default function BatchDetailClient({
  initialBatch,
  availableTrainers,
  availableStudents,
}: {
  initialBatch: BatchDetail;
  availableTrainers: TrainerUser[];
  availableStudents: StudentUser[];
}) {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchDetail>(initialBatch);
  const [activeTab, setActiveTab] = useState<"overview" | "trainers" | "students" | "live-classes" | "attendance">("live-classes");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Trainer Assignment Modal
  const [isTrainersModalOpen, setIsTrainersModalOpen] = useState(false);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>(
    initialBatch.trainers.map((t) => t.trainerId)
  );

  // Student Assignment Modal
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialBatch.students.map((s) => s.userId)
  );

  // Live Class Modal State
  const [isLiveClassModalOpen, setIsLiveClassModalOpen] = useState(false);
  const [editingLiveClass, setEditingLiveClass] = useState<LiveClassItem | null>(null);
  const [deletingLiveClass, setDeletingLiveClass] = useState<LiveClassItem | null>(null);
  const [liveClassForm, setLiveClassForm] = useState({
    title: "",
    trainerId: availableTrainers[0]?.id || "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
    meetUrl: "",
    recordingUrl: "",
    description: "",
    status: "SCHEDULED" as "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED",
  });

  // Attendance Marking State
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<LiveClassItem | null>(
    initialBatch.liveClasses[0] || null
  );
  const [attendanceState, setAttendanceState] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">>({});

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshBatch = async () => {
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}`);
      const data = await res.json();
      if (data.success) {
        setBatch(data.data);
        if (!selectedClassForAttendance && data.data.liveClasses.length > 0) {
          setSelectedClassForAttendance(data.data.liveClasses[0]);
        }
      }
    } catch (err) {
      console.error("Failed to refresh batch data:", err);
    }
  };

  // Sync Trainers Submit
  const handleSaveTrainers = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerIds: selectedTrainerIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update trainers");

      showToast("success", "Assigned trainers updated!");
      setIsTrainersModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save trainers");
    } finally {
      setActionLoading(false);
    }
  };

  // Sync Students Submit
  const handleSaveStudents = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update students");

      showToast("success", "Batch student roster updated!");
      setIsStudentsModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save students");
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule / Edit Live Class Submit
  const handleLiveClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const startDateTime = new Date(`${liveClassForm.scheduledDate}T${liveClassForm.startTime}:00`);
      const endDateTime = new Date(`${liveClassForm.scheduledDate}T${liveClassForm.endTime}:00`);

      const payload = {
        title: liveClassForm.title,
        trainerId: liveClassForm.trainerId,
        scheduledDate: new Date(liveClassForm.scheduledDate).toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        meetUrl: liveClassForm.meetUrl,
        recordingUrl: liveClassForm.recordingUrl || null,
        description: liveClassForm.description || null,
        status: liveClassForm.status,
      };

      const url = editingLiveClass
        ? `/api/admin/batches/${batch.id}/live-classes/${editingLiveClass.id}`
        : `/api/admin/batches/${batch.id}/live-classes`;
      const method = editingLiveClass ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save live class");

      showToast(
        "success",
        editingLiveClass
          ? `Live class updated successfully!`
          : `Live class "${liveClassForm.title}" scheduled!`
      );

      setIsLiveClassModalOpen(false);
      setEditingLiveClass(null);
      resetLiveClassForm();
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save live class");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Live Class
  const handleDeleteLiveClass = async () => {
    if (!deletingLiveClass) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batch.id}/live-classes/${deletingLiveClass.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete class");

      showToast("success", `Live class deleted.`);
      setDeletingLiveClass(null);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete class");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Attendance Grid
  const handleSaveAttendance = async (classId: string) => {
    setActionLoading(true);
    try {
      const records = Object.entries(attendanceState).map(([userId, status]) => ({
        userId,
        status,
      }));

      const res = await fetch(`/api/admin/batches/${batch.id}/live-classes/${classId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save attendance");

      showToast("success", "Attendance records saved!");
      refreshBatch();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save attendance");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditLiveClassModal = (lc: LiveClassItem) => {
    setEditingLiveClass(lc);
    const dateStr = new Date(lc.scheduledDate).toISOString().split("T")[0];
    const startStr = new Date(lc.startTime).toTimeString().substring(0, 5);
    const endStr = new Date(lc.endTime).toTimeString().substring(0, 5);

    setLiveClassForm({
      title: lc.title,
      trainerId: lc.trainerId,
      scheduledDate: dateStr,
      startTime: startStr,
      endTime: endStr,
      meetUrl: lc.meetUrl,
      recordingUrl: lc.recordingUrl || "",
      description: lc.description || "",
      status: lc.status,
    });
  };

  const resetLiveClassForm = () => {
    setLiveClassForm({
      title: "",
      trainerId: batch.trainers[0]?.trainerId || availableTrainers[0]?.id || "",
      scheduledDate: new Date().toISOString().split("T")[0],
      startTime: "10:00",
      endTime: "11:30",
      meetUrl: "",
      recordingUrl: "",
      description: "",
      status: "SCHEDULED",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING":
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Ongoing</span>;
      case "UPCOMING":
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Upcoming</span>;
      case "COMPLETED":
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">Completed</span>;
      default:
        return <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation Top */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Batch Management
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(batch.status)}
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
              {batch.course.title}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{batch.name}</h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap font-mono">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> {batch.students.length} Enrolled Students
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-rose-600" /> {batch.liveClasses.length} Live Classes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedTrainerIds(batch.trainers.map((t) => t.trainerId));
              setIsTrainersModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition"
          >
            Manage Trainers
          </button>
          <button
            onClick={() => {
              setSelectedStudentIds(batch.students.map((s) => s.userId));
              setIsStudentsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition"
          >
            Manage Students
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("live-classes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "live-classes"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Live Classes ({batch.liveClasses.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Attendance Roster
        </button>

        <button
          onClick={() => setActiveTab("trainers")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "trainers"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Assigned Trainers ({batch.trainers.length})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Students Roster ({batch.students.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-rose-600 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Batch Overview
        </button>
      </div>

      {/* ---------------- TAB 1: LIVE CLASSES ---------------- */}
      {activeTab === "live-classes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Interactive Classes</h2>
              <p className="text-xs text-slate-500">
                Schedule Google Meet sessions for this cohort. Students will see a direct "Join Class" button.
              </p>
            </div>

            <button
              onClick={() => {
                resetLiveClassForm();
                setIsLiveClassModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Schedule Live Class
            </button>
          </div>

          {batch.liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batch.liveClasses.map((lc) => (
                <div
                  key={lc.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          lc.status === "LIVE"
                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            : lc.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {lc.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(lc.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{lc.title}</h3>
                      {lc.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lc.description}</p>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600 font-mono">
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <strong className="text-slate-900">
                          {new Date(lc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(lc.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Instructor:</span>
                        <strong className="text-indigo-600">{lc.trainer.name}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* Google Meet Trigger */}
                    <a
                      href={lc.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Video className="w-4 h-4" /> Join Class (Google Meet) <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {lc.recordingUrl && (
                      <a
                        href={lc.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        Watch Class Recording
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          setSelectedClassForAttendance(lc);
                          setActiveTab("attendance");
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Attendance ({lc.attendances.length} marked)
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditLiveClassModal(lc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Edit Class"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingLiveClass(lc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Video className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No live classes scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a live Google Meet class for this batch by clicking "Schedule Live Class" above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: ATTENDANCE ---------------- */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Attendance Roster & History</h2>
              <p className="text-xs text-slate-500">
                Mark manual attendance (Present, Absent, Late, Excused) per live class.
              </p>
            </div>

            {/* Select Live Class */}
            {batch.liveClasses.length > 0 && (
              <select
                value={selectedClassForAttendance?.id || ""}
                onChange={(e) => {
                  const target = batch.liveClasses.find((lc) => lc.id === e.target.value);
                  setSelectedClassForAttendance(target || null);
                  // Reset attendance state for new class
                  if (target) {
                    const stateObj: Record<string, any> = {};
                    target.attendances.forEach((att) => {
                      stateObj[att.userId] = att.status;
                    });
                    setAttendanceState(stateObj);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
              >
                {batch.liveClasses.map((lc) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.title} ({new Date(lc.scheduledDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedClassForAttendance ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
              <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedClassForAttendance.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Scheduled: {new Date(selectedClassForAttendance.scheduledDate).toLocaleDateString()} • Instructor: {selectedClassForAttendance.trainer.name}
                  </p>
                </div>

                <button
                  onClick={() => handleSaveAttendance(selectedClassForAttendance.id)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
                  Save Attendance Records
                </button>
              </div>

              {batch.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {batch.students.map((bs) => {
                        const existingAtt = selectedClassForAttendance.attendances.find(
                          (att) => att.userId === bs.userId
                        );
                        const currentStatus =
                          attendanceState[bs.userId] || existingAtt?.status || "PRESENT";

                        return (
                          <tr key={bs.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {bs.user.profile?.avatarUrl ? (
                                  <img
                                    src={bs.user.profile.avatarUrl}
                                    alt={bs.user.name}
                                    className="w-8 h-8 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                                    {bs.user.name.charAt(0)}
                                  </div>
                                )}
                                <div className="font-bold text-slate-900">{bs.user.name}</div>
                              </div>
                            </td>

                            <td className="p-4 font-mono text-slate-600">{bs.user.email}</td>

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
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : st === "ABSENT"
                                          ? "bg-rose-600 text-white shadow-xs"
                                          : st === "LATE"
                                          ? "bg-amber-600 text-white shadow-xs"
                                          : "bg-indigo-600 text-white shadow-xs"
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
                <div className="p-8 text-center text-xs text-slate-400">
                  No students in this batch yet.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Live Classes Available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a live class first under the Live Classes tab to mark attendance.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: ASSIGNED TRAINERS ---------------- */}
      {activeTab === "trainers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Batch Trainers</h2>
              <p className="text-xs text-slate-500">
                Trainers assigned to lead classes and facilitate this cohort.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedTrainerIds(batch.trainers.map((t) => t.trainerId));
                setIsTrainersModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Manage Trainer Assignments
            </button>
          </div>

          {batch.trainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batch.trainers.map((bt) => (
                <div
                  key={bt.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex items-center gap-4"
                >
                  {bt.trainer.profile?.avatarUrl ? (
                    <img
                      src={bt.trainer.profile.avatarUrl}
                      alt={bt.trainer.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                      {bt.trainer.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{bt.trainer.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{bt.trainer.email}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                      {bt.trainer.profile?.designation || "Instructor"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No trainers assigned</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Assign trainers to this batch by clicking "Manage Trainer Assignments" above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: STUDENTS ROSTER ---------------- */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Batch Student Roster</h2>
              <p className="text-xs text-slate-500">
                Students allocated to this specific cohort.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedStudentIds(batch.students.map((s) => s.userId));
                setIsStudentsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Manage Student Roster
            </button>
          </div>

          {batch.students.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {batch.students.map((bs) => (
                    <tr key={bs.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {bs.user.profile?.avatarUrl ? (
                            <img
                              src={bs.user.profile.avatarUrl}
                              alt={bs.user.name}
                              className="w-8 h-8 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                              {bs.user.name.charAt(0)}
                            </div>
                          )}
                          <div className="font-bold text-slate-900">{bs.user.name}</div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-600">{bs.user.email}</td>

                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {new Date(bs.joinedAt).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/students/${bs.user.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No students allocated</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add students to this batch by clicking "Manage Student Roster" above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: BATCH OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Course Curriculum Info</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This batch follows the <strong>{batch.course.title}</strong> curriculum.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                <div>Level: <strong className="text-slate-900">{batch.course.level}</strong></div>
                <div>Duration: <strong className="text-slate-900">{batch.course.durationHours} Hours</strong></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs text-slate-700 divide-y divide-slate-100">
              <div className="flex justify-between pb-2">
                <span className="text-slate-400">Batch ID:</span>
                <span className="font-mono text-slate-900">{batch.id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Start Date:</span>
                <span className="font-mono text-slate-900">{new Date(batch.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">End Date:</span>
                <span className="font-mono text-slate-900">{new Date(batch.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}

      {/* Manage Trainers Modal */}
      {isTrainersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Assign Trainers to Batch</h3>
              <button
                onClick={() => setIsTrainersModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              {availableTrainers.map((tr) => {
                const isSelected = selectedTrainerIds.includes(tr.id);
                return (
                  <div
                    key={tr.id}
                    onClick={() =>
                      setSelectedTrainerIds((prev) =>
                        isSelected ? prev.filter((id) => id !== tr.id) : [...prev, tr.id]
                      )
                    }
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div>{tr.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tr.email}</div>
                    </div>
                    {isSelected && <CheckSquare className="w-4 h-4 text-indigo-600" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsTrainersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrainers}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Trainer Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {isStudentsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Allocate Students to Batch</h3>
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              {availableStudents.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() =>
                      setSelectedStudentIds((prev) =>
                        isSelected ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                      )
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div>{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{st.email}</div>
                    </div>
                    {isSelected && <CheckSquare className="w-4 h-4 text-rose-600" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudents}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Student Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Edit Live Class Modal */}
      {(isLiveClassModalOpen || editingLiveClass) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-base">
                {editingLiveClass ? "Edit Live Class" : "Schedule Live Google Meet Class"}
              </h3>
              <button
                onClick={() => {
                  setIsLiveClassModalOpen(false);
                  setEditingLiveClass(null);
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLiveClassSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Session 1: React State Management & Hooks"
                  value={liveClassForm.title}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Google Meet URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Google Meet URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={liveClassForm.meetUrl}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, meetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              {/* Trainer & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Trainer *</label>
                  <select
                    required
                    value={liveClassForm.trainerId}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, trainerId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    {batch.trainers.map((bt) => (
                      <option key={bt.trainer.id} value={bt.trainer.id}>
                        {bt.trainer.name}
                      </option>
                    ))}
                    {availableTrainers.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name} ({tr.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Class Status *</label>
                  <select
                    value={liveClassForm.status}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live Now</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Date, Start & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={liveClassForm.scheduledDate}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={liveClassForm.startTime}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Time *</label>
                  <input
                    type="time"
                    required
                    value={liveClassForm.endTime}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Recording URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recording Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={liveClassForm.recordingUrl}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, recordingUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Session summary or agenda..."
                  value={liveClassForm.description}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveClassModalOpen(false);
                    setEditingLiveClass(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingLiveClass ? "Save Class Changes" : "Schedule Live Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Live Class Modal */}
      {deletingLiveClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-rose-200 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Delete Live Class?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete live class <strong className="text-slate-900">{deletingLiveClass.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingLiveClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLiveClass}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
