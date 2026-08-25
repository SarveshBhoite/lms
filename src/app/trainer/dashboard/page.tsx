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
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;

  // Real Database Aggregations for the logged-in trainer
  const [courses, batches, assignments, liveClasses] = await Promise.all([
    prisma.course.findMany({
      where: session.role === "ADMIN" ? {} : { trainerId },
      include: {
        modules: { include: { lessons: true } },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.batch.findMany({
      where: session.role === "ADMIN" ? {} : { trainers: { some: { trainerId } } },
      include: {
        course: true,
        students: true,
      },
    }),
    prisma.assignment.findMany({
      where: session.role === "ADMIN" ? {} : { course: { trainerId } },
      include: { submissions: true },
    }),
    prisma.liveClass.findMany({
      where: session.role === "ADMIN" ? {} : { trainerId },
      include: { batch: true },
      orderBy: { scheduledDate: "asc" },
      take: 3,
    }),
  ]);

  const totalStudents = courses.reduce((acc, c) => acc + c.enrollments.length, 0);
  const activeCoursesCount = courses.filter((c) => c.status === "PUBLISHED").length;
  const pendingAssignmentsCount = assignments.reduce((acc, a) => acc + a.submissions.filter((s) => s.status === "SUBMITTED").length, 0);

  return (
    <div className="p-6 sm:p-10 space-y-10 max-w-7xl w-full mx-auto">
      {/* Top Welcome Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" /> Active Academic Quarter
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Good Morning, {session.name} 🎓
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Here&apos;s your teaching overview across assigned courses, live student cohorts, and pending evaluations.
          </p>
        </div>
      </div>

      {/* Real Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Courses</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{courses.length}</div>
          <div className="text-[11px] text-amber-400">Curricula</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Courses</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{activeCoursesCount}</div>
          <div className="text-[11px] text-slate-400">Published</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Students</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{totalStudents}</div>
          <div className="text-[11px] text-slate-400">Active Learners</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Batches</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{batches.length}</div>
          <div className="text-[11px] text-slate-400">Cohorts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Grading</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">{pendingAssignmentsCount}</div>
          <div className="text-[11px] text-slate-400">Submissions</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Classes</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">{liveClasses.length}</div>
          <div className="text-[11px] text-slate-400">Scheduled</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/trainer/courses/create"
            className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
            <span>Create Course</span>
          </Link>

          <Link
            href="/trainer/quizzes"
            className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
            <span>Create Quiz</span>
          </Link>

          <Link
            href="/trainer/assignments"
            className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
            <span>New Assignment</span>
          </Link>

          <Link
            href="/trainer/live-classes"
            className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
              <Video className="w-4 h-4" />
            </div>
            <span>Schedule Class</span>
          </Link>

          <Link
            href="/trainer/students"
            className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white group transition"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
            <span>View Students</span>
          </Link>
        </div>
      </div>

      {/* Assigned Courses Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" /> My Assigned Courses
          </h2>
          <Link href="/trainer/courses" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

              return (
                <div key={course.id} className="glass-card p-6 rounded-3xl space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {course.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{course.level}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-slate-800/80">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="text-xs font-bold text-white">{course.enrollments.length}</div>
                        <div className="text-[10px] text-slate-400">Students</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="text-xs font-bold text-white">{course.modules.length}</div>
                        <div className="text-[10px] text-slate-400">Modules</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="text-xs font-bold text-white">{totalLessons}</div>
                        <div className="text-[10px] text-slate-400">Lessons</div>
                      </div>
                    </div>

                    <Link
                      href={`/trainer/courses/${course.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      Manage Course <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm">No courses assigned to your faculty profile yet.</p>
          </div>
        )}
      </div>

      {/* Upcoming Live Classes & Active Cohorts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Classes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" /> Upcoming Live Classes
          </h2>

          {liveClasses.length > 0 ? (
            <div className="space-y-3">
              {liveClasses.map((lc) => (
                <div key={lc.id} className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-white">{lc.title}</span>
                    <span className="text-[11px] text-cyan-300 font-mono">{new Date(lc.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Batch: {lc.batch.name}
                  </div>
                  <a
                    href={lc.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block w-full text-center py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition"
                  >
                    Launch Google Meet
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No upcoming live classes scheduled.</div>
          )}
        </div>

        {/* Active Batches */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Active Academic Cohorts
          </h2>

          {batches.length > 0 ? (
            <div className="space-y-3">
              {batches.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{b.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Course: {b.course.title}</div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                    {b.students.length} Students
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No active cohorts mapped.</div>
          )}
        </div>
      </div>
    </div>
  );
}
