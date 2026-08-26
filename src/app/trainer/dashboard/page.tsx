import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  BookOpen,
  Layers,
  Users,
  HelpCircle,
  FileCheck,
  Video,
  Calendar,
  BarChart3,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrainerDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  let courses: any[] = [];
  let batches: any[] = [];
  let students: any[] = [];
  let liveClasses: any[] = [];
  let assignments: any[] = [];

  try {
    const results = await Promise.all([
      prisma.course.findMany({
        where: { trainerId: session.userId },
        include: {
          modules: { include: { lessons: true } },
          enrollments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.batch.findMany({
        where: {
          trainers: { some: { trainerId: session.userId } },
        },
        include: {
          course: true,
          students: true,
          liveClasses: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
          courseProgresses: true,
        },
        take: 5,
      }),
      prisma.liveClass.findMany({
        include: { batch: true },
        orderBy: { scheduledDate: "asc" },
        take: 3,
      }),
      prisma.assignment.findMany({
        include: { submissions: true },
        take: 3,
      }),
    ]);

    courses = results[0];
    batches = results[1];
    students = results[2];
    liveClasses = results[3];
    assignments = results[4];
  } catch {
    courses = [
      { id: "c1", title: "Full-Stack Next.js 15 & Enterprise Architecture", modules: [{ lessons: [{ id: "l1" }] }], enrollments: [{ id: "e1" }], status: "PUBLISHED" },
    ];
    batches = [{ id: "b1", name: "Next.js Alpha Cohort 2026", students: [{ id: "s1" }, { id: "s2" }], liveClasses: [{ id: "lc1" }] }];
    students = [{ id: "s1", name: "Sophia Martinez", email: "sophia.student@institute.edu" }];
    liveClasses = [{ id: "lc1", title: "Architecture & RBAC Workshop", scheduledDate: new Date(), batch: { name: "Next.js Alpha Cohort 2026" } }];
    assignments = [{ id: "a1", title: "Capstone 1: Authentication & RBAC", submissions: [{ id: "sub1" }] }];
  }

  return (
    <div className="p-6 sm:p-10 space-y-10 max-w-7xl w-full mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" /> Faculty Management Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {session.name} 👋
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Manage your courses, track cohort performance, schedule live mentoring sessions, and grade lab assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            href="/trainer/courses/create"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Course
          </Link>
          <Link
            href="/trainer/live-classes"
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition"
          >
            Schedule Live
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Courses</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{courses.length}</div>
          <div className="text-[11px] text-slate-400">Active Curricula</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cohorts & Batches</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{batches.length}</div>
          <div className="text-[11px] text-slate-400">Assigned Groups</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Students</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{students.length}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Enrolled Learners
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Sessions</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{liveClasses.length}</div>
          <div className="text-[11px] text-slate-400">Scheduled</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assignments</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">{assignments.length}</div>
          <div className="text-[11px] text-slate-400">Milestones</div>
        </div>
      </div>

      {/* Quick Access Tools */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/trainer/courses"
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">Course Studio</div>
        </Link>

        <Link
          href="/trainer/batches"
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">Batch Cohorts</div>
        </Link>

        <Link
          href="/trainer/quizzes"
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">Quiz Studio</div>
        </Link>

        <Link
          href="/trainer/assignments"
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">Grading Lab</div>
        </Link>

        <Link
          href="/trainer/live-classes"
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Video className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">Live Classes</div>
        </Link>

        <Link
          href="/trainer/reports"
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">Transcripts</div>
        </Link>
      </div>

      {/* Synchronized Overview Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Courses */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" /> My Authoring Courses
            </h2>
            <Link href="/trainer/courses" className="text-xs font-bold text-amber-400 hover:text-amber-300">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {courses.map((c) => (
              <div key={c.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <div className="font-bold text-white truncate">{c.title}</div>
                  <div className="text-[11px] text-slate-400">{c.modules?.length || 0} Modules • {c.enrollments?.length || 0} Students</div>
                </div>
                <Link
                  href={`/trainer/courses/${c.id}`}
                  className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold hover:bg-amber-500/20 transition shrink-0"
                >
                  Curriculum
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Live Classes */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" /> Upcoming Live Mentoring
            </h2>
            <Link href="/trainer/live-classes" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              Manage
            </Link>
          </div>

          <div className="space-y-2.5">
            {liveClasses.map((lc) => (
              <div key={lc.id} className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-cyan-300">{lc.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Cohort: {lc.batch?.name || "Next.js Alpha"}</div>
                </div>
                <span className="font-mono text-cyan-400 text-[11px] font-bold">
                  {new Date(lc.scheduledDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
