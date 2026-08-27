import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  BookOpen,
  Users,
  Layers,
  FileCheck,
  Video,
  Clock,
  Plus,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const [courses, batches, assignments, quizzes, liveClasses, recentLogs] = await Promise.all([
    prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
      include: {
        modules: { include: { lessons: true } },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.batch.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { trainers: { some: { trainerId } } },
            ],
          },
      include: {
        course: { select: { title: true } },
        students: true,
      },
    }),
    prisma.assignment.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          },
      include: { submissions: true },
    }),
    prisma.quiz.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          },
    }),
    prisma.liveClass.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batch: { trainers: { some: { trainerId } } } },
              { batch: { course: { trainerId } } },
            ],
          },
      include: { batch: { select: { name: true } } },
      orderBy: { scheduledDate: "asc" },
      take: 4,
    }),
    prisma.activityLog.findMany({
      where: isAdmin ? {} : { userId: trainerId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const assignedCoursesCount = courses.length;
  const myBatchesCount = batches.length;
  const totalStudents = courses.reduce((acc, c) => acc + c.enrollments.length, 0);
  const upcomingLiveClassesCount = liveClasses.filter((lc) => new Date(lc.scheduledDate) >= new Date()).length;
  const pendingEvaluationsCount = assignments.reduce(
    (acc, a) => acc + a.submissions.filter((s) => s.status === "SUBMITTED").length,
    0
  );
  const activeQuizzesCount = quizzes.filter((q) => q.status === "PUBLISHED").length;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-slate-50 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C248C] text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> JVM Faculty Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {session.name} 🎓
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl">
            Overview of your assigned academic scope, active student cohorts, live classes, and pending evaluation tasks.
          </p>
        </div>

        <Link
          href="/trainer/batches/create"
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Create New Batch
        </Link>
      </div>

      {/* 6 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Courses
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{assignedCoursesCount}</div>
          <div className="text-[11px] text-amber-700 font-mono">Assigned Scope</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-600" /> My Batches
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600">{myBatchesCount}</div>
          <div className="text-[11px] text-slate-500 font-mono">Active Cohorts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" /> Total Students
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600">{totalStudents}</div>
          <div className="text-[11px] text-slate-500 font-mono">Enrolled Learners</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-rose-600" /> Live Classes
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">{upcomingLiveClassesCount}</div>
          <div className="text-[11px] text-slate-500 font-mono">Upcoming</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Pending Grading
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{pendingEvaluationsCount}</div>
          <div className="text-[11px] text-slate-500 font-mono">Submissions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> Active Quizzes
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600">{activeQuizzesCount}</div>
          <div className="text-[11px] text-slate-500 font-mono">Published</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/trainer/batches/create"
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
            <span>Create Batch</span>
          </Link>

          <Link
            href="/trainer/live-classes"
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition">
              <Video className="w-4 h-4" />
            </div>
            <span>Schedule Class</span>
          </Link>

          <Link
            href="/trainer/quizzes"
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
            <span>Manage Quizzes</span>
          </Link>

          <Link
            href="/trainer/assignments"
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileCheck className="w-4 h-4" />
            </div>
            <span>Grade Assignments</span>
          </Link>

          <Link
            href="/trainer/attendance"
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Mark Attendance</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Classes & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Classes Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-600" /> Upcoming Live Interactive Sessions
            </h2>
            <Link href="/trainer/live-classes" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {liveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveClasses.map((lc) => (
                <div key={lc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                        {lc.status}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(lc.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{lc.title}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" /> Batch: {lc.batch.name}
                    </p>
                  </div>

                  <a
                    href={lc.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" /> Launch Meet
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No upcoming live classes scheduled.</div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" /> Recent Activity
          </h2>

          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-amber-700 font-mono">{log.action}</div>
                  <div className="text-slate-800 truncate">{log.resource}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No recent activity logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
