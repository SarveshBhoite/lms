import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  GraduationCap,
  BookOpen,
  Play,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  HelpCircle,
  Video,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
} from "lucide-react";
import { redirect } from "next/navigation";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const userId = session.userId;

  // Real Database Queries for the active student
  const [
    enrollments,
    courseProgresses,
    studentBatches,
    certificates,
    quizAttempts,
    assignmentSubmissions,
  ] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            trainer: { select: { name: true } },
            modules: {
              include: {
                lessons: {
                  orderBy: { orderIndex: "asc" },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        batch: true,
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.courseProgress.findMany({
      where: { userId },
    }),
    prisma.batchStudent.findMany({
      where: { userId },
      select: { batchId: true },
    }),
    prisma.certificate.findMany({
      where: { userId },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
    }),
    prisma.assignmentSubmission.findMany({
      where: { userId },
    }),
  ]);

  const batchIds = studentBatches.map((b) => b.batchId);

  // Fetch upcoming live classes for the student's batches
  const upcomingLiveClasses = await prisma.liveClass.findMany({
    where: {
      batchId: { in: batchIds.length > 0 ? batchIds : ["none"] },
      scheduledDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: {
      batch: true,
      trainer: { select: { name: true } },
    },
    orderBy: { scheduledDate: "asc" },
    take: 3,
  });

  // Calculate enrolled metrics
  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const primaryEnrollment = enrollments[0];
  const primaryProgress = courseProgresses.find(
    (cp) => cp.courseId === primaryEnrollment?.courseId
  );
  const primaryProgressPercent = primaryProgress?.progressPercent || 0;

  // Find the next lesson for primary course
  let nextLesson = null;
  if (primaryEnrollment?.course) {
    for (const mod of primaryEnrollment.course.modules) {
      if (mod.lessons.length > 0) {
        nextLesson = mod.lessons[0];
        break;
      }
    }
  }

  const completedCoursesCount = courseProgresses.filter((cp) => cp.isCompleted).length;
  const passedQuizzesCount = quizAttempts.filter((qa) => qa.isPassed).length;

  return (
    <div className="p-4 sm:p-8 lg:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Welcome & Continue Learning Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            {primaryEnrollment?.batch ? `Active Cohort: ${primaryEnrollment.batch.name}` : "Enrolled Academic Track"}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {session.name.split(" ")[0]}! 🚀
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            {primaryEnrollment
              ? `You are currently ${Math.round(primaryProgressPercent)}% through ${primaryEnrollment.course.title}. Keep up the momentum!`
              : "Explore the curriculum catalog to enroll in upcoming cohort tracks."}
          </p>
        </div>

        {primaryEnrollment && nextLesson ? (
          <Link
            href={`/student/lessons/${nextLesson.id}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.02] flex items-center justify-center gap-2 transition shrink-0"
          >
            <Play className="w-4 h-4 fill-white" /> Continue Learning
          </Link>
        ) : (
          <Link
            href="/student/courses"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition shrink-0"
          >
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        )}
      </div>

      {/* Real Summary Metric Cards (Responsive Grid: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enrolled Courses</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{enrollments.length}</div>
          <div className="text-[11px] text-indigo-400">{activeEnrollments.length} Active Tracks</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Tracks</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{completedCoursesCount}</div>
          <div className="text-[11px] text-slate-400">Graduated</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quizzes Passed</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{passedQuizzesCount}</div>
          <div className="text-[11px] text-slate-400">{quizAttempts.length} Total Attempts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Certificates Earned</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{certificates.length}</div>
          <div className="text-[11px] text-cyan-400 flex items-center gap-1">
            <Award className="w-3 h-3" /> Verifiable QR
          </div>
        </div>
      </div>

      {/* Main Grid Section: Enrolled Courses, Live Classes, Pending Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses Track */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Active Course
              </span>
              <Link href="/student/courses" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                All Courses
              </Link>
            </div>

            {primaryEnrollment ? (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white leading-snug">
                  {primaryEnrollment.course.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Trainer: {primaryEnrollment.course.trainer.name}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">Curriculum Progress</span>
                    <span className="text-indigo-400 font-mono font-bold">
                      {Math.round(primaryProgressPercent)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, primaryProgressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No active course enrollment found.
              </div>
            )}
          </div>

          {primaryEnrollment && (
            <Link
              href={`/student/courses/${primaryEnrollment.courseId}`}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              Open Syllabus <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Upcoming Live Classes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <Video className="w-4 h-4 text-cyan-400" /> Upcoming Live Class
              </span>
              <Link href="/student/live-classes" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
                Schedule
              </Link>
            </div>

            {upcomingLiveClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingLiveClasses.slice(0, 2).map((lc) => (
                  <div key={lc.id} className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-xs text-white truncate mr-2">{lc.title}</div>
                      <span className="text-[10px] text-cyan-300 font-mono shrink-0">
                        {new Date(lc.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Cohort: {lc.batch.name} • Prof. {lc.trainer.name}
                    </div>
                    <a
                      href={lc.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block w-full text-center py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                    >
                      Join Google Meet
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Video className="w-8 h-8 mx-auto text-slate-600" />
                <p>No upcoming live classes scheduled for your cohorts.</p>
              </div>
            )}
          </div>

          <Link
            href="/student/live-classes"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 hover:text-white transition"
          >
            View Live Calendar
          </Link>
        </div>

        {/* Assessments & Tasks */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <Award className="w-4 h-4 text-amber-400" /> Assessments & Tasks
              </span>
              <Link href="/student/quizzes" className="text-xs font-bold text-amber-400 hover:text-amber-300">
                Quizzes
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <Link
                href="/student/quizzes"
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between hover:border-amber-500/40 transition group block"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-amber-300 transition">Interactive Quizzes</div>
                  <div className="text-[11px] text-slate-400">Knowledge evaluations</div>
                </div>
                <span className="text-[11px] text-amber-400 font-mono font-bold">
                  {quizAttempts.length} Attempts
                </span>
              </Link>

              <Link
                href="/student/assignments"
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between hover:border-indigo-500/40 transition group block"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-indigo-300 transition">Project Assignments</div>
                  <div className="text-[11px] text-slate-400">Milestone submissions</div>
                </div>
                <span className="text-[11px] text-indigo-400 font-mono font-bold">
                  {assignmentSubmissions.length} Submitted
                </span>
              </Link>

              <Link
                href="/student/certificates"
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between hover:border-cyan-500/40 transition group block"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-300 transition">Verified Credentials</div>
                  <div className="text-[11px] text-slate-400">Official certificates</div>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono font-bold">
                  {certificates.length} Issued
                </span>
              </Link>
            </div>
          </div>

          <Link
            href="/student/certificates"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 hover:text-white transition"
          >
            Check Certificate Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

