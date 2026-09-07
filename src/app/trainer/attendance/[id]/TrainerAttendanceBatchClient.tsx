"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Video,
  CheckSquare,
  Users,
  ExternalLink,
  ChevronDown,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
} from "lucide-react";

interface StudentItem {
  id: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile?: { avatarUrl?: string | null; phone?: string | null } | null;
  };
}

interface AttendanceRecord {
  id: string;
  liveClassId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  joinClickTime?: string | null;
  excuseReason?: string | null;
  isApproved?: boolean;
  user: { id: string; name: string; email: string };
}

interface LiveClassSession {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  meetUrl: string;
  recordingUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  lateCutoffMinutes?: number | null;
  trainer: { id: string; name: string; email: string };
  attendances: AttendanceRecord[];
}

interface BatchData {
  id: string;
  name: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    level: string;
  };
  students: StudentItem[];
}

export default function TrainerAttendanceBatchClient({
  batch,
  liveClasses,
  currentUserId,
}: {
  batch: BatchData;
  liveClasses: LiveClassSession[];
  currentUserId: string;
}) {
  // Active selected session for inspection (defaults to most recent session)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    liveClasses[0]?.id || null
  );

  // Filters inside the detailed list
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "LATE" | "EXCUSED" | "ABSENT">("ALL");
  const [verificationFilter, setVerificationFilter] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");

  const selectedSession = useMemo(() => {
    return liveClasses.find((lc) => lc.id === selectedSessionId) || null;
  }, [liveClasses, selectedSessionId]);

  // Overall batch statistics
  const totalSessions = liveClasses.length;
  const completedSessions = liveClasses.filter((lc) => lc.status === "COMPLETED").length;

  // Filtered student attendance list for the currently selected session
  const filteredRoster = useMemo(() => {
    if (!selectedSession) return [];

    return batch.students
      .map((bs) => {
        const att = selectedSession.attendances.find((a) => a.userId === bs.userId);
        const computedStatus = att?.status || "ABSENT";
        const isApproved = att?.isApproved || false;
        const joinClickTime = att?.joinClickTime || null;
        const excuseReason = att?.excuseReason || null;

        return {
          student: bs.user,
          attendance: att,
          status: computedStatus,
          isApproved,
          joinClickTime,
          excuseReason,
        };
      })
      .filter((row) => {
        // Search filter
        const matchesQuery =
          !searchQuery.trim() ||
          row.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.student.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;

        // Verification filter
        const matchesVerification =
          verificationFilter === "ALL" ||
          (verificationFilter === "VERIFIED" && row.isApproved) ||
          (verificationFilter === "PENDING" && !row.isApproved);

        return matchesQuery && matchesStatus && matchesVerification;
      });
  }, [batch.students, selectedSession, searchQuery, statusFilter, verificationFilter]);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Navigation Top */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/attendance"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-700 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to All Batches
        </Link>

        <Link
          href={`/trainer/batches/${batch.id}`}
          className="text-xs font-bold text-slate-600 hover:text-purple-700 flex items-center gap-1.5 transition"
        >
          <Layers className="w-3.5 h-3.5" /> View Batch Cohort
        </Link>
      </div>

      {/* Batch Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 font-mono">
                Course: {batch.course.title}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {batch.students.length} Learners Enrolled
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{batch.name}</h1>
            <p className="text-xs text-slate-500">
              Complete session-by-session attendance tracking, student check-in timestamps, and presence verification.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <span className="text-[10px] text-purple-700 font-bold block uppercase">Live Classes</span>
              <strong className="text-purple-900 text-base">{totalSessions} Sessions</strong>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Completed</span>
              <strong className="text-emerald-900 text-base">{completedSessions} Held</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SESSIONS LIST FORMAT */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-700" /> Live Class Sessions ({liveClasses.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any session row below to view its full student attendance roster, timestamps, and filter options.
          </p>
        </div>

        {liveClasses.length > 0 ? (
          <div className="space-y-3">
            {liveClasses.map((lc) => {
              const isSelected = selectedSessionId === lc.id;
              const totalCohort = batch.students.length || lc.attendances.length || 1;

              // Breakdowns: PRESENT, LATE, and EXCUSED are all considered attended / present with remarks
              const onTimeCount = lc.attendances.filter((a) => a.status === "PRESENT").length;
              const lateCount = lc.attendances.filter((a) => a.status === "LATE").length;
              const excusedCount = lc.attendances.filter((a) => a.status === "EXCUSED").length;
              const totalPresentAttended = onTimeCount + lateCount + excusedCount;
              const absentCount = Math.max(0, totalCohort - totalPresentAttended);
              const verifiedCount = lc.attendances.filter((a) => a.isApproved).length;

              return (
                <div
                  key={lc.id}
                  onClick={() => setSelectedSessionId(lc.id)}
                  className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
                    isSelected
                      ? "bg-white border-[#7C248C] shadow-md ring-2 ring-purple-100"
                      : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs"
                  }`}
                >
                  {/* Left: Session Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        lc.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : lc.status === "LIVE"
                          ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                          : "bg-purple-50 text-[#7C248C] border border-purple-200"
                      }`}
                    >
                      <Video className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{lc.title}</h3>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono border ${
                            lc.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : lc.status === "LIVE"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-purple-100 text-purple-800 border-purple-200"
                          }`}
                        >
                          {lc.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          {new Date(lc.scheduledDate).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>•</span>
                        <span>Instructor: {lc.trainer.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics Numbers & Selection Indicator */}
                  <div className="flex items-center gap-3 flex-wrap md:flex-nowrap justify-between md:justify-end shrink-0">
                    {/* Present Box (includes On-time, Late, Excused) */}
                    <div className="p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block uppercase">Present / Attended</span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-emerald-900 text-sm">{totalPresentAttended}</strong>
                          <span className="text-[10px] text-emerald-700 font-normal">
                            ({onTimeCount} on-time{lateCount > 0 ? `, ${lateCount} late` : ""}{excusedCount > 0 ? `, ${excusedCount} excused` : ""})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Absent Box */}
                    <div className="p-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-rose-700 font-bold block uppercase">Absent</span>
                        <strong className="text-rose-900 text-sm">{absentCount}</strong>
                      </div>
                    </div>

                    {/* Verification Rate Badge */}
                    <div className="p-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-center font-mono text-xs hidden sm:block">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Verified</span>
                      <strong className="text-slate-800 text-xs">
                        {verifiedCount}/{totalCohort}
                      </strong>
                    </div>

                    {/* Active Chevron Indicator */}
                    <div
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {isSelected ? "Inspecting ↓" : "View Roster →"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
            <Video className="w-10 h-10 mx-auto text-slate-400" />
            <p className="text-sm">No live interactive classes scheduled for this batch yet.</p>
          </div>
        )}
      </div>

      {/* DETAILED ATTENDANCE LIST & FILTERS FOR SELECTED SESSION */}
      {selectedSession && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-6 p-6 sm:p-8 animate-in fade-in slide-in-from-top-3">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {selectedSession.title}
                </h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${
                    selectedSession.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : selectedSession.status === "LIVE"
                      ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                      : "bg-purple-50 text-[#7C248C] border border-purple-200"
                  }`}
                >
                  {selectedSession.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Scheduled: {new Date(selectedSession.scheduledDate).toLocaleDateString()} at{" "}
                {new Date(selectedSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Instructor: {selectedSession.trainer.name}
              </p>
            </div>

            <Link
              href={`/trainer/live-classes/${selectedSession.id}`}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Session Room & Manage Attendance
            </Link>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase">Present</span>
              <strong className="text-emerald-900 text-lg">
                {selectedSession.attendances.filter((a) => a.status === "PRESENT").length}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 block uppercase">Late</span>
              <strong className="text-amber-900 text-lg">
                {selectedSession.attendances.filter((a) => a.status === "LATE").length}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-700 block uppercase">Excused</span>
              <strong className="text-blue-900 text-lg">
                {selectedSession.attendances.filter((a) => a.status === "EXCUSED").length}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-700 block uppercase">Absent</span>
              <strong className="text-rose-900 text-lg">
                {Math.max(
                  0,
                  batch.students.length -
                    selectedSession.attendances.filter(
                      (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
                    ).length
                )}
              </strong>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold font-mono">
                {(["ALL", "PRESENT", "LATE", "EXCUSED", "ABSENT"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                      statusFilter === st
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Verification Filter */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold font-mono">
                {(["ALL", "VERIFIED", "PENDING"] as const).map((vf) => (
                  <button
                    key={vf}
                    onClick={() => setVerificationFilter(vf)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                      verificationFilter === vf
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {vf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Roster Table */}
          {filteredRoster.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold font-mono">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Join Click Time</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Excuse / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRoster.map((row) => (
                    <tr key={row.student.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{row.student.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{row.student.email}</div>
                      </td>

                      <td className="p-4 font-mono text-xs">
                        {row.joinClickTime ? (
                          <span className="text-slate-900 font-bold">
                            {new Date(row.joinClickTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not joined yet</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] font-mono inline-block ${
                            row.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : row.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : row.status === "EXCUSED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="p-4">
                        {row.isApproved ? (
                          <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ Pending Approval
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {row.excuseReason ? (
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 space-y-0.5 max-w-xs">
                            <span className="font-bold block text-[10px] text-blue-700 uppercase">Reason:</span>
                            <p className="line-clamp-2">{row.excuseReason}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
              No student attendance records match the selected search or filter criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
