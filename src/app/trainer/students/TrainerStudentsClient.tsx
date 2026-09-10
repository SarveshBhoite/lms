"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  CheckSquare,
  HelpCircle,
  FileCheck,
  Sparkles,
  Layers,
  GraduationCap,
  Filter,
  TrendingUp,
  Award,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string | Date;
  profile?: { avatarUrl?: string | null; phone?: string | null; designation?: string | null } | null;
  enrollments: {
    course: { title: string };
    batch?: { name: string } | null;
    status: string;
  }[];
  studentBatches: {
    batch: { name: string };
  }[];
  courseProgresses: {
    progressPercent: number;
  }[];
  quizAttempts: { score: number }[];
  assignmentSubmissions: {
    feedback?: { marksAwarded: number } | null;
    assignment: { totalMarks: number };
  }[];
  attendances: { status: string }[];
}

export interface FilterOption {
  id: string;
  title?: string;
  name?: string;
}

export default function TrainerStudentsClient({
  initialStudents,
  courses,
  batches,
}: {
  initialStudents: StudentListItem[];
  courses: FilterOption[];
  batches: FilterOption[];
}) {
  const [students, setStudents] = useState<StudentListItem[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Computed Metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.isActive).length;

  const avgAttendance = useMemo(() => {
    let totalLogs = 0;
    let presentLogs = 0;
    students.forEach((s) => {
      s.attendances.forEach((a) => {
        totalLogs++;
        if (a.status === "PRESENT" || a.status === "LATE") {
          presentLogs++;
        }
      });
    });
    return totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;
  }, [students]);

  const avgQuizScore = useMemo(() => {
    let totalScore = 0;
    let totalAttempts = 0;
    students.forEach((s) => {
      s.quizAttempts.forEach((q) => {
        totalScore += q.score;
        totalAttempts++;
      });
    });
    return totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  }, [students]);

  const avgAssignmentScore = useMemo(() => {
    let totalPct = 0;
    let evaluatedCount = 0;
    students.forEach((s) => {
      s.assignmentSubmissions.forEach((sub) => {
        if (sub.feedback && sub.assignment.totalMarks) {
          totalPct += (sub.feedback.marksAwarded / sub.assignment.totalMarks) * 100;
          evaluatedCount++;
        }
      });
    });
    return evaluatedCount > 0 ? Math.round(totalPct / evaluatedCount) : 0;
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.profile?.phone && s.profile.phone.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "ALL" || (statusFilter === "ACTIVE" ? s.isActive : !s.isActive);

      const matchCourse =
        selectedCourse === "ALL" ||
        s.enrollments.some((e) => e.course.title === selectedCourse);

      const matchBatch =
        selectedBatch === "ALL" ||
        s.studentBatches.some((sb) => sb.batch.name === selectedBatch) ||
        s.enrollments.some((e) => e.batch?.name === selectedBatch);

      return matchSearch && matchStatus && matchCourse && matchBatch;
    });
  }, [students, searchQuery, statusFilter, selectedCourse, selectedBatch]);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Intelligence & Learner Scope
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Enrolled Students Directory 👥
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Track student milestones, verified attendance, quiz performances, assignment evaluations, and faculty private notes.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Link
            href="/trainer/batches"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#7C248C]" /> Cohorts Roster
          </Link>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-600 text-[11px] font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Account Controls Admin-Only
          </div>
        </div>
      </div>

      {/* 2. Top KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1E2B88]" /> Total Students
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Assigned</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Active Learners
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{activeStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">In Scope</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-cyan-600" /> Avg Attendance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{avgAttendance}%</span>
            <span className="text-[11px] font-mono text-slate-400">Verified</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#7C248C]" /> Quiz Average
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{avgQuizScore}%</span>
            <span className="text-[11px] font-mono text-slate-400">Score</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#E01E6A]" /> Assignment Avg
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#E01E6A]">{avgAssignmentScore}%</span>
            <span className="text-[11px] font-mono text-slate-400">Marks</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
          />
        </div>

        {/* Course Filter Dropdown */}
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
        >
          <option value="ALL">All Assigned Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.title}>
              {c.title}
            </option>
          ))}
        </select>

        {/* Batch Filter Dropdown */}
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
        >
          <option value="ALL">All Assigned Cohorts</option>
          {batches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Account Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
        >
          <option value="ALL">All Account Statuses</option>
          <option value="ACTIVE">Active Students</option>
          <option value="INACTIVE">Inactive Students</option>
        </select>
      </div>

      {/* 4. Enhanced Students Directory Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const prog = student.courseProgresses[0];
            const progressPercent = prog ? prog.progressPercent : 0;

            const totalAtt = student.attendances.length;
            const presentAtt = student.attendances.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length;
            const attendancePercent = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0;

            const quizAvg =
              student.quizAttempts.length > 0
                ? student.quizAttempts.reduce((acc, q) => acc + q.score, 0) / student.quizAttempts.length
                : 0;

            const evaluatedSubs = student.assignmentSubmissions.filter((sub) => sub.feedback);
            const assignmentAvg =
              evaluatedSubs.length > 0
                ? evaluatedSubs.reduce(
                    (acc, sub) =>
                      acc +
                      ((sub.feedback?.marksAwarded || 0) / (sub.assignment.totalMarks || 100)) * 100,
                    0
                  ) / evaluatedSubs.length
                : 0;

            // Resolve Batch Name from studentBatches or enrollment batch
            const batchNames = Array.from(
              new Set([
                ...student.studentBatches.map((b) => b.batch.name),
                ...student.enrollments.map((e) => e.batch?.name).filter(Boolean) as string[],
              ])
            );

            return (
              <div
                key={student.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md hover:border-purple-200 transition group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        student.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {student.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Joined: {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {student.profile?.avatarUrl ? (
                      <img
                        src={student.profile.avatarUrl}
                        alt={student.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E2B88] to-[#7C248C] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                        {student.name.charAt(0)}
                      </div>
                    )}

                    <div className="overflow-hidden min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-[#7C248C] transition">
                        {student.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </p>
                      {student.profile?.phone && (
                        <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{student.profile.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs font-mono">
                    <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                      <span>Course:</span>
                      <span className="text-slate-900 font-bold truncate max-w-[180px]">
                        {student.enrollments.map((e) => e.course.title).join(", ") || "No Enrollment"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                      <span>Cohort:</span>
                      <span className="text-[#7C248C] font-bold truncate max-w-[180px]">
                        {batchNames.join(", ") || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* 4 Academic KPI Badges */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">PROGRESS</span>
                      <strong className="text-slate-900 font-bold">{progressPercent.toFixed(1)}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">ATTENDANCE</span>
                      <strong className="text-emerald-700 font-bold">{attendancePercent.toFixed(1)}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">QUIZ AVG</span>
                      <strong className="text-[#7C248C] font-bold">{quizAvg.toFixed(1)}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">ASSIGNMENTS</span>
                      <strong className="text-[#E01E6A] font-bold">{assignmentAvg.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href={`/trainer/students/${student.id}`}
                    className="w-full py-2.5 px-3 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm hover:shadow-md"
                  >
                    <span>Full Academic Profile & Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3 shadow-xs">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No students found matching your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, course filter, or assigned batch selection.
          </p>
        </div>
      )}
    </div>
  );
}
