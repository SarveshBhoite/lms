import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  UserCheck,
  Zap,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Activity,
  UserPlus,
  Clock,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Real DB aggregations and metrics
  const [
    totalStudents,
    activeStudents,
    totalTrainers,
    totalCourses,
    totalBatches,
    activeBatches,
    recentActivities,
    recentStudents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.course.count(),
    prisma.batch.count(),
    prisma.batch.count({
      where: { status: { in: ["ONGOING", "UPCOMING"] } },
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: true,
        enrollments: { include: { course: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="p-6 sm:p-10 space-y-10 max-w-7xl w-full mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-200 bg-gradient-to-r from-rose-50/60 via-indigo-50/40 to-slate-50 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" /> Super Admin Control Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {session.name} 👋
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl">
            Real-time synchronization across system analytics, student enrollments, faculty operations, and course programs.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/admin/students?action=new"
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </Link>
          <Link
            href="/admin/students"
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition"
          >
            All Students
          </Link>
        </div>
      </div>

      {/* 6 Key System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-indigo-600 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> Registered
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Students</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{activeStudents}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Active Accounts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Trainers</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{totalTrainers}</div>
          <div className="text-[11px] text-slate-500 font-medium">Faculty Members</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Courses</span>
            <BookOpen className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-violet-600">{totalCourses}</div>
          <div className="text-[11px] text-slate-500 font-medium">Published & Draft</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Batches</span>
            <Layers className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600">{totalBatches}</div>
          <div className="text-[11px] text-slate-500 font-medium">All Cohorts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Batches</span>
            <Zap className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{activeBatches}</div>
          <div className="text-[11px] text-slate-500 font-medium">Ongoing & Upcoming</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Quick Administrative Actions
          </h2>
          <span className="text-xs text-slate-500">Fast shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/admin/students?action=new"
            className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-100/80 transition flex flex-col items-center text-center space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-rose-600 text-white group-hover:scale-110 transition-transform shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Add Student</span>
            <span className="text-[10px] text-slate-500">Register new account</span>
          </Link>

          <Link
            href="/admin/trainers"
            className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 hover:bg-amber-100/80 transition flex flex-col items-center text-center space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500 text-white group-hover:scale-110 transition-transform shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Add Trainer</span>
            <span className="text-[10px] text-slate-500">Trainer module</span>
          </Link>

          <Link
            href="/admin/courses"
            className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200/80 hover:bg-violet-100/80 transition flex flex-col items-center text-center space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-violet-600 text-white group-hover:scale-110 transition-transform shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Create Course</span>
            <span className="text-[10px] text-slate-500">Course catalog</span>
          </Link>

          <Link
            href="/admin/batches"
            className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 hover:bg-cyan-100/80 transition flex flex-col items-center text-center space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-cyan-600 text-white group-hover:scale-110 transition-transform shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Create Batch</span>
            <span className="text-[10px] text-slate-500">Batches module</span>
          </Link>

          <Link
            href="/admin/enrollments"
            className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 hover:bg-indigo-100/80 transition flex flex-col items-center text-center space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white group-hover:scale-110 transition-transform shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Enroll Student</span>
            <span className="text-[10px] text-slate-500">Enrollments section</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Activities & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities Section */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" /> Recent System Activities
            </h2>
            <span className="text-xs text-slate-500 font-mono">Live Audit Logs</span>
          </div>

          <div className="space-y-2.5">
            {recentActivities.length > 0 ? (
              recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {log.user?.name || "System"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">
                      Resource: <span className="font-mono text-slate-700">{log.resource}</span>
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No recent activity logs recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Students Roster */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Recently Registered Students
            </h2>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View Roster <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentStudents.map((st) => (
              <div
                key={st.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 shrink-0">
                    {st.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{st.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{st.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      st.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {st.isActive !== false ? "Active" : "Deactivated"}
                  </span>
                  <Link
                    href={`/admin/students/${st.id}`}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition font-semibold"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
