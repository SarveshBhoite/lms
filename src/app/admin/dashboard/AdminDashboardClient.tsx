"use client";

import { useState } from "react";
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
  Activity,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  Plus,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart,
  Radio,
  Eye,
} from "lucide-react";

interface AdminDashboardData {
  admin: {
    id: string;
    name: string;
    email: string;
  };
  metrics: {
    students: {
      total: number;
      active: number;
      inactive: number;
      activeRatePct: number;
      enrolledInBatches: number;
      verifiedEmail: number;
    };
    trainers: {
      total: number;
      active: number;
    };
    courses: {
      total: number;
      published: number;
      draft: number;
      archived: number;
      modules: number;
      lessons: number;
      levelCounts: Record<string, number>;
    };
    batches: {
      total: number;
      ongoing: number;
      upcoming: number;
      completed: number;
    };
    liveClasses: {
      total: number;
      turnoutPct: number;
      attendance: {
        total: number;
        present: number;
        late: number;
        absent: number;
        excused: number;
      };
    };
    assignments: {
      total: number;
      submissions: number;
      pending: number;
      evaluated: number;
      resubmission: number;
      evaluatedPct: number;
    };
    quizzes: {
      total: number;
      attempts: number;
      passed: number;
      passRatePct: number;
      avgScore: number;
    };
    certificates: {
      total: number;
      active: number;
    };
  };
  trends: {
    enrollments: { label: string; count: number }[];
  };
  topCourses: {
    id: string;
    title: string;
    level: string;
    status: string;
    enrollmentCount: number;
    batchCount: number;
  }[];
  facultyWorkload: {
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
  upcomingClasses: {
    id: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    status: string;
    courseTitle: string;
    batchName: string;
    trainerName: string;
  }[];
  recentStudents: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    avatarUrl?: string | null;
    phone?: string | null;
    createdAt: string;
    courseTitle: string;
    batchName: string;
  }[];
  recentActivities: {
    id: string;
    action: string;
    resource: string;
    details?: string | null;
    createdAt: string;
    userName: string;
    userRole: string;
  }[];
}

