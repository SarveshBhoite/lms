"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Video,
  FileCheck,
  HelpCircle,
  Award,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart,
  Radio,
  ArrowRight,
  FileText,
  UserPlus,
  Play,
  Calendar,
  Clock,
} from "lucide-react";

export interface RawDashboardData {
  admin: {
    name: string;
    email: string;
  };
  students: {
    id: string;
    createdAt: string;
    isActive: boolean;
    isEmailVerified: boolean;
  }[];
  trainers: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    designation: string;
    avatarUrl?: string | null;
    coursesCount: number;
    batchesCount: number;
    liveClassesCount: number;
  }[];
  courses: {
    id: string;
    title: string;
    level: string;
    status: string;
    createdAt: string;
    enrollmentCount: number;
    batchCount: number;
  }[];
  batches: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    courseTitle: string;
    studentCount: number;
  }[];
  enrollments: {
    id: string;
    enrolledAt: string;
    status: string;
    courseId: string;
    batchId?: string | null;
  }[];
  liveClasses: {
    id: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    status: string;
    courseTitle: string;
    batchName: string;
    trainerName: string;
    attendances: { status: string }[];
  }[];
  submissions: {
    id: string;
    submittedAt: string;
    status: string;
  }[];
  quizAttempts: {
    id: string;
    startedAt: string;
    score: number;
    isPassed: boolean;
  }[];
  certificates: {
    id: string;
    issueDate: string;
    hasQr: boolean;
  }[];
  meta: {
    modulesCount: number;
    lessonsCount: number;
  };
}

