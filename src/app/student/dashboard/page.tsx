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
  Calendar,
  Sparkles,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  // 1. Fetch Student Batches (via BatchStudent & Enrollment)
  const [batchStudents, userEnrollments] = await Promise.all([
    prisma.batchStudent.findMany({
      where: { userId: studentId },
      select: { batchId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
      select: { batchId: true, courseId: true },
    }),
  ]);

  const assignedBatchIds = Array.from(
    new Set([
      ...batchStudents.map((b) => b.batchId),
      ...userEnrollments.map((e) => e.batchId).filter(Boolean) as string[],
    ])
  );

  const [
    student,
    enrollments,
    courseProgresses,
    liveClasses,
    quizAttempts,
    assignmentSubmissions,
    notifications,
    certificates,
    attendances,
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
            modules: {
              include: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
        batch: { select: { name: true } },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.courseProgress.findMany({
      where: { userId: studentId },
      include: { course: { select: { id: true, title: true } } },
    }),
    prisma.liveClass.findMany({
      where: {
        OR: [
          { batchId: { in: assignedBatchIds } },
          { batchIds: { hasSome: assignedBatchIds } },
        ],
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
      select: { quizId: true, score: true, isPassed: true },
    }),
    prisma.assignmentSubmission.findMany({
      where: { userId: studentId },
      select: { assignmentId: true, status: true },
    }),
    prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: "desc" },
      take: 3, // Show latest 3 updates only
    }),
    prisma.certificate.findMany({
      where: { userId: studentId },
      include: { course: { select: { title: true } } },
    }),
    prisma.attendance.findMany({
      where: { userId: studentId },
      select: { status: true },
    }),
  ]);

  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  const [availableQuizzes, availableAssignments] = await Promise.all([
    prisma.quiz.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        status: "PUBLISHED",
        lessonId: null,
        OR: [
          { batchIds: { isEmpty: true } },
          { batchIds: { hasSome: assignedBatchIds } },
        ],
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        lessonId: null,
        OR: [
          { batchIds: { isEmpty: true } },
          { batchIds: { hasSome: assignedBatchIds } },
        ],
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: [
        { deadline: "desc" },
        { createdAt: "desc" },
      ],
    }),

  ]);

  const attemptedQuizIds = new Set(quizAttempts.map((q) => q.quizId));
  const submittedAssignmentIds = new Set(assignmentSubmissions.map((a) => a.assignmentId));

  const pendingQuizzesList = availableQuizzes.filter((q) => !attemptedQuizIds.has(q.id));
  const pendingAssignmentsList = availableAssignments.filter((a) => !submittedAssignmentIds.has(a.id));

  const pendingQuizzesCount = pendingQuizzesList.length;
  const pendingAssignmentsCount = pendingAssignmentsList.length;

  const totalProgressPcts = courseProgresses.map((cp) => cp.progressPercent);
  const overallProgressPercent =
    totalProgressPcts.length > 0
      ? totalProgressPcts.reduce((a, b) => a + b, 0) / totalProgressPcts.length
      : 0;

  // Real Attendance KPI
  const evaluatedAttendances = attendances.filter((a) => a.status !== "EXCUSED");
  const presentCount = evaluatedAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = evaluatedAttendances.length > 0 ? (presentCount / evaluatedAttendances.length) * 100 : 100;

  const lastActiveProgress = courseProgresses.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  )[0];

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Student Academic Workspace
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, <span className="jvm-gradient-text">{student?.name || "Learner"}</span>! 👋
          </h1>
        </div>

        <div className="shrink-0 relative z-10">
          {lastActiveProgress ? (
            <Link
              href={`/student/courses/${lastActiveProgress.courseId}`}
              className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Continue
            </Link>
          ) : (
            <Link
              href="/student/courses"
              className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen className="w-3.5 h-3.5" /> Continue
            </Link>
          )}
        </div>
      </div>

      {/* 4 Enhanced Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Enrolled Courses */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">Active Courses</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E2B88] flex items-center justify-center transition group-hover:scale-110">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{enrollments.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E2B88]" />
            {assignedBatchIds.length} Assigned Cohort(s)
          </div>
        </div>

        {/* Metric 2: Curriculum Completion */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">Curriculum Progress</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-[#7C248C] flex items-center justify-center transition group-hover:scale-110">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{overallProgressPercent.toFixed(1)}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="jvm-gradient-bg h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallProgressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Live Attendance Rate */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">Live Attendance</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center transition group-hover:scale-110">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{attendanceRate.toFixed(1)}%</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {presentCount} / {evaluatedAttendances.length} Sessions Attended
          </div>
        </div>

        {/* Metric 4: Verified Certificates & Pending Tasks */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">Certificates</span>
            <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 text-[#E01E6A] flex items-center justify-center transition group-hover:scale-110">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{certificates.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#E01E6A] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E01E6A]" />
            {pendingQuizzesCount + pendingAssignmentsCount} Pending Assessment(s)
          </div>
        </div>
      </div>

      {/* Pending Tasks & Action Center */}
      {(pendingQuizzesCount > 0 || pendingAssignmentsCount > 0) && (
        <div className="glass-card p-6 rounded-3xl border border-purple-200/80 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/30 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E01E6A] animate-ping" />
              <h2 className="text-base font-bold text-slate-900">Pending Tasks Requiring Action</h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#7C248C]">
              {pendingQuizzesCount} Quizzes &bull; {pendingAssignmentsCount} Assignments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {pendingQuizzesList.slice(0, 2).map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-[#7C248C]">
                      Quiz
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate">{quiz.course.title}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{quiz.title}</h4>
                </div>
                <Link
                  href="/student/quizzes"
                  className="px-3.5 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white text-xs font-bold shrink-0 transition"
                >
                  Start Quiz
                </Link>
              </div>
            ))}

            {pendingAssignmentsList.slice(0, 2).map((asgn) => (
              <div
                key={asgn.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-100 text-[#E01E6A]">
                      Assignment
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate">{asgn.course.title}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{asgn.title}</h4>
                </div>
                <Link
                  href="/student/assignments"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition"
                >
                  Submit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Enrolled Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Programs & Modules</h2>
              <p className="text-xs text-slate-500">Pick up right where you left off in your curriculum.</p>
            </div>
            <Link
              href="/student/courses"
              className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1"
            >
              All Courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {enrollments.length > 0 ? (
            <div className={enrollments.length === 1 ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
              {enrollments.map((en) => {
                const cp = courseProgresses.find((p) => p.courseId === en.courseId);
                const progPct = cp ? cp.progressPercent : 0;
                const totalLessons = en.course.modules.reduce(
                  (acc: number, m: any) => acc + (m.lessons?.length || 0),
                  0
                );
                const completedCount = cp ? cp.completedLessonsCount : 0;

                // When there is only 1 course, present it horizontally with rich details to fill the desktop space
                if (enrollments.length === 1) {
                  return (
                    <div
                      key={en.id}
                      className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:border-purple-300 transition group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6"
                    >
                      {/* Left: Info & Trainer */}
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60">
                            {en.batch?.name || "Assigned Cohort"}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-slate-500">
                            {completedCount} of {totalLessons} Lessons Completed
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl group-hover:text-[#7C248C] transition tracking-tight">
                            {en.course.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                            <span>Faculty: <strong className="text-slate-700 font-semibold">{en.course.trainer.name}</strong></span>
                            <span>&bull;</span>
                            <span>{en.course.modules.length} {en.course.modules.length === 1 ? "Module" : "Modules"}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1 max-w-lg">
                          <div className="flex justify-between text-[11px] font-mono text-slate-600">
                            <span>Curriculum Progress</span>
                            <strong className="text-slate-900 font-bold">{progPct.toFixed(1)}%</strong>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="jvm-gradient-bg h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="shrink-0 flex items-center md:self-center">
                        <Link
                          href={`/student/courses/${en.courseId}`}
                          className="w-full md:w-auto px-6 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Play className="w-4 h-4 fill-white" /> Continue Learning
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={en.id}
                    className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4 flex flex-col justify-between hover:border-purple-300 transition group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60">
                          {en.batch?.name || "Assigned Cohort"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {completedCount}/{totalLessons} Lessons
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-[#7C248C] transition">
                          {en.course.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Trainer: {en.course.trainer.name}</p>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>Progress:</span>
                          <strong className="text-slate-900">{progPct.toFixed(1)}%</strong>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="jvm-gradient-bg h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/student/courses/${en.courseId}`}
                      className="w-full py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Continue Learning
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-500 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No active course enrollments assigned to your account.</p>
              <Link
                href="/student/courses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl jvm-gradient-bg text-white text-xs font-bold"
              >
                Explore Catalog
              </Link>
            </div>
          )}
        </div>

        {/* Right 1 Column: Live Classes & 3 Latest Updates */}
        <div className="space-y-6">
          {/* Upcoming Live Sessions */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-[#1E2B88]" /> Upcoming Live Classes
              </h2>
              <Link href="/student/live-classes" className="text-[11px] font-bold text-[#7C248C] hover:underline">
                View All
              </Link>
            </div>

            {liveClasses.length > 0 ? (
              <div className="space-y-3">
                {liveClasses.map((lc) => (
                  <div key={lc.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          lc.status === "LIVE"
                            ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-200"
                            : "bg-purple-100 text-[#7C248C] border border-purple-200/50"
                        }`}
                      >
                        {lc.status}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(lc.scheduledDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{lc.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">Cohort: {lc.batch.name}</p>
                    </div>

                    <Link
                      href="/student/live-classes"
                      className="w-full py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-xs hover:scale-[1.01]"
                    >
                      <Video className="w-3.5 h-3.5" /> Enter Live Class
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                No live sessions scheduled right now.
              </div>
            )}
          </div>

          {/* Latest 3 Updates / Notifications */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C248C]" /> Recent Updates (Latest 3)
              </h2>
              <Link href="/student/notifications" className="text-[11px] font-bold text-[#7C248C] hover:underline">
                All
              </Link>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1 text-xs hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs line-clamp-1">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{notif.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent updates logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

