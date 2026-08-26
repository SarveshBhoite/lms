import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Video,
  HelpCircle,
  FileCheck,
  Award,
  ArrowRight,
  Clock,
  Play,
  Bell,
  CheckCircle2,
  Users,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const [
    student,
    enrollments,
    courseProgresses,
    liveClasses,
    quizAttempts,
    assignmentSubmissions,
    notifications,
    certificates,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
      include: {
        course: {
          include: {
            trainer: { select: { name: true } },
          },
        },
        batch: { select: { name: true } },
      },
    }),
    prisma.courseProgress.findMany({
      where: { userId: studentId },
      include: { course: { select: { id: true, title: true } } },
    }),
    prisma.liveClass.findMany({
      where: {
        batch: { students: { some: { userId: studentId } } },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
      include: {
        batch: { select: { name: true, course: { select: { title: true } } } },
        trainer: { select: { name: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 3,
    }),
    prisma.quizAttempt.findMany({
      where: { userId: studentId },
      select: { quizId: true },
    }),
    prisma.assignmentSubmission.findMany({
      where: { userId: studentId },
      select: { assignmentId: true },
    }),
    prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.certificate.findMany({
      where: { userId: studentId },
      include: { course: { select: { title: true } } },
    }),
  ]);

  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  const [availableQuizzes, availableAssignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { courseId: { in: enrolledCourseIds }, status: "PUBLISHED" },
      select: { id: true },
    }),
    prisma.assignment.findMany({
      where: { courseId: { in: enrolledCourseIds } },
      select: { id: true },
    }),
  ]);

  const attemptedQuizIds = new Set(quizAttempts.map((q) => q.quizId));
  const submittedAssignmentIds = new Set(assignmentSubmissions.map((a) => a.assignmentId));

  const pendingQuizzesCount = availableQuizzes.filter((q) => !attemptedQuizIds.has(q.id)).length;
  const pendingAssignmentsCount = availableAssignments.filter((a) => !submittedAssignmentIds.has(a.id)).length;

  const totalProgressPcts = courseProgresses.map((cp) => cp.progressPercent);
  const overallProgressPercent =
    totalProgressPcts.length > 0
      ? totalProgressPcts.reduce((a, b) => a + b, 0) / totalProgressPcts.length
      : 0;

  const lastActiveProgress = courseProgresses.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  )[0];

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
            STUDENT DASHBOARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Welcome back, {student?.name}!
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Continue learning your enrolled courses, view live sessions, and complete your tasks.
          </p>
        </div>

        {lastActiveProgress && (
          <Link
            href={`/student/courses/${lastActiveProgress.courseId}`}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition shrink-0"
          >
            <Play className="w-4 h-4 fill-white" /> Continue Learning
          </Link>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">Enrolled Courses</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{enrollments.length}</div>
          <p className="text-[11px] text-slate-500 font-mono">Active cohorts enrolled</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">Overall Progress</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{overallProgressPercent.toFixed(1)}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(overallProgressPercent, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">Pending Quizzes</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingQuizzesCount}</div>
          <p className="text-[11px] text-purple-700 font-mono font-bold">Assessments to attempt</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">Pending Assignments</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingAssignmentsCount}</div>
          <p className="text-[11px] text-rose-700 font-mono font-bold">Submissions due</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Enrolled Courses</h2>
            <Link href="/student/courses" className="text-xs font-bold text-indigo-600 hover:underline">
              View All Courses
            </Link>
          </div>

          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((en) => {
                const cp = courseProgresses.find((p) => p.courseId === en.courseId);
                const progPct = cp ? cp.progressPercent : 0;

                return (
                  <div key={en.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {en.batch?.name || "Cohort Member"}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{en.course.title}</h3>
                      <p className="text-xs text-slate-500 font-mono">Instructor: {en.course.trainer.name}</p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>Course Progress:</span>
                          <strong className="text-slate-900">{progPct.toFixed(1)}%</strong>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(progPct, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/student/courses/${en.courseId}`}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Continue Learning
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-xs">No active course enrollments assigned to your account.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-600" /> Upcoming Live Sessions
            </h2>

            {liveClasses.length > 0 ? (
              <div className="space-y-3">
                {liveClasses.map((lc) => (
                  <div key={lc.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lc.status === "LIVE" ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse" : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                      }`}>
                        {lc.status}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">{new Date(lc.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-slate-900">{lc.title}</div>
                    <a
                      href={lc.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
                    >
                      Join Google Meet
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No live sessions scheduled right now.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> Recent Updates
              </h2>
              <Link href="/student/notifications" className="text-[11px] font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 text-xs">{notif.title}</div>
                    <p className="text-slate-600 text-[11px] leading-tight">{notif.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No notifications logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