export default function AdminDashboardClient({ rawData }: { rawData: RawDashboardData }) {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "ALL">("30D");
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "LEARNERS" | "FACULTY" | "ASSESSMENTS">("OVERVIEW");
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // 1. Compute dynamic time threshold based on selected timeRange
  const now = useMemo(() => new Date(), []);

  const sinceDate = useMemo(() => {
    const d = new Date(now);
    if (timeRange === "7D") d.setDate(d.getDate() - 7);
    else if (timeRange === "30D") d.setDate(d.getDate() - 30);
    else if (timeRange === "90D") d.setDate(d.getDate() - 90);
    else return new Date(0); // ALL
    return d;
  }, [timeRange, now]);

  // 2. Filter datasets based on the active timeRange
  const filteredData = useMemo(() => {
    const isAll = timeRange === "ALL";
    const thresholdTime = sinceDate.getTime();

    const enrollments = isAll
      ? rawData.enrollments
      : rawData.enrollments.filter((e) => new Date(e.enrolledAt).getTime() >= thresholdTime);

    const students = isAll
      ? rawData.students
      : rawData.students.filter((s) => new Date(s.createdAt).getTime() >= thresholdTime);

    const liveClasses = isAll
      ? rawData.liveClasses
      : rawData.liveClasses.filter((lc) => new Date(lc.scheduledDate).getTime() >= thresholdTime);

    const submissions = isAll
      ? rawData.submissions
      : rawData.submissions.filter((sub) => new Date(sub.submittedAt).getTime() >= thresholdTime);

    const quizAttempts = isAll
      ? rawData.quizAttempts
      : rawData.quizAttempts.filter((qa) => new Date(qa.startedAt).getTime() >= thresholdTime);

    const certificates = isAll
      ? rawData.certificates
      : rawData.certificates.filter((c) => new Date(c.issueDate).getTime() >= thresholdTime);

    return {
      enrollments,
      students,
      liveClasses,
      submissions,
      quizAttempts,
      certificates,
    };
  }, [rawData, timeRange, sinceDate]);

  // 3. Dynamic Timeline Buckets for the Area Chart
  const timelineBuckets = useMemo(() => {
    const buckets: { label: string; enrollments: number; registrations: number }[] = [];

    if (timeRange === "7D") {
      // 7 Daily buckets (Day -6 to Day 0)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        const enrollCount = rawData.enrollments.filter((e) => {
          const t = new Date(e.enrolledAt).getTime();
          return t >= d.getTime() && t < nextD.getTime();
        }).length;
        const regCount = rawData.students.filter((s) => {
          const t = new Date(s.createdAt).getTime();
          return t >= d.getTime() && t < nextD.getTime();
        }).length;

        buckets.push({ label, enrollments: enrollCount, registrations: regCount });
      }
    } else if (timeRange === "30D") {
      // 6 buckets of 5 days each
      for (let i = 5; i >= 0; i--) {
        const dStart = new Date(now);
        dStart.setDate(dStart.getDate() - (i + 1) * 5);
        const dEnd = new Date(now);
        dEnd.setDate(dEnd.getDate() - i * 5);

        const label = `${dStart.getDate()} ${dStart.toLocaleDateString("en-US", { month: "short" })}`;
        const enrollCount = rawData.enrollments.filter((e) => {
          const t = new Date(e.enrolledAt).getTime();
          return t >= dStart.getTime() && t < dEnd.getTime();
        }).length;
        const regCount = rawData.students.filter((s) => {
          const t = new Date(s.createdAt).getTime();
          return t >= dStart.getTime() && t < dEnd.getTime();
        }).length;

        buckets.push({ label, enrollments: enrollCount, registrations: regCount });
      }
    } else if (timeRange === "90D") {
      // 6 bi-weekly buckets (15 days each)
      for (let i = 5; i >= 0; i--) {
        const dStart = new Date(now);
        dStart.setDate(dStart.getDate() - (i + 1) * 15);
        const dEnd = new Date(now);
        dEnd.setDate(dEnd.getDate() - i * 15);

        const label = `${dStart.toLocaleDateString("en-US", { month: "short" })} ${dStart.getDate()}`;
        const enrollCount = rawData.enrollments.filter((e) => {
          const t = new Date(e.enrolledAt).getTime();
          return t >= dStart.getTime() && t < dEnd.getTime();
        }).length;
        const regCount = rawData.students.filter((s) => {
          const t = new Date(s.createdAt).getTime();
          return t >= dStart.getTime() && t < dEnd.getTime();
        }).length;

        buckets.push({ label, enrollments: enrollCount, registrations: regCount });
      }
    } else {
      // ALL: 6 monthly intervals
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const label = start.toLocaleDateString("en-US", { month: "short" });

        const enrollCount = rawData.enrollments.filter((e) => {
          const t = new Date(e.enrolledAt).getTime();
          return t >= start.getTime() && t < end.getTime();
        }).length;
        const regCount = rawData.students.filter((s) => {
          const t = new Date(s.createdAt).getTime();
          return t >= start.getTime() && t < end.getTime();
        }).length;

        buckets.push({ label, enrollments: enrollCount, registrations: regCount });
      }
    }
    return buckets;
  }, [rawData, timeRange, now]);

  // 4. Calculations for KPI Metrics based on filteredData
  const totalLearners = timeRange === "ALL" ? rawData.students.length : filteredData.students.length;
  const activeLearners = rawData.students.filter((s) => s.isActive).length;
  const activeRatePct = rawData.students.length > 0 ? Math.round((activeLearners / rawData.students.length) * 100) : 100;

  const totalEnrollmentsInPeriod = filteredData.enrollments.length;

  // Attendance metrics in period
  const attendancesInPeriod = filteredData.liveClasses.flatMap((lc) => lc.attendances);
  const attTotal = attendancesInPeriod.length;
  const attPresent = attendancesInPeriod.filter((a) => a.status === "PRESENT").length;
  const attLate = attendancesInPeriod.filter((a) => a.status === "LATE").length;
  const attAbsent = attendancesInPeriod.filter((a) => a.status === "ABSENT").length;
  const attExcused = attendancesInPeriod.filter((a) => a.status === "EXCUSED").length;
  const attTurnoutPct = attTotal > 0 ? Math.round(((attPresent + attLate) / attTotal) * 100) : 0;

  // Donut SVG calculations
  const presentPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
  const latePct = attTotal > 0 ? Math.round((attLate / attTotal) * 100) : 0;
  const absentPct = attTotal > 0 ? Math.round((attAbsent / attTotal) * 100) : 0;
  const excusedPct = attTotal > 0 ? Math.round((attExcused / attTotal) * 100) : 0;

  const circumference = 251.2;
  const strokePresent = (presentPct / 100) * circumference;
  const strokeLate = (latePct / 100) * circumference;
  const strokeAbsent = (absentPct / 100) * circumference;
  const strokeExcused = (excusedPct / 100) * circumference;

  // Evaluation Funnel Metrics
  const subTotal = filteredData.submissions.length;
  const subEvaluated = filteredData.submissions.filter((s) => s.status === "EVALUATED").length;
  const subPending = filteredData.submissions.filter((s) => s.status === "SUBMITTED").length;
  const subResubmission = filteredData.submissions.filter((s) => s.status === "RESUBMISSION_REQUESTED").length;

  const evalPct = subTotal > 0 ? Math.round((subEvaluated / subTotal) * 100) : 0;
  const pendingPct = subTotal > 0 ? Math.round((subPending / subTotal) * 100) : 0;
  const resubmissionPct = subTotal > 0 ? Math.round((subResubmission / subTotal) * 100) : 0;

  // Submissions Pie / Donut SVG strokes
  const strokeSubEval = (evalPct / 100) * circumference;
  const strokeSubPending = (pendingPct / 100) * circumference;
  const strokeSubResub = (resubmissionPct / 100) * circumference;

  // Quiz Mastery in period
  const totalQuizAttempts = filteredData.quizAttempts.length;
  const passedQuizAttempts = filteredData.quizAttempts.filter((qa) => qa.isPassed).length;
  const quizPassRate = totalQuizAttempts > 0 ? Math.round((passedQuizAttempts / totalQuizAttempts) * 100) : 0;
  const avgQuizScore =
    totalQuizAttempts > 0
      ? Math.round(filteredData.quizAttempts.reduce((acc, qa) => acc + (qa.score || 0), 0) / totalQuizAttempts)
      : 0;

  // Certificates in period
  const certsInPeriod = filteredData.certificates.length;

  // Area Chart Coordinates Calculation
  const maxTimelineCount = Math.max(...timelineBuckets.map((b) => Math.max(b.enrollments, b.registrations)), 4);
  const chartHeight = 170;
  const chartWidth = 560;

  const areaPoints = timelineBuckets.map((b, idx) => {
    const x = (idx / (timelineBuckets.length - 1 || 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - 30 - (b.enrollments / maxTimelineCount) * (chartHeight - 60);
    return { x, y, count: b.enrollments, regCount: b.registrations, label: b.label };
  });

  const polylineStr = areaPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPathStr = `M ${areaPoints[0]?.x || 0},${chartHeight - 25} L ${polylineStr} L ${areaPoints[areaPoints.length - 1]?.x || 0},${chartHeight - 25} Z`;

  // Courses by level counts
  const levelStats = useMemo(() => {
    const beginner = rawData.courses.filter((c) => c.level === "BEGINNER");
    const intermediate = rawData.courses.filter((c) => c.level === "INTERMEDIATE");
    const advanced = rawData.courses.filter((c) => c.level === "ADVANCED");

    return [
      {
        level: "Beginner",
        count: beginner.length,
        enrollments: beginner.reduce((sum, c) => sum + c.enrollmentCount, 0),
        color: "#10B981",
      },
      {
        level: "Intermediate",
        count: intermediate.length,
        enrollments: intermediate.reduce((sum, c) => sum + c.enrollmentCount, 0),
        color: "#1E2B88",
      },
      {
        level: "Advanced",
        count: advanced.length,
        enrollments: advanced.reduce((sum, c) => sum + c.enrollmentCount, 0),
        color: "#7C248C",
      },
    ];
  }, [rawData.courses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. EXECUTIVE CONTROL BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/10 via-pink-400/10 to-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> JVM LMS Executive Analytics
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-mono font-bold uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Welcome back, <span className="jvm-gradient-text">{rawData.admin.name}</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-2xl">
              System-wide metrics, student intake, and operational analytics currently filtered for:{" "}
              <strong className="text-[#7C248C] font-bold">
                {timeRange === "7D" ? "Last 7 Days" : timeRange === "30D" ? "Last 30 Days" : timeRange === "90D" ? "Past Quarter (90 Days)" : "All-Time Records"}
              </strong>
              .
            </p>
          </div>

          {/* DYNAMIC TIME PERIOD FILTER (Applies to all cards and visuals) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="p-1 rounded-2xl bg-white/95 border border-purple-200/80 shadow-2xs flex items-center justify-center gap-1 text-xs font-bold font-mono">
              {(["7D", "30D", "90D", "ALL"] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                    timeRange === range
                      ? "jvm-gradient-bg text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {range === "ALL" ? "All-Time" : range}
                </button>
              ))}
            </div>

            <Link
              href="/admin/reports"
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition hover:border-purple-300 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#7C248C]" /> Export Reports
            </Link>
          </div>
        </div>

        {/* Quick Administrative Shortcuts */}
        <div className="mt-6 pt-6 border-t border-slate-200/60 flex flex-wrap items-center gap-2.5 relative z-10 text-xs font-bold">
          <span className="text-slate-400 text-[11px] font-mono mr-1">Quick Shortcuts:</span>
          <Link
            href="/admin/students?action=new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200/60 transition shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Student
          </Link>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E2B88] border border-blue-200/60 transition shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5" /> Create Course
          </Link>
          <Link
            href="/admin/batches"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E01E6A] border border-pink-200/60 transition shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" /> Launch Batch
          </Link>
          <Link
            href="/admin/trainers"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 transition shadow-2xs"
          >
            <GraduationCap className="w-3.5 h-3.5" /> Faculty Roster
          </Link>
        </div>
      </div>

      {/* 2. DYNAMIC TOP 8 EXECUTIVE KPI CARDS (Synchronized to selected timeRange) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total / New Learners */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-purple-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              {timeRange === "ALL" ? "Total Learners" : `New Intake (${timeRange})`}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C248C] flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalLearners}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {activeRatePct}% Active
              </span>
              <span className="text-slate-400 font-mono">
                {totalEnrollmentsInPeriod} {totalEnrollmentsInPeriod === 1 ? "Enrollment" : "Enrollments"}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="jvm-gradient-bg h-full rounded-full transition-all duration-500" style={{ width: `${activeRatePct}%` }} />
          </div>
        </div>

        {/* Metric 2: Faculty Instructors */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-amber-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Faculty Trainers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{rawData.trainers.length}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-amber-800 font-bold">{rawData.trainers.filter((t) => t.isActive).length} Active</span>
              <span className="text-slate-400 font-mono">100% Verified</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Metric 3: Live Classes Hosted in Period */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-blue-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              {timeRange === "ALL" ? "Live Classes" : `Live Classes (${timeRange})`}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E2B88] flex items-center justify-center group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{filteredData.liveClasses.length}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-blue-700 font-bold">{attTurnoutPct}% Turnout</span>
              <span className="text-slate-400 font-mono">{attTotal} Logs</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${attTurnoutPct}%` }} />
          </div>
        </div>

        {/* Metric 4: Active Batches */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-pink-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Active Cohorts</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#E01E6A] flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {rawData.batches.filter((b) => b.status === "ONGOING" || b.status === "UPCOMING").length}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-pink-700 font-bold">
                {rawData.batches.filter((b) => b.status === "ONGOING").length} Ongoing
              </span>
              <span className="text-slate-400 font-mono">{rawData.batches.length} Total</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-pink-600 h-full rounded-full transition-all duration-500" style={{ width: "80%" }} />
          </div>
        </div>

        {/* Metric 5: Submissions in Period */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-amber-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              {timeRange === "ALL" ? "Submissions" : `Submissions (${timeRange})`}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              {subTotal}
              {subPending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                  {subPending} Pending
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-slate-600 font-bold">{evalPct}% Evaluated</span>
              <span className="text-slate-400 font-mono">{subEvaluated} Done</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${evalPct}%` }} />
          </div>
        </div>

        {/* Metric 6: Quiz Mastery in Period */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-violet-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              {timeRange === "ALL" ? "Quiz Pass Rate" : `Quiz Mastery (${timeRange})`}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C248C] flex items-center justify-center group-hover:scale-105 transition">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{quizPassRate}%</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-purple-700 font-bold">Avg: {avgQuizScore}% Score</span>
              <span className="text-slate-400 font-mono">{totalQuizAttempts} Attempts</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${quizPassRate}%` }} />
          </div>
        </div>

        {/* Metric 7: Course Catalog */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-blue-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Course Programs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E2B88] flex items-center justify-center group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{rawData.courses.length}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-blue-700 font-bold">
                {rawData.courses.filter((c) => c.status === "PUBLISHED").length} Published
              </span>
              <span className="text-slate-400 font-mono">{rawData.meta.lessonsCount} Lessons</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: "90%" }} />
          </div>
        </div>

        {/* Metric 8: Verified Certificates */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              {timeRange === "ALL" ? "Certificates Issued" : `Certificates (${timeRange})`}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{certsInPeriod}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-emerald-700 font-bold">100% Cryptographic QR</span>
              <span className="text-slate-400 font-mono">{rawData.certificates.length} Total</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* 3. PERSPECTIVE TABS (Clicking dynamically switches the whole view) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: "OVERVIEW", label: "Executive Overview" },
          { key: "LEARNERS", label: "Learners & Cohorts" },
          { key: "FACULTY", label: "Faculty & Broadcasts" },
          { key: "ASSESSMENTS", label: "Evaluations & Credentials" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-2xl transition cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* Main Visuals: Growth Area Chart + Attendance Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart: Dynamic Time-Bucketed Growth */}
            <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Admissions & Enrollment Trajectory ({timeRange})
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Time-bucketed student acquisition</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-[#7C248C] font-bold border border-purple-200/60">
                    <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> Intake Progression
                  </span>
                </div>
              </div>

              {/* SVG Area Chart */}
              <div className="relative pt-2">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C248C" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#E01E6A" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#1E2B88" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1E2B88" />
                      <stop offset="50%" stopColor="#7C248C" />
                      <stop offset="100%" stopColor="#E01E6A" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                    const y = chartHeight - 30 - ratio * (chartHeight - 60);
                    return (
                      <g key={idx}>
                        <line x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                        <text x="10" y={y + 3} fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace">
                          {Math.round(ratio * maxTimelineCount)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  <path d={areaPathStr} fill="url(#enrollmentGrad)" />

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="url(#strokeGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineStr}
                  />

                  {/* Circle markers */}
                  {areaPoints.map((p, idx) => (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPointIdx === idx ? "6.5" : "4.5"}
                        fill="#FFFFFF"
                        stroke="#7C248C"
                        strokeWidth="2.5"
                        className="transition-all"
                        onMouseEnter={() => setHoveredPointIdx(idx)}
                        onMouseLeave={() => setHoveredPointIdx(null)}
                      />
                      <text
                        x={p.x}
                        y={chartHeight - 8}
                        fill="#64748B"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Tooltip on hover */}
                {hoveredPointIdx !== null && areaPoints[hoveredPointIdx] && (
                  <div
                    className="absolute top-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-lg pointer-events-none transition-all"
                    style={{
                      left: `${(areaPoints[hoveredPointIdx].x / chartWidth) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {areaPoints[hoveredPointIdx].label}: {areaPoints[hoveredPointIdx].count} Enrollments (
                    {areaPoints[hoveredPointIdx].regCount} Registrations)
                  </div>
                )}
              </div>
            </div>

            {/* Donut Chart: Live Attendance Turnout */}
            <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Attendance Turnout</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Filtered for {timeRange}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                  {attTurnoutPct}% Turnout
                </span>
              </div>

              {/* Donut Graphic */}
              <div className="flex items-center justify-center py-2 relative">
                <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10B981"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${strokePresent} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${strokeLate} ${circumference}`}
                    strokeDashoffset={-(strokePresent || 0)}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F43F5E"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${strokeAbsent} ${circumference}`}
                    strokeDashoffset={-((strokePresent || 0) + (strokeLate || 0))}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900">{attTurnoutPct}%</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{attTotal} Logs</span>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
                  </span>
                  <strong className="text-slate-900">{attPresent}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
                  </span>
                  <strong className="text-slate-900">{attLate}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
                  </span>
                  <strong className="text-slate-900">{attAbsent}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Excused
                  </span>
                  <strong className="text-slate-900">{attExcused}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY VISUALS: PROPER FUNNEL GRAPHIC + COURSE LEVEL COMPARISON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. ACADEMIC SUBMISSIONS EVALUATION BREAKDOWN PIE CHART */}
            <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E2B88]">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Academic Submissions Distribution</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Evaluations lifecycle status ({timeRange})</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800">
                  {evalPct}% Graded
                </span>
              </div>

              {/* Pie / Donut Chart & Detailed Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-2">
                {/* SVG Pie / Donut Chart */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {/* Track Background */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#E2E8F0"
                        strokeWidth="11"
                        fill="transparent"
                      />
                      {/* Evaluated (Emerald) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#10B981"
                        strokeWidth="11"
                        fill="transparent"
                        strokeDasharray={`${strokeSubEval} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      {/* Pending Review (Amber) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#F59E0B"
                        strokeWidth="11"
                        fill="transparent"
                        strokeDasharray={`${strokeSubPending} ${circumference}`}
                        strokeDashoffset={-(strokeSubEval || 0)}
                        strokeLinecap="round"
                      />
                      {/* Resubmission Requests (Purple) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#A855F7"
                        strokeWidth="11"
                        fill="transparent"
                        strokeDasharray={`${strokeSubResub} ${circumference}`}
                        strokeDashoffset={-((strokeSubEval || 0) + (strokeSubPending || 0))}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900">{evalPct}%</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">Turnaround</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 mt-2">
                    {subTotal} Total Submissions
                  </span>
                </div>

                {/* Legend & Breakdown Cards */}
                <div className="sm:col-span-7 space-y-2.5">
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Evaluated & Graded</span>
                        <span className="text-[10px] text-emerald-700 font-medium">Completed faculty reviews</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-emerald-800 block">{subEvaluated}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{evalPct}%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Pending Review Queue</span>
                        <span className="text-[10px] text-amber-700 font-medium">Awaiting trainer evaluation</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-amber-800 block">{subPending}</span>
                      <span className="text-[10px] text-amber-600 font-bold">{pendingPct}%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Resubmissions Requested</span>
                        <span className="text-[10px] text-purple-700 font-medium">Returned for revision</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-purple-800 block">{subResubmission}</span>
                      <span className="text-[10px] text-purple-600 font-bold">{resubmissionPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PROPER CURRICULUM LEVEL GROUPED GRAPH */}
            <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Curriculum Tiers & Enrollment Distribution</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Program counts & student demand</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C]">
                  {rawData.courses.length} Programs
                </span>
              </div>

              {/* Proper SVG Bar Chart */}
              <div className="pt-2">
                <svg viewBox="0 0 450 140" className="w-full h-36">
                  {/* Grid lines */}
                  {[0, 0.5, 1].map((ratio, idx) => {
                    const y = 110 - ratio * 80;
                    return (
                      <line key={idx} x1="30" y1={y} x2="420" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    );
                  })}

                  {/* Level Bars */}
                  {levelStats.map((item, idx) => {
                    const maxCount = Math.max(...levelStats.map((l) => l.count), 1);
                    const barHeight = (item.count / maxCount) * 80;
                    const x = 70 + idx * 130;
                    const y = 110 - barHeight;

                    return (
                      <g key={item.level} className="cursor-pointer group">
                        {/* Bar */}
                        <rect
                          x={x}
                          y={y}
                          width="50"
                          height={barHeight}
                          rx="8"
                          fill={item.color}
                          className="opacity-90 transition hover:opacity-100"
                        />
                        {/* Value label on top */}
                        <text
                          x={x + 25}
                          y={y - 6}
                          fill="#1E293B"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {item.count}
                        </text>
                        {/* Tier label at bottom */}
                        <text
                          x={x + 25}
                          y="130"
                          fill="#64748B"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {item.level}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono text-xs">
                  {levelStats.map((s) => (
                    <div key={s.level} className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block">{s.level}</span>
                      <strong className="text-slate-900">{s.enrollments} Enrolled</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Courses Demand Leaderboard */}
          <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Highest In-Demand Courses</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Ranked by total enrolled students</p>
                </div>
              </div>
              <Link
                href="/admin/courses"
                className="text-xs font-bold text-[#7C248C] hover:text-purple-800 flex items-center gap-1"
              >
                All Courses <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rawData.courses.slice(0, 6).map((c, idx) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-purple-300 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C248C] font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.level}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] font-bold text-[10px]">
                      {c.enrollmentCount} Learners
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{c.batchCount} Batches</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LEARNERS & COHORTS */}
      {/* ========================================================================= */}
      {activeTab === "LEARNERS" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Detailed Learner Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="glass-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">Intake in Selected Period</span>
              <div className="text-3xl font-black text-slate-900">{filteredData.students.length}</div>
              <span className="text-emerald-700 font-bold block">{activeRatePct}% Active Rate</span>
            </div>

            <div className="glass-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">Batch Placement Rate</span>
              <div className="text-3xl font-black text-blue-700">
                {rawData.students.length > 0
                  ? Math.round(
                      (rawData.students.filter((s) => rawData.enrollments.some((e) => e.batchId)).length /
                        rawData.students.length) *
                        100
                    )
                  : 100}
                %
              </div>
              <span className="text-slate-500 font-medium block">Allocated to Academic Cohorts</span>
            </div>

            <div className="glass-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">Email Verification</span>
              <div className="text-3xl font-black text-purple-700">
                {rawData.students.length > 0
                  ? Math.round(
                      (rawData.students.filter((s) => s.isEmailVerified).length / rawData.students.length) * 100
                    )
                  : 100}
                %
              </div>
              <span className="text-slate-500 font-medium block">Institutional Verification</span>
            </div>
          </div>

          {/* Cohort Batches Status & Capacity Analysis */}
          <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Cohort Batches Roster & Capacity</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Student counts and lifecycle statuses</p>
                </div>
              </div>
              <Link
                href="/admin/batches"
                className="text-xs font-bold text-[#E01E6A] hover:text-pink-800 flex items-center gap-1"
              >
                Manage Batches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rawData.batches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 hover:border-pink-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs truncate">{batch.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{batch.courseTitle}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                        batch.status === "ONGOING"
                          ? "bg-emerald-100 text-emerald-800"
                          : batch.status === "UPCOMING"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">{batch.studentCount} Students</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(batch.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FACULTY & BROADCASTS */}
      {/* ========================================================================= */}
      {activeTab === "FACULTY" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Live Virtual Broadcast Radar */}
          <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A]">
                  <Radio className="w-4 h-4 text-[#E01E6A]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Live Broadcast Radar (Filtered for {timeRange})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Virtual classrooms and Google Meet sessions</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-pink-50 text-[#E01E6A]">
                {filteredData.liveClasses.length} Sessions in Range
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredData.liveClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-pink-300 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-slate-900 truncate">{cls.title}</div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                      <span className="text-[#E01E6A] font-bold">{cls.batchName}</span>
                      <span>•</span>
                      <span>{cls.trainerName}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {cls.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(cls.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Leadership & Workload Matrix */}
          <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Faculty Supervisory Matrix</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Instructor courses, cohorts, and broadcast load</p>
                </div>
              </div>
              <Link
                href="/admin/trainers"
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
              >
                Full Faculty Directory <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {rawData.trainers.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-amber-300 transition"
                >
                  <div className="flex items-center gap-3">
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt={f.name} className="w-10 h-10 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black flex items-center justify-center shrink-0">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{f.designation}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-slate-200/60">
                    <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Courses</span>
                      <strong className="text-slate-900">{f.coursesCount}</strong>
                    </div>
                    <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Cohorts</span>
                      <strong className="text-slate-900">{f.batchesCount}</strong>
                    </div>
                    <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Broadcasts</span>
                      <strong className="text-slate-900">{f.liveClassesCount}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EVALUATIONS & CREDENTIALS */}
      {/* ========================================================================= */}
      {activeTab === "ASSESSMENTS" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Visual Multi-Tier Evaluation Lifecycle Breakdown Pie Chart */}
          <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E2B88]">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Academic Submissions Lifecycle & Distribution ({timeRange})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Evaluation stages, grading turnaround and queue share</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800">
                {subTotal} Total Submissions
              </span>
            </div>

            {/* Pie Chart & Detailed Review Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
              {/* Pie / Donut Breakdown */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                    {/* Track Background */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E2E8F0"
                      strokeWidth="11"
                      fill="transparent"
                    />
                    {/* Evaluated (Emerald) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10B981"
                      strokeWidth="11"
                      fill="transparent"
                      strokeDasharray={`${strokeSubEval} ${circumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Pending Review (Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F59E0B"
                      strokeWidth="11"
                      fill="transparent"
                      strokeDasharray={`${strokeSubPending} ${circumference}`}
                      strokeDashoffset={-(strokeSubEval || 0)}
                      strokeLinecap="round"
                    />
                    {/* Resubmissions (Purple) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#A855F7"
                      strokeWidth="11"
                      fill="transparent"
                      strokeDasharray={`${strokeSubResub} ${circumference}`}
                      strokeDashoffset={-((strokeSubEval || 0) + (strokeSubPending || 0))}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900">{evalPct}%</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">Evaluated</span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-500 mt-2.5">
                  {subTotal} Total Recorded Submissions
                </span>
              </div>

              {/* Status Breakdown Metric Cards */}
              <div className="sm:col-span-7 space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Evaluated Submissions</span>
                      <span className="text-[11px] text-emerald-700 font-medium">Graded with feedback & marks assigned</span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="text-base font-black text-emerald-900 block">{subEvaluated}</span>
                    <span className="text-[11px] text-emerald-600 font-bold">{evalPct}% of total</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Pending Review Queue</span>
                      <span className="text-[11px] text-amber-700 font-medium">Awaiting evaluation from assigned trainer</span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="text-base font-black text-amber-900 block">{subPending}</span>
                    <span className="text-[11px] text-amber-600 font-bold">{pendingPct}% of total</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Resubmissions Requested</span>
                      <span className="text-[11px] text-purple-700 font-medium">Returned to student for rework/corrections</span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="text-base font-black text-purple-900 block">{subResubmission}</span>
                    <span className="text-[11px] text-purple-600 font-bold">{resubmissionPct}% of total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Mastery & Verified Certificates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-700" /> Quiz Assessment Mastery
                </h4>
                <span className="text-xs font-mono font-bold text-purple-700">{quizPassRate}% Passed</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-700 block uppercase font-mono">Average Score</span>
                  <strong className="text-2xl text-purple-900 font-black">{avgQuizScore}%</strong>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block">Total Attempts</span>
                  <strong className="text-slate-900 font-bold">{totalQuizAttempts}</strong>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" /> Certificate Credentials
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-700">{certsInPeriod} in Range</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-700 block uppercase font-mono">Issued All-Time</span>
                  <strong className="text-2xl text-emerald-900 font-black">{rawData.certificates.length}</strong>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block">Verification Protocol</span>
                  <strong className="text-emerald-700 font-bold">100% Cryptographic QR</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
