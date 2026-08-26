"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Users,
  Video,
  Clock,
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
  FileCheck,
  HelpCircle,
  Award,
} from "lucide-react";

interface StudentUser {
  id: string;
  name: string;
  email: string;
  profile?: { phone?: string | null; avatarUrl?: string | null; designation?: string | null } | null;
}

interface AttendanceRecord {
  id: string;
  liveClassId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
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

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  status: string;
  questions: { id: string }[];
  quizAttempts: { id: string; userId: string; score: number; isPassed: boolean }[];
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  totalMarks: number;
  submissions: {
    id: string;
    userId: string;
    status: string;
    submittedAt: string;
    user: { id: string; name: string; email: string };
    feedback?: { marksAwarded: number; feedbackText: string } | null;
  }[];
}

interface BatchDetail {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string | null;
    level: string;
    durationHours: number;
    quizzes: QuizItem[];
    assignments: AssignmentItem[];
  };
  trainers: { id: string; trainer: { id: string; name: string; email: string } }[];
  students: BatchStudentItem[];
  liveClasses: LiveClassItem[];
}

export default function TrainerBatchDetailClient({
  initialBatch,
  availableStudents,
  currentUserId,
}: {
  initialBatch: BatchDetail;
  availableStudents: StudentUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchDetail>(initialBatch);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "live-classes" | "attendance" | "quizzes" | "assignments">("live-classes");

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Student Roster Modal
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
      const res = await fetch(`/api/trainer/batches/${batch.id}`);
      const data = await res.json();
      if (data.success) {
        setBatch(data.data);
        if (!selectedClassForAttendance && data.data.liveClasses.length > 0) {
          setSelectedClassForAttendance(data.data.liveClasses[0]);
        }
      }
    } catch (err) {
      console.error("Failed to refresh batch:", err);
    }
  };

  const handleSaveStudents = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/batches/${batch.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update roster");

      showToast("success", "Batch student roster updated successfully!");
      setIsStudentsModalOpen(false);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save student roster");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLiveClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const startDateTime = new Date(`${liveClassForm.scheduledDate}T${liveClassForm.startTime}:00`);
      const endDateTime = new Date(`${liveClassForm.scheduledDate}T${liveClassForm.endTime}:00`);

      const payload = {
        batchId: batch.id,
        title: liveClassForm.title,
        scheduledDate: new Date(liveClassForm.scheduledDate).toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        meetUrl: liveClassForm.meetUrl,
        recordingUrl: liveClassForm.recordingUrl || null,
        description: liveClassForm.description || null,
        status: liveClassForm.status,
      };

      const url = editingLiveClass
        ? `/api/trainer/live-classes/${editingLiveClass.id}`
        : `/api/trainer/live-classes`;
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
        editingLiveClass ? "Live class updated!" : `Live class "${liveClassForm.title}" scheduled!`
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

  const handleDeleteLiveClass = async () => {
    if (!deletingLiveClass) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/live-classes/${deletingLiveClass.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete live class");

      showToast("success", "Live class deleted.");
      setDeletingLiveClass(null);
      refreshBatch();
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete live class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAttendance = async (classId: string) => {
    setActionLoading(true);
    try {
      const records = Object.entries(attendanceState).map(([userId, status]) => ({
        userId,
        status,
      }));

      const res = await fetch("/api/trainer/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveClassId: classId, records }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save attendance");

      showToast("success", "Attendance records saved successfully!");
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
      scheduledDate: dateStr,
      startTime: startStr,
      endTime: endStr,
      meetUrl: lc.meetUrl,
      recordingUrl: lc.recordingUrl || "",
      description: lc.description || "",
      status: lc.status,
    });
    setIsLiveClassModalOpen(true);
  };

  const resetLiveClassForm = () => {
    setLiveClassForm({
      title: "",
      scheduledDate: new Date().toISOString().split("T")[0],
      startTime: "10:00",
      endTime: "11:30",
      meetUrl: "",
      recordingUrl: "",
      description: "",
      status: "SCHEDULED",
    });
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
          href="/trainer/batches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Batches
        </Link>
      </div>

      {/* Batch Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {batch.status}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
              Course: {batch.course.title}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{batch.name}</h1>

          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap font-mono">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-600 font-semibold">
              <Users className="w-3.5 h-3.5" /> {batch.students.length} Enrolled Students
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-600 font-semibold">
              <Video className="w-3.5 h-3.5" /> {batch.liveClasses.length} Live Sessions
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedStudentIds(batch.students.map((s) => s.userId));
            setIsStudentsModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
        >
          <UserCheck className="w-4 h-4" /> Manage Student Roster
        </button>
      </div>

      {/* 6 Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("live-classes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "live-classes"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Live Classes ({batch.liveClasses.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Attendance Roster
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Students ({batch.students.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-purple-600 text-purple-700 bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({batch.course.quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-rose-600 text-rose-700 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Assignments ({batch.course.assignments.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
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
              <h2 className="text-lg font-bold text-slate-900">Live Google Meet Interactive Classes</h2>
              <p className="text-xs text-slate-500">
                Schedule online sessions for this batch. Enrolled students receive notifications and join buttons.
              </p>
            </div>

            <button
              onClick={() => {
                resetLiveClassForm();
                setIsLiveClassModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-2 transition"
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
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          lc.status === "LIVE"
                            ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                            : lc.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
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
                        <strong className="text-cyan-700">{lc.trainer.name}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <a
                      href={lc.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Video className="w-4 h-4" /> Join Class (Google Meet) <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {lc.recordingUrl && (
                      <a
                        href={lc.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
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
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
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
              <h3 className="text-base font-bold text-slate-900">No live classes scheduled for this batch</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a Google Meet live interactive class for your students by clicking "Schedule Live Class" above.
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
              <h2 className="text-lg font-bold text-slate-900">Attendance Roster & Marking</h2>
              <p className="text-xs text-slate-500">
                Mark attendance per live class. Changes are saved directly to student academic records.
              </p>
            </div>

            {batch.liveClasses.length > 0 && (
              <select
                value={selectedClassForAttendance?.id || ""}
                onChange={(e) => {
                  const target = batch.liveClasses.find((lc) => lc.id === e.target.value);
                  setSelectedClassForAttendance(target || null);
                  if (target) {
                    const stateObj: Record<string, any> = {};
                    target.attendances.forEach((att) => {
                      stateObj[att.userId] = att.status;
                    });
                    setAttendanceState(stateObj);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none shadow-xs"
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
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden space-y-4 shadow-xs">
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 transition"
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
                        <th className="p-4">Student Name</th>
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
                <div className="p-8 text-center text-xs text-slate-500">
                  No students in this batch roster yet.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No live class available to mark attendance</h3>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: STUDENTS ---------------- */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Batch Student Roster</h2>
              <p className="text-xs text-slate-500">
                Manage cohort members. Adding or removing students updates batch assignment without touching account history or course enrollment.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedStudentIds(batch.students.map((s) => s.userId));
                setIsStudentsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add / Remove Students
            </button>
          </div>

          {batch.students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batch.students.map((bs) => (
                <div key={bs.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="overflow-hidden mr-2">
                    <div className="font-bold text-slate-900 text-sm truncate">{bs.user.name}</div>
                    <div className="text-xs text-slate-500 font-mono truncate">{bs.user.email}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">Joined: {new Date(bs.joinedAt).toLocaleDateString()}</div>
                  </div>
                  <Link
                    href={`/trainer/students/${bs.userId}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 transition shrink-0"
                    title="View Student Profile & Performance"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No students enrolled in this batch</h3>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course Quizzes & Assessments</h2>
              <p className="text-xs text-slate-500">
                Quizzes configured for {batch.course.title}. Students in this batch can attempt published quizzes.
              </p>
            </div>

            <Link
              href="/trainer/quizzes/create"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Create New Quiz
            </Link>
          </div>

          {batch.course.quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batch.course.quizzes.map((qz) => (
                <div key={qz.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {qz.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{qz.timeLimitMinutes} mins</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{qz.title}</h3>
                  <div className="text-xs text-slate-600 flex items-center gap-4 font-mono">
                    <span>Questions: {qz.questions.length}</span>
                    <span>Passing Score: {qz.passingMarks}%</span>
                  </div>

                  <Link
                    href={`/trainer/quizzes/${qz.id}`}
                    className="block text-center w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    Manage Quiz & View Attempts
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No quizzes created for this course yet</h3>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course Assignments & Grading</h2>
              <p className="text-xs text-slate-500">
                Track assignment submissions and grade student code or document submissions.
              </p>
            </div>

            <Link
              href="/trainer/assignments/create"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> New Assignment
            </Link>
          </div>

          {batch.course.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batch.course.assignments.map((asgn) => {
                const pendingSubmissions = asgn.submissions.filter((s) => s.status === "SUBMITTED").length;

                return (
                  <div key={asgn.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-rose-600 font-bold">
                        Deadline: {new Date(asgn.deadline).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{asgn.totalMarks} Marks</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{asgn.title}</h3>
                    <div className="text-xs text-slate-600 flex items-center gap-4 font-mono">
                      <span>Total Submissions: {asgn.submissions.length}</span>
                      <span className="text-amber-700 font-bold">Pending: {pendingSubmissions}</span>
                    </div>

                    <Link
                      href={`/trainer/assignments/${asgn.id}`}
                      className="block text-center w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                    >
                      Evaluate Submissions
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No assignments created for this course yet</h3>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Batch Academic Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 font-mono">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-slate-500">COURSE TITLE</div>
              <div className="text-base font-bold text-slate-900">{batch.course.title}</div>
              <div className="text-slate-500 pt-2">DESCRIPTION</div>
              <p className="text-slate-700 text-xs leading-relaxed">{batch.course.description}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-slate-500">ASSIGNED FACULTY</div>
              <div className="space-y-1">
                {batch.trainers.map((t) => (
                  <div key={t.id} className="text-sm font-bold text-amber-700">
                    {t.trainer.name} ({t.trainer.email})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Roster Modal */}
      {isStudentsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-xl w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Batch Student Roster</h3>
              <button onClick={() => setIsStudentsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select students enrolled in {batch.course.title} to add to this batch.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border border-slate-200 rounded-2xl p-2 bg-slate-50">
              {availableStudents.map((s) => {
                const isSelected = selectedStudentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentIds((prev) =>
                        prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      );
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? "bg-amber-50 border-amber-300 text-slate-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 rounded text-amber-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudents}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Student Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Class Create / Edit Modal */}
      {isLiveClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleLiveClassSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingLiveClass ? "Edit Live Class" : "Schedule Live Class (Google Meet)"}
              </h3>
              <button type="button" onClick={() => setIsLiveClassModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Async JavaScript & Event Loop Live Q&A"
                  value={liveClassForm.title}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={liveClassForm.scheduledDate}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, scheduledDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={liveClassForm.status}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, status: e.target.value as any })}
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
                    value={liveClassForm.startTime}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={liveClassForm.endTime}
                    onChange={(e) => setLiveClassForm({ ...liveClassForm, endTime: e.target.value })}
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
                  value={liveClassForm.meetUrl}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, meetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recording Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={liveClassForm.recordingUrl}
                  onChange={(e) => setLiveClassForm({ ...liveClassForm, recordingUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLiveClassModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Live Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLiveClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-sm w-full space-y-4 text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Delete Live Class?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete "{deletingLiveClass.title}"? This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingLiveClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLiveClass}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
