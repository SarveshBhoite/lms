import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ShieldCheck,
  Users,
  BookOpen,
  Layers,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch real-time system metrics from Neon PostgreSQL
  const [
    students,
    trainers,
    courses,
    batches,
    enrollments,
    liveClasses,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        enrollments: { include: { course: true } },
        courseProgresses: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "TRAINER" },
      include: { coursesCreated: true },
    }),
    prisma.course.findMany({
      include: {
        trainer: true,
        modules: { include: { lessons: true } },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.batch.findMany({
      include: {
        course: true,
        students: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.findMany({
      include: {
        user: true,
        course: true,
        batch: true,
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.liveClass.findMany({
      include: {
        batch: true,
        trainer: true,
      },
      orderBy: { scheduledDate: "asc" },
      take: 4,
    }),
  ]);

  const activeCoursesCount = courses.filter((c) => c.status === "PUBLISHED").length;

  return (
    <div className="p-6 sm:p-10 space-y-10 max-w-7xl w-full mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-rose-400" /> Super Admin Control Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {session.name} 👋
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Real-time synchronization across all faculties, curriculum programs, cohorts, and student milestones.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            href="/admin/courses"
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Course Catalog
          </Link>
          <Link
            href="/admin/batches"
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition"
          >
            New Batch
          </Link>
        </div>
      </div>

      {/* Real-time System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Students</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{students.length}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Users
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trainers</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{trainers.length}</div>
          <div className="text-[11px] text-slate-400">Faculty Members</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Courses</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{courses.length}</div>
          <div className="text-[11px] text-slate-400">{activeCoursesCount} Published</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Batches</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{batches.length}</div>
          <div className="text-[11px] text-slate-400">Cohorts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enrollments</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">{enrollments.length}</div>
          <div className="text-[11px] text-slate-400">Active Seats</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Classes</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">{liveClasses.length}</div>
          <div className="text-[11px] text-slate-400">Scheduled</div>
        </div>
      </div>

      {/* Synchronized Real Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real Students Roster */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Recent Students
            </h2>
            <Link href="/admin/students" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {students.slice(0, 4).map((st) => (
              <div key={st.id} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{st.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                </div>
                <span className="text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                  {st.enrollments[0]?.course.title.substring(0, 15) || "Active"}...
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Course Catalog */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" /> Courses & Faculty
            </h2>
            <Link href="/admin/courses" className="text-xs font-bold text-violet-400 hover:text-violet-300">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <div className="font-bold text-white truncate">{c.title}</div>
                  <div className="text-[11px] text-slate-400">By {c.trainer.name} • {c.durationHours}h</div>
                </div>
                <span className="text-indigo-400 font-bold shrink-0">{c.enrollments.length} St.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Live Classes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" /> Scheduled Live Classes
            </h2>
            <Link href="/admin/batches" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              Batches
            </Link>
          </div>

          <div className="space-y-2">
            {liveClasses.length > 0 ? (
              liveClasses.map((lc) => (
                <div key={lc.id} className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5 text-xs">
                  <div className="font-bold text-cyan-300">{lc.title}</div>
                  <div className="text-slate-400 text-[11px] flex justify-between">
                    <span>Batch: {lc.batch.name}</span>
                    <span className="font-mono">{new Date(lc.scheduledDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-4">No live classes scheduled yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

