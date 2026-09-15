"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  ChevronRight,
  Eye,
  X,
  ExternalLink,
  BookOpen,
  Sparkles,
  Percent,
  SlidersHorizontal,
  UserCheck,
  TrendingUp,
  Award,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentAttendanceRecord {
  id: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  recordedAt: string;
  joinClickTime?: string | null;
  leftTime?: string | null;
  excuseReason?: string | null;
  liveClass: {
    id: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    trainerName: string;
    batchName: string;
    courseTitle: string;
  };
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
  profile?: {
    avatarUrl?: string | null;
    phone?: string | null;
    designation?: string | null;
  } | null;
  studentBatches: Array<{
    batchId: string;
    batchName: string;
    courseTitle: string;
  }>;
  enrollments: Array<{
    courseId: string;
    courseTitle: string;
    batchName?: string | null;
  }>;
  attendances: StudentAttendanceRecord[];
  stats: {
    totalSessions: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    rate: number;
  };
}

interface PlatformStats {
  totalStudents: number;
  totalAuditedChecks: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  platformRate: number;
}

interface CourseOption {
  id: string;
  title: string;
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
}

export default function AdminAttendanceClient({
  initialStudents,
  courses,
  batches,
  platformStats,
}: {
  initialStudents: StudentItem[];
  courses: CourseOption[];
  batches: BatchOption[];
  platformStats: PlatformStats;
}) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [performanceFilter, setPerformanceFilter] = useState<"ALL" | "EXCELLENT" | "AVERAGE" | "LOW">("ALL");

  // Selected student for detailed modal/drawer
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalStatusFilter, setModalStatusFilter] = useState("ALL");

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        st.name.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q) ||
        st.studentBatches.some((b) => b.batchName.toLowerCase().includes(q)) ||
        st.enrollments.some((e) => e.courseTitle.toLowerCase().includes(q));

      const matchesBatch =
        selectedBatch === "ALL" || st.studentBatches.some((b) => b.batchId === selectedBatch);

      const matchesCourse =
        selectedCourse === "ALL" || st.enrollments.some((e) => e.courseId === selectedCourse);

      let matchesPerformance = true;
      if (performanceFilter === "EXCELLENT") {
        matchesPerformance = st.stats.rate >= 80;
      } else if (performanceFilter === "AVERAGE") {
        matchesPerformance = st.stats.rate >= 50 && st.stats.rate < 80;
      } else if (performanceFilter === "LOW") {
        matchesPerformance = st.stats.totalSessions > 0 && st.stats.rate < 50;
      }

      return matchesSearch && matchesBatch && matchesCourse && matchesPerformance;
    });
  }, [students, searchQuery, selectedBatch, selectedCourse, performanceFilter]);

  // Filter attendances in the student modal
  const modalFilteredAttendances = useMemo(() => {
    if (!selectedStudent) return [];
    return selectedStudent.attendances.filter((att) => {
      const q = modalSearch.toLowerCase();
      const matchesSearch =
        att.liveClass.title.toLowerCase().includes(q) ||
        att.liveClass.trainerName.toLowerCase().includes(q) ||
        att.liveClass.batchName.toLowerCase().includes(q);

      const matchesStatus = modalStatusFilter === "ALL" || att.status === modalStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [selectedStudent, modalSearch, modalStatusFilter]);

  const getStatusBadge = (status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Present
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Late
          </span>
        );
      case "EXCUSED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Excused
          </span>
        );
      case "ABSENT":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3 h-3 text-rose-600" /> Absent
          </span>
        );
    }
  };

  const getRateBadge = (rate: number, totalSessions: number) => {
    if (totalSessions === 0) {
      return (
        <span className="text-[11px] font-mono text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100">
          No Sessions
        </span>
      );
    }
    if (rate >= 80) {
      return (
        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          {rate}% High
        </span>
      );
    }
    if (rate >= 50) {
      return (
        <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          {rate}% Moderate
        </span>
      );
    }
    return (
      <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
        {rate}% Low
      </span>
    );
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. Header Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7C248C]" /> Student Attendance & Compliance Matrix
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-[#7C248C]" /> Attendance Records 📋
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Monitor real-time student attendance across all live classes and cohorts. Select any student to inspect their detailed attendance history, timestamps, and participation ratios.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            href="/admin/batches"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4 text-[#7C248C]" /> View All Cohorts
          </Link>
        </div>
      </div>

      {/* 2. Platform Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" /> Total Students
          </div>
          <div className="text-2xl font-black text-slate-900">{platformStats.totalStudents}</div>
          <div className="text-[11px] font-mono text-purple-700 font-semibold">{batches.length} Cohorts Active</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-emerald-600" /> Average Rate
          </div>
          <div className="text-2xl font-black text-emerald-600">{platformStats.platformRate.toFixed(1)}%</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">Institutional Compliance</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present Checks
          </div>
          <div className="text-2xl font-black text-slate-900">{platformStats.presentCount}</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">On-Time Sessions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Late Arrivals
          </div>
          <div className="text-2xl font-black text-amber-600">{platformStats.lateCount}</div>
          <div className="text-[11px] font-mono text-amber-700 font-semibold">Joined Post Cutoff</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Absent Sessions
          </div>
          <div className="text-2xl font-black text-rose-600">{platformStats.absentCount}</div>
          <div className="text-[11px] font-mono text-rose-700 font-semibold">
            {platformStats.excusedCount} Excused Leaves
          </div>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student by name, email, cohort..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C]"
            >
              <option value="ALL">All Cohorts / Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C]"
            >
              <option value="ALL">All Course Programs</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C]"
            >
              <option value="ALL">All Attendance Tiers</option>
              <option value="EXCELLENT">High (≥ 80%)</option>
              <option value="AVERAGE">Moderate (50% – 79%)</option>
              <option value="LOW">Low (&lt; 50%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Student Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Cohort / Program</th>
                  <th className="p-4 text-center">Sessions Logged</th>
                  <th className="p-4 text-center">Attendance Breakdown</th>
                  <th className="p-4 text-center">Compliance Rate</th>
                  <th className="p-4 text-right">Attendance Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    onClick={() => {
                      setSelectedStudent(st);
                      setModalSearch("");
                      setModalStatusFilter("ALL");
                    }}
                    className="hover:bg-purple-50/40 cursor-pointer transition group"
                  >
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {st.profile?.avatarUrl ? (
                          <img
                            src={st.profile.avatarUrl}
                            alt={st.name}
                            className="w-9 h-9 rounded-2xl object-cover border border-purple-100 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-2xl bg-[#7C248C] text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {st.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-[#7C248C] transition">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Batch / Cohort */}
                    <td className="p-4">
                      {st.studentBatches.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 text-xs">
                            {st.studentBatches[0].batchName}
                          </div>
                          <div className="text-[10px] text-[#7C248C] font-mono">
                            {st.studentBatches[0].courseTitle}
                          </div>
                        </div>
                      ) : st.enrollments.length > 0 ? (
                        <div className="text-xs text-slate-600">{st.enrollments[0].courseTitle}</div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* Sessions Logged */}
                    <td className="p-4 text-center font-bold text-slate-900 text-sm">
                      {st.stats.totalSessions}
                    </td>

                    {/* Status Breakdown Pills */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px]"
                          title="Present"
                        >
                          P: {st.stats.presentCount}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono font-bold text-[10px]"
                          title="Late"
                        >
                          L: {st.stats.lateCount}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono font-bold text-[10px]"
                          title="Absent"
                        >
                          A: {st.stats.absentCount}
                        </span>
                        {st.stats.excusedCount > 0 && (
                          <span
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] font-mono font-bold text-[10px]"
                            title="Excused"
                          >
                            E: {st.stats.excusedCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Compliance Rate Badge */}
                    <td className="p-4 text-center">
                      {getRateBadge(st.stats.rate, st.stats.totalSessions)}
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(st);
                          setModalSearch("");
                          setModalStatusFilter("ALL");
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 group-hover:border-purple-300 text-[#7C248C] font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Records
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-900">No students match current filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try modifying your search keywords or adjusting the cohort and attendance tier filters.
            </p>
          </div>
        )}
      </div>

      {/* 5. Detailed Student Attendance Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/20 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {selectedStudent.profile?.avatarUrl ? (
                  <img
                    src={selectedStudent.profile.avatarUrl}
                    alt={selectedStudent.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-purple-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[#7C248C] text-white font-bold flex items-center justify-center text-base shadow-2xs">
                    {selectedStudent.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-lg">{selectedStudent.name}</h3>
                    {getRateBadge(selectedStudent.stats.rate, selectedStudent.stats.totalSessions)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedStudent.email}</div>
                  {selectedStudent.studentBatches.length > 0 && (
                    <div className="text-[11px] font-semibold text-[#7C248C] mt-1">
                      {selectedStudent.studentBatches[0].batchName} •{" "}
                      {selectedStudent.studentBatches[0].courseTitle}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Mini KPI Bar */}
            <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                <div className="text-lg font-black text-slate-900">{selectedStudent.stats.totalSessions}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-emerald-600">Present</div>
                <div className="text-lg font-black text-emerald-600">{selectedStudent.stats.presentCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-amber-600">Late</div>
                <div className="text-lg font-black text-amber-600">{selectedStudent.stats.lateCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-rose-600">Absent</div>
                <div className="text-lg font-black text-rose-600">{selectedStudent.stats.absentCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-[#7C248C]">Excused</div>
                <div className="text-lg font-black text-[#7C248C]">{selectedStudent.stats.excusedCount}</div>
              </div>
            </div>

            {/* Modal Filter Bar */}
            <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by session title, trainer..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <select
                  value={modalStatusFilter}
                  onChange={(e) => setModalStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C] w-full sm:w-auto"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>
            </div>

            {/* Modal Attendance Records List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {modalFilteredAttendances.length > 0 ? (
                <div className="space-y-2.5">
                  {modalFilteredAttendances.map((att) => (
                    <div
                      key={att.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-200 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{att.liveClass.title}</h4>
                          {getStatusBadge(att.status)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3 flex-wrap">
                          <span>Faculty: {att.liveClass.trainerName}</span>
                          <span>•</span>
                          <span>Cohort: {att.liveClass.batchName}</span>
                          <span>•</span>
                          <span>Date: {formatDate(att.liveClass.scheduledDate)}</span>
                        </div>
                        {att.excuseReason && (
                          <div className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-1 font-sans">
                            Reason: {att.excuseReason}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 font-mono">Timestamp</div>
                        <div className="text-xs font-mono font-semibold text-slate-700">
                          {att.joinClickTime
                            ? formatDate(att.joinClickTime, { includeTime: true })
                            : formatDate(att.recordedAt, { includeTime: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs">No attendance logs found matching filter criteria.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <Link
                href={`/admin/students/${selectedStudent.id}`}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs inline-flex items-center gap-1.5 transition"
              >
                View Full Student Profile <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