export default function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "ALL">("30D");
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "LEARNERS" | "FACULTY" | "ASSESSMENTS">("OVERVIEW");
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  const { metrics, trends, topCourses, facultyWorkload, upcomingClasses, recentStudents, recentActivities } = data;

  // Chart 1 Coordinates calculation for 6-month Enrollment Area Chart
  const maxEnrollment = Math.max(...trends.enrollments.map((t) => t.count), 5);
  const chartHeight = 160;
  const chartWidth = 560;
  const points = trends.enrollments.map((t, idx) => {
    const x = (idx / (trends.enrollments.length - 1 || 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - 25 - (t.count / maxEnrollment) * (chartHeight - 50);
    return { x, y, count: t.count, label: t.label };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPathStr = `M ${points[0]?.x || 0},${chartHeight - 20} L ${polylineStr} L ${points[points.length - 1]?.x || 0},${chartHeight - 20} Z`;

  // Donut chart calculations for Attendance Turnout
  const att = metrics.liveClasses.attendance;
  const attTotal = att.total || 1;
  const presentPct = Math.round((att.present / attTotal) * 100);
  const latePct = Math.round((att.late / attTotal) * 100);
  const absentPct = Math.round((att.absent / attTotal) * 100);
  const excusedPct = Math.round((att.excused / attTotal) * 100);

  // SVG circle circumference = 2 * π * 40 ≈ 251.2
  const circumference = 251.2;
  const strokePresent = (presentPct / 100) * circumference;
  const strokeLate = (latePct / 100) * circumference;
  const strokeAbsent = (absentPct / 100) * circumference;
  const strokeExcused = (excusedPct / 100) * circumference;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. EXECUTIVE STUDIO CONTROL BANNER (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/10 via-pink-400/10 to-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> JVM LMS Executive Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-mono font-bold uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Operational • 99.9% Uptime
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Welcome back, <span className="jvm-gradient-text">{data.admin.name}</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-2xl">
              System-wide institutional telemetry, academic operations, student growth, and faculty oversight across JVM Institute.
            </p>
          </div>

          {/* Time-Range Switcher & Quick Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="p-1 rounded-2xl bg-white/90 border border-purple-200/70 shadow-2xs flex items-center justify-center gap-1 text-xs font-bold font-mono">
              {(["7D", "30D", "90D", "ALL"] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
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

        {/* Quick Administrative Shortcuts Bar */}
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
          <Link
            href="/admin/activity-logs"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5" /> Audit Trail
          </Link>
        </div>
      </div>

      {/* 2. TOP 8 EXECUTIVE KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Students */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-purple-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Total Learners</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C248C] flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.students.total}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {metrics.students.activeRatePct}% Active
              </span>
              <span className="text-slate-400 font-mono">{metrics.students.inactive} Inactive</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="jvm-gradient-bg h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.students.activeRatePct}%` }}
            />
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
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.trainers.total}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-amber-800 font-bold">{metrics.trainers.active} Active Faculty</span>
              <span className="text-slate-400 font-mono">100% Verified</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.trainers.total > 0 ? (metrics.trainers.active / metrics.trainers.total) * 100 : 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Course Programs */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-blue-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Course Catalog</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E2B88] flex items-center justify-center group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.courses.total}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-blue-700 font-bold">{metrics.courses.published} Published</span>
              <span className="text-slate-400 font-mono">{metrics.courses.lessons} Lessons</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.courses.total > 0 ? (metrics.courses.published / metrics.courses.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Active Batches */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-pink-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Cohort Batches</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#E01E6A] flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.batches.total}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-pink-700 font-bold">{metrics.batches.ongoing} Ongoing</span>
              <span className="text-slate-400 font-mono">{metrics.batches.upcoming} Upcoming</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-pink-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.batches.total > 0 ? ((metrics.batches.ongoing + metrics.batches.upcoming) / metrics.batches.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 5: Live Class Turnout */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Live Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.liveClasses.turnoutPct}%</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-emerald-700 font-bold">{metrics.liveClasses.total} Sessions</span>
              <span className="text-slate-400 font-mono">{att.present + att.late} Attended</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.liveClasses.turnoutPct}%` }}
            />
          </div>
        </div>

        {/* Metric 6: Evaluation Queue */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-amber-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Evaluation Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              {metrics.assignments.pending}
              {metrics.assignments.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-slate-600 font-bold">{metrics.assignments.evaluatedPct}% Graded</span>
              <span className="text-slate-400 font-mono">{metrics.assignments.submissions} Total</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.assignments.evaluatedPct}%` }}
            />
          </div>
        </div>

        {/* Metric 7: Quiz Mastery */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-violet-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Quiz Mastery</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C248C] flex items-center justify-center group-hover:scale-105 transition">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.quizzes.passRatePct}%</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-purple-700 font-bold">Avg Score: {metrics.quizzes.avgScore}%</span>
              <span className="text-slate-400 font-mono">{metrics.quizzes.attempts} Attempts</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.quizzes.passRatePct}%` }}
            />
          </div>
        </div>

        {/* Metric 8: Verified Credentials */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Certificates Issued</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.certificates.total}</div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-emerald-700 font-bold">100% Cryptographic QR</span>
              <span className="text-slate-400 font-mono">{metrics.certificates.active} Verified QR</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.certificates.total > 0 ? (metrics.certificates.active / metrics.certificates.total) * 100 : 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. PERSPECTIVE NAVIGATION TABS */}
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

      {/* 4. MAIN ANALYTICAL VISUALIZATION PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualization 1: Enrollment Growth Trajectory (Area Chart with SVG gradient) */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Student Admissions & Enrollment Trajectory</h3>
                <p className="text-[11px] text-slate-500 font-medium">6-Month historical registration distribution</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-[#7C248C] font-bold border border-purple-200/60">
                <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> Monthly Enrollments
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative pt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C248C" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#E01E6A" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#1E2B88" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E2B88" />
                  <stop offset="50%" stopColor="#7C248C" />
                  <stop offset="100%" stopColor="#E01E6A" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = chartHeight - 25 - ratio * (chartHeight - 50);
                return (
                  <g key={idx}>
                    <line x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x="10" y={y + 3} fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {Math.round(ratio * maxEnrollment)}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path d={areaPathStr} fill="url(#enrollmentGradient)" />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />

              {/* Interactive Points */}
              {points.map((p, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredTrendIdx === idx ? "6.5" : "4.5"}
                    fill="#FFFFFF"
                    stroke="#7C248C"
                    strokeWidth="2.5"
                    className="transition-all"
                    onMouseEnter={() => setHoveredTrendIdx(idx)}
                    onMouseLeave={() => setHoveredTrendIdx(null)}
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 6}
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

            {/* Hover Tooltip display */}
            {hoveredTrendIdx !== null && points[hoveredTrendIdx] && (
              <div
                className="absolute top-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-lg pointer-events-none transition-all"
                style={{
                  left: `${(points[hoveredTrendIdx].x / chartWidth) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {points[hoveredTrendIdx].label}: {points[hoveredTrendIdx].count} Enrollments
              </div>
            )}
          </div>
        </div>

        {/* Visualization 2: Live Attendance Turnout Distribution (SVG Donut Meter) */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Attendance Turnout</h3>
                <p className="text-[11px] text-slate-500 font-medium">Live classroom engagement</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              {metrics.liveClasses.turnoutPct}% Attended
            </span>
          </div>

          {/* SVG Donut Graphic */}
          <div className="flex items-center justify-center py-2 relative">
            <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background Ring */}
              <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />

              {/* Present Segment (Emerald) */}
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

              {/* Late Segment (Amber) */}
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

              {/* Absent Segment (Rose) */}
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
              <span className="text-2xl font-black text-slate-900">{metrics.liveClasses.turnoutPct}%</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Avg Turnout</span>
            </div>
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <strong className="text-slate-900">{att.present}</strong>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
              </span>
              <strong className="text-slate-900">{att.late}</strong>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
              </span>
              <strong className="text-slate-900">{att.absent}</strong>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Excused
              </span>
              <strong className="text-slate-900">{att.excused}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECONDARY ANALYTICS: ACADEMIC PIPELINE & CURRICULUM LEVELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Assessment & Evaluation Pipeline */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E2B88]">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Academic Evaluation Pipeline</h3>
                <p className="text-[11px] text-slate-500 font-medium">Assignment grading turnaround and queue</p>
              </div>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              Audit Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Multi-Segment Pipeline Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">Submissions Lifecycle</span>
                <span className="text-slate-500">{metrics.assignments.submissions} Total Uploads</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${metrics.assignments.submissions > 0 ? (metrics.assignments.evaluated / metrics.assignments.submissions) * 100 : 0}%`,
                  }}
                  title={`Evaluated: ${metrics.assignments.evaluated}`}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{
                    width: `${metrics.assignments.submissions > 0 ? (metrics.assignments.pending / metrics.assignments.submissions) * 100 : 0}%`,
                  }}
                  title={`Pending: ${metrics.assignments.pending}`}
                />
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{
                    width: `${metrics.assignments.submissions > 0 ? (metrics.assignments.resubmission / metrics.assignments.submissions) * 100 : 0}%`,
                  }}
                  title={`Resubmissions: ${metrics.assignments.resubmission}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[10px] text-emerald-800 block uppercase">Evaluated</span>
                <strong className="text-lg text-emerald-900 font-extrabold">{metrics.assignments.evaluated}</strong>
                <span className="text-[10px] text-emerald-700 block mt-0.5">{metrics.assignments.evaluatedPct}% Completed</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[10px] text-amber-800 block uppercase">Pending Review</span>
                <strong className="text-lg text-amber-900 font-extrabold">{metrics.assignments.pending}</strong>
                <span className="text-[10px] text-amber-700 block mt-0.5">Faculty Queue</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80">
                <span className="text-[10px] text-purple-800 block uppercase">Resubmissions</span>
                <strong className="text-lg text-purple-900 font-extrabold">{metrics.assignments.resubmission}</strong>
                <span className="text-[10px] text-purple-700 block mt-0.5">Feedback Given</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum Distribution by Level */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Curriculum Level Distribution</h3>
                <p className="text-[11px] text-slate-500 font-medium">Program diversity across course tiers</p>
              </div>
            </div>
            <Link
              href="/admin/courses"
              className="text-xs font-bold text-[#7C248C] hover:text-purple-800 flex items-center gap-1"
            >
              Manage Catalog <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            {/* Beginner */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Beginner Foundation</span>
                <span className="font-bold text-slate-900">{metrics.courses.levelCounts.BEGINNER || 0} Programs</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.courses.total > 0 ? ((metrics.courses.levelCounts.BEGINNER || 0) / metrics.courses.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Intermediate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Intermediate Practitioner</span>
                <span className="font-bold text-slate-900">{metrics.courses.levelCounts.INTERMEDIATE || 0} Programs</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.courses.total > 0 ? ((metrics.courses.levelCounts.INTERMEDIATE || 0) / metrics.courses.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Advanced */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Advanced Masterclass</span>
                <span className="font-bold text-slate-900">{metrics.courses.levelCounts.ADVANCED || 0} Programs</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.courses.total > 0 ? ((metrics.courses.levelCounts.ADVANCED || 0) / metrics.courses.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. OPERATIONAL FEEDS: UPCOMING CLASSES, LEADERBOARD, RECENT ADMISSIONS & AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed 1: Upcoming Live Virtual Classrooms */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A]">
                <Radio className="w-4 h-4 text-[#E01E6A]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Upcoming Live Classrooms</h3>
                <p className="text-[11px] text-slate-500 font-medium">Broadcast studio schedule</p>
              </div>
            </div>
            <Link
              href="/admin/attendance"
              className="text-xs font-bold text-[#E01E6A] hover:text-pink-800 flex items-center gap-1"
            >
              Live Control <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-pink-300 transition"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{cls.title}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[#E01E6A] font-bold">{cls.batchName}</span>
                      <span>•</span>
                      <span>{cls.trainerName}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {cls.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {new Date(cls.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">No scheduled live classes today.</div>
            )}
          </div>
        </div>

        {/* Feed 2: Top Courses Leaderboard */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Top Enrolled Courses</h3>
                <p className="text-[11px] text-slate-500 font-medium">Highest student demand</p>
              </div>
            </div>
            <Link
              href="/admin/courses"
              className="text-xs font-bold text-[#7C248C] hover:text-purple-800 flex items-center gap-1"
            >
              All Courses <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {topCourses.map((c, idx) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-purple-300 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C248C] font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{c.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.level} Level</div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] font-bold text-[10px]">
                    {c.enrollmentCount} Learners
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-[10px]">
                    {c.batchCount} Batches
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed 3: Recently Registered Students */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Recent Student Admissions</h3>
                <p className="text-[11px] text-slate-500 font-medium">New student registrations</p>
              </div>
            </div>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
            >
              Full Roster <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentStudents.map((st) => (
              <div
                key={st.id}
                className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:border-indigo-300 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {st.avatarUrl ? (
                    <img src={st.avatarUrl} alt={st.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl jvm-gradient-bg text-white font-bold flex items-center justify-center shrink-0">
                      {st.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{st.email}</div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      st.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {st.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                    {st.batchName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed 4: Live System Activity Logs */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Real-Time Audit Trail</h3>
                <p className="text-[11px] text-slate-500 font-medium">Live system activity logs</p>
              </div>
            </div>
            <Link
              href="/admin/activity-logs"
              className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
            >
              All Logs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentActivities.length > 0 ? (
              recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{log.userName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-200 text-slate-700 uppercase">
                        {log.userRole}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      <span className="font-bold text-purple-700">{log.action}</span> on{" "}
                      <span className="font-mono text-slate-700">{log.resource}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">No activity logs recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* 7. FACULTY OVERSIGHT MATRIX (Displayed when FACULTY or OVERVIEW tab active) */}
      {(activeTab === "OVERVIEW" || activeTab === "FACULTY") && (
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Faculty Leadership & Instruction Workload</h3>
                <p className="text-[11px] text-slate-500 font-medium">Instructor assignments, batches, and live session delivery</p>
              </div>
            </div>
            <Link
              href="/admin/trainers"
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              Faculty Directory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {facultyWorkload.map((f) => (
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
                    <span className="text-[10px] text-slate-400 block">Classes</span>
                    <strong className="text-slate-900">{f.liveClassesCount}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
