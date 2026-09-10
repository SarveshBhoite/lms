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
  Sparkles,
  Award,
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
  const enrolledStudentCount = batch.students.length;

  // Calculate Batch Overall Attendance Percentage
  let batchAvgAttendancePct = 0;
  if (totalSessions > 0 && enrolledStudentCount > 0) {
    const totalPossible = totalSessions * enrolledStudentCount;
    const totalAttended = liveClasses.reduce(
      (acc, lc) =>
        acc +
        lc.attendances.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
        ).length,
      0
    );
    batchAvgAttendancePct = Math.round((totalAttended / totalPossible) * 100);
  }

  // Selected session metrics
  const sessionEnrolledCount = enrolledStudentCount;
  const sessionPresentCount = selectedSession
    ? selectedSession.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED").length
    : 0;
  const sessionAbsentCount = Math.max(0, sessionEnrolledCount - sessionPresentCount);
  const sessionAttendancePct = sessionEnrolledCount > 0 ? Math.round((sessionPresentCount / sessionEnrolledCount) * 100) : 0;
  const sessionVerifiedCount = selectedSession
    ? selectedSession.attendances.filter((a) => a.isApproved).length
    : 0;

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

  const [activeTab, setActiveTab] = useState<"sessions" | "roster" | "students">("sessions");

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Navigation Top */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/attendance"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to All Batches
        </Link>

        <Link
          href={`/trainer/batches/${batch.id}`}
          className="text-xs font-bold text-slate-600 hover:text-[#7C248C] flex items-center gap-1.5 transition"
        >
          <Layers className="w-3.5 h-3.5" /> View Batch Cohort
        </Link>
      </div>

      {/* 1. COMPACT STUDIO BANNER (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <CheckSquare className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Cohort Roll Call Cockpit
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 uppercase">
                {batch.course.title}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{batch.name}</h1>
            <p className="text-slate-500 text-xs font-mono">
              Audit live session attendance records, evaluate student check-ins, and inspect attendance turnout percentages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 text-[#7C248C] shadow-2xs">
            {enrolledStudentCount} Learners Enrolled
          </span>
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            {totalSessions} Classes
          </span>
        </div>
      </div>

      {/* 2. 5 HIGH-IMPACT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1E2B88]" /> Cohort Enrolled
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1E2B88]">{enrolledStudentCount}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-purple-600" /> Total Sessions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{totalSessions}</span>
            <span className="text-[11px] font-mono text-slate-400">{completedSessions} Completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" /> Session Present
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{sessionPresentCount}</span>
            <span className="text-[11px] font-mono text-slate-400">/ {sessionEnrolledCount} Logged</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" /> Session Attendance %
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{sessionAttendancePct}%</span>
            <span className="text-[11px] font-mono text-slate-400">Turnout</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Batch Overall %
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">
              {batchAvgAttendancePct > 0 ? `${batchAvgAttendancePct}%` : "—"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Cohort Avg</span>
          </div>
        </div>
      </div>

      {/* 3. INNER SECTION TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "sessions"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4 text-[#7C248C]" /> Live Class Sessions ({liveClasses.length})
        </button>

        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "roster"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" /> Active Session Roster ({selectedSession ? selectedSession.title : "None Selected"})
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "students"
              ? "border-[#1E2B88] text-[#1E2B88] bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-[#1E2B88]" /> Cohort Students ({batch.students.length})
        </button>
      </div>

      {/* TAB 1: SESSIONS LIST FORMAT */}
      {activeTab === "sessions" && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Video className="w-5 h-5 text-[#7C248C]" /> Live Class Sessions ({liveClasses.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any session card below to view its student check-in timestamps, attendance statuses, and verification roster.
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
                const attendanceRate = totalCohort > 0 ? Math.round((totalPresentAttended / totalCohort) * 100) : 0;

                return (
                  <div
                    key={lc.id}
                    onClick={() => {
                      setSelectedSessionId(lc.id);
                      setActiveTab("roster");
                    }}
                    className={`p-5 rounded-3xl border text-left transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
                      isSelected
                        ? "bg-white border-[#7C248C] shadow-md ring-2 ring-purple-100"
                        : "bg-white border-slate-200/80 hover:border-purple-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Left: Session Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          lc.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : lc.status === "LIVE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                            : "bg-purple-50 text-[#7C248C] border border-purple-200"
                        }`}
                      >
                        <Video className="w-6 h-6" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-sm tracking-tight truncate">{lc.title}</h3>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono border ${
                              lc.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : lc.status === "LIVE"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-purple-50 text-purple-800 border-purple-200"
                            }`}
                          >
                            {lc.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-[#7C248C]" />
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
                      {/* Attendance % Box */}
                      <div className="p-2.5 px-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-emerald-700 font-bold block uppercase">Attendance %</span>
                          <strong className="text-emerald-900 text-sm font-black">{attendanceRate}%</strong>
                        </div>
                      </div>

                      {/* Present Box (includes On-time, Late, Excused) */}
                      <div className="p-2.5 px-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-center gap-2 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-[#7C248C] font-bold block uppercase">Present / Attended</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-purple-900 text-sm font-black">{totalPresentAttended}</strong>
                            <span className="text-[10px] text-purple-700 font-normal">
                              ({onTimeCount} on-time{lateCount > 0 ? `, ${lateCount} late` : ""}{excusedCount > 0 ? `, ${excusedCount} excused` : ""})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Absent Box */}
                      <div className="p-2.5 px-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-rose-700 font-bold block uppercase">Absent</span>
                          <strong className="text-rose-900 text-sm font-black">{absentCount}</strong>
                        </div>
                      </div>

                      {/* Active Indicator Button */}
                      <div
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isSelected
                            ? "jvm-gradient-bg jvm-gradient-hover text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Inspect Roster →
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
      )}

      {/* TAB 2: DETAILED ATTENDANCE ROSTER & FILTERS FOR SELECTED SESSION */}
      {activeTab === "roster" && (
        <div className="animate-in fade-in space-y-6">
          {selectedSession ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs space-y-6 p-6 sm:p-8">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedSession.title}
                    </h2>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono ${
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

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("sessions")}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                  >
                    Switch Session
                  </button>
                  <Link
                    href={`/trainer/live-classes/${selectedSession.id}`}
                    className="inline-flex items-center gap-2 text-xs font-bold jvm-gradient-bg jvm-gradient-hover text-white px-4 py-2 rounded-xl transition shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Full Session Cockpit
                  </Link>
                </div>
              </div>

              {/* Quick Metrics Bar for Selected Session */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 uppercase font-mono">Attended</span>
                  <span className="text-lg font-black text-[#7C248C]">{sessionPresentCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase font-mono">Turnout %</span>
                  <span className="text-lg font-black text-emerald-700">{sessionAttendancePct}%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-900 uppercase font-mono">Absent</span>
                  <span className="text-lg font-black text-rose-700">{sessionAbsentCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase font-mono">Verified</span>
                  <span className="text-lg font-black text-indigo-700">{sessionVerifiedCount}</span>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7C248C] transition bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {(["ALL", "PRESENT", "LATE", "ABSENT", "EXCUSED"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        statusFilter === filter
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter === "ALL" ? "All Students" : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Table */}
              {filteredRoster.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="p-4 font-bold">Student</th>
                        <th className="p-4 font-bold">Join Click Time</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold">Verification</th>
                        <th className="p-4 font-bold">Excuse / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {filteredRoster.map((row) => (
                        <tr key={row.student.id} className="hover:bg-purple-50/20 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7C248C] font-black flex items-center justify-center text-xs shrink-0">
                                {row.student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{row.student.name}</div>
                                <div className="text-[11px] font-mono text-slate-400">{row.student.email}</div>
                              </div>
                            </div>
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
                            {row.excuseReason ? (
                              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 space-y-1 max-w-xs">
                                <span className="font-bold block text-[10px] text-blue-700 uppercase font-mono">Reason:</span>
                                <p className="line-clamp-2">{row.excuseReason}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">—</span>
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
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-4">
              <CheckSquare className="w-10 h-10 mx-auto text-slate-400" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Session Selected</h3>
                <p className="text-xs text-slate-500">
                  Select a live class session from the sessions tab to review its check-in records.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("sessions")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold jvm-gradient-bg jvm-gradient-hover text-white shadow-xs cursor-pointer"
              >
                Go to Sessions Tab →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COHORT STUDENTS */}
      {activeTab === "students" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1E2B88]" /> Cohort Enrolled Students ({batch.students.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All registered learners enrolled in {batch.name} whose roll-call attendance is monitored during live meets.
              </p>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 text-[#1E2B88] border border-indigo-200">
              {batch.course.title}
            </span>
          </div>

          {batch.students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batch.students.map((bs) => (
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
    </div>
  );
}
