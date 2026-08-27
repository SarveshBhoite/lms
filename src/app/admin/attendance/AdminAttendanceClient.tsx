"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Users,
  Calendar,
  Layers,
  Edit2,
  X,
  Save,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  recordedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile?: { avatarUrl?: string | null } | null;
  };
  liveClass: {
    id: string;
    title: string;
    scheduledDate: string;
    trainer: { name: string };
    batch: { id: string; name: string; course: { title: string } };
  };
}

interface StatsData {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  overallRate: number;
}

interface BatchOption {
  id: string;
  name: string;
}

export default function AdminAttendanceClient({
  initialData,
  batches,
}: {
  initialData: { attendances: AttendanceRecord[]; stats: StatsData };
  batches: BatchOption[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>(initialData.attendances);
  const [stats, setStats] = useState<StatsData>(initialData.stats);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<"PRESENT" | "ABSENT" | "LATE" | "EXCUSED">("PRESENT");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveClassId: editingRecord.liveClass.id,
          userId: editingRecord.user.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update attendance");

      setRecords((prev) =>
        prev.map((r) => (r.id === editingRecord.id ? { ...r, status: newStatus } : r))
      );
      showToast("success", "Attendance status updated successfully!");
      setEditingRecord(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update attendance");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.liveClass.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    const matchesBatch = selectedBatch === "ALL" || r.liveClass.batch.id === selectedBatch;

    return matchesSearch && matchesStatus && matchesBatch;
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-rose-600" /> Institutional Attendance Control Hub
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time monitoring and administrative override for live session attendance across all cohorts and trainers.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">OVERALL ATTENDANCE RATE</span>
          <div className="text-2xl font-black text-slate-900">{stats.overallRate.toFixed(1)}%</div>
          <p className="text-[10px] text-slate-500">Present + Late Attendance Ratio</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">PRESENT SESSIONS</span>
          <div className="text-2xl font-black text-emerald-700">{stats.presentCount}</div>
          <p className="text-[10px] text-slate-500">On-time student attendances</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-rose-600 uppercase">ABSENT SESSIONS</span>
          <div className="text-2xl font-black text-rose-700">{stats.absentCount}</div>
          <p className="text-[10px] text-slate-500">Unexcused missed live classes</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-amber-600 uppercase">LATE ARRIVALS</span>
          <div className="text-2xl font-black text-amber-700">{stats.lateCount}</div>
          <p className="text-[10px] text-slate-500">Joined after session start</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">EXCUSED ABSENCES</span>
          <div className="text-2xl font-black text-purple-700">{stats.excusedCount}</div>
          <p className="text-[10px] text-slate-500">Faculty-authorized leaves</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, email, or live class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {["ALL", "PRESENT", "ABSENT", "LATE", "EXCUSED"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                  selectedStatus === st
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Batch Selector */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Cohorts / Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="p-4">Student Details</th>
                  <th className="p-4">Live Class & Instructor</th>
                  <th className="p-4">Course & Batch</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Attendance Status</th>
                  <th className="p-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                          <img
                            src={
                              rec.user.profile?.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                rec.user.name
                              )}`
                            }
                            alt={rec.user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{rec.user.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{rec.user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">{rec.liveClass.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Instructor: {rec.liveClass.trainer.name}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-indigo-700">{rec.liveClass.batch.course.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{rec.liveClass.batch.name}</div>
                    </td>

                    <td className="p-4 font-mono text-slate-500" suppressHydrationWarning>
                      {new Date(rec.liveClass.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full font-extrabold text-[10px] uppercase border ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : rec.status === "ABSENT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : rec.status === "LATE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setEditingRecord(rec);
                          setNewStatus(rec.status);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 ml-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No attendance records found matching filters.</p>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateRecord}
            className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-600" /> Admin Attendance Override
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <div>
                Student: <strong className="text-slate-900">{editingRecord.user.name}</strong>
              </div>
              <div>
                Class: <strong className="text-indigo-700">{editingRecord.liveClass.title}</strong>
              </div>
              <div>
                Current Status: <strong className="text-rose-600">{editingRecord.status}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select New Status *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition border ${
                      newStatus === st
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{" "}
                Save Admin Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
