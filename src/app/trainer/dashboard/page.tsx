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
  CheckCircle2,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { redirect } from "next/navigation";
import TrainerAnalyticsSection from "./TrainerAnalyticsSection";

export default async function TrainerDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, name: true },
  });

  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const now = new Date();

  // Parallel optimized data fetching for faculty workspace
  const [
    courses,
    rawBatches,
    assignments,
    quizzes,
    upcomingLiveClasses,
    recentSubmissions,
    recentQuizAttempts,
    recentBatchStudents,
    completedClassesCount,
  ] = await Promise.all([
    // 1. Courses assigned
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
        modules: { include: { lessons: { select: { id: true } } } },
        enrollments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 2. Batches assigned with live classes and attendances for analytics
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
        students: { select: { id: true } },
        liveClasses: {
          select: {
            id: true,
            status: true,
            attendances: { select: { status: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    }),

    // 3. Assignments assigned
    prisma.assignment.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          },
      include: {
        course: { select: { title: true } },
        submissions: { select: { id: true, status: true, submittedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 4. Quizzes assigned
    prisma.quiz.findMany({
      where: {
        lessonId: null,
        ...(isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            }),
      },
      include: {
        course: { select: { title: true } },
        questions: { select: { id: true } },
        quizAttempts: { select: { id: true, score: true, isPassed: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 5. Strictly upcoming live interactive sessions (scheduledDate >= now, status not CANCELLED)
    prisma.liveClass.findMany({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { trainerId },
                { batch: { trainers: { some: { trainerId } } } },
                { batch: { course: { trainerId } } },
              ],
            }),
        scheduledDate: { gte: now },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
      include: {
        batch: { select: { name: true, course: { select: { title: true } } } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 6,
    }),

    // 6. Recent assignment submissions by students (academic feed)
    prisma.assignmentSubmission.findMany({
      where: {
        assignment: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            },
      },
      include: {
        user: { select: { name: true, email: true } },
        assignment: { select: { id: true, title: true, course: { select: { title: true } } } },
      },
      orderBy: { submittedAt: "desc" },
      take: 3,
    }),

    // 7. Recent quiz attempts submitted by students (academic feed)
    prisma.quizAttempt.findMany({
      where: {
        quiz: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            },
      },
      include: {
        user: { select: { name: true } },
        quiz: { select: { id: true, title: true, course: { select: { title: true } } } },
      },
      orderBy: { startedAt: "desc" },
      take: 3,
    }),

    // 8. Recent student cohort enrollments
    prisma.batchStudent.findMany({
      where: {
        batch: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { trainers: { some: { trainerId } } },
              ],
            },
      },
      include: {
        user: { select: { name: true, email: true } },
        batch: { select: { name: true, course: { select: { title: true } } } },
      },
      orderBy: { joinedAt: "desc" },
      take: 3,
    }),

    // 9. Completed classes count
    prisma.liveClass.count({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { trainerId },
                { batch: { trainers: { some: { trainerId } } } },
                { batch: { course: { trainerId } } },
              ],
            }),
        status: "COMPLETED",
      },
    }),
  ]);

  // Dynamic calculated KPI metrics
  const assignedCoursesCount = courses.length;
  const myBatchesCount = rawBatches.length;
  const totalStudents = courses.reduce((acc, c) => acc + c.enrollments.length, 0);
  const activeCohortsCount = rawBatches.filter((b) => b.students.length > 0).length;

  const allSubmissions = assignments.flatMap((a) => a.submissions);
  const pendingGradingCount = allSubmissions.filter((s) => s.status === "SUBMITTED").length;
  const evaluatedCount = allSubmissions.filter((s) => s.status === "EVALUATED").length;
  const assignmentEvalRate = allSubmissions.length > 0 ? Math.round((evaluatedCount / allSubmissions.length) * 100) : 100;

  const allAttempts = quizzes.flatMap((q) => q.quizAttempts);
  const totalAttemptsCount = allAttempts.length;
  const passedAttemptsCount = allAttempts.filter((a) => a.isPassed).length;
  const quizPassRate = totalAttemptsCount > 0 ? Math.round((passedAttemptsCount / totalAttemptsCount) * 100) : 100;

  // Process Batch analytics data for interactive charts
  let totalAttendedOverall = 0;
  let totalPossibleOverall = 0;

  const analyticsBatches = rawBatches.map((b) => {
    const studentCount = b.students.length;
    const classesCount = b.liveClasses.length;
    const batchAttended = b.liveClasses.reduce(
      (acc, lc) =>
        acc +
        lc.attendances.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
        ).length,
      0
    );
    const batchPossible = classesCount * (studentCount || 1);
    totalAttendedOverall += batchAttended;
    totalPossibleOverall += batchPossible;

    const attendancePct =
      classesCount > 0 && studentCount > 0 ? Math.round((batchAttended / batchPossible) * 100) : 0;

    return {
      id: b.id,
      name: b.name,
      courseTitle: b.course.title,
      studentCount,
      classesCount,
      attendancePct,
      assignmentSubmissionCount: 0,
    };
  });

  const avgAttendanceRate =
    totalPossibleOverall > 0 ? Math.round((totalAttendedOverall / totalPossibleOverall) * 100) : 100;

  // Build Unified Academic Activity Stream (EXACTLY latest 3 only as requested)
  type ActivityFeedItem = {
    id: string;
    type: "ASSIGNMENT_SUBMITTED" | "QUIZ_COMPLETED" | "STUDENT_ENROLLED";
    title: string;
    subtitle: string;
    studentName: string;
    timestamp: Date;
    statusText?: string;
    href: string;
  };

  const activityFeed: ActivityFeedItem[] = [
    ...recentSubmissions.map((sub) => ({
      id: `sub-${sub.id}`,
      type: "ASSIGNMENT_SUBMITTED" as const,
      title: sub.assignment.title,
      subtitle: sub.assignment.course.title,
      studentName: sub.user.name,
      timestamp: new Date(sub.submittedAt),
      statusText: sub.status === "SUBMITTED" ? "Needs Grading" : "Evaluated",
      href: "/trainer/assignments",
    })),
    ...recentQuizAttempts.map((att) => ({
      id: `att-${att.id}`,
      type: "QUIZ_COMPLETED" as const,
      title: att.quiz.title,
      subtitle: att.quiz.course.title,
      studentName: att.user.name,
      timestamp: new Date(att.startedAt),
      statusText: att.isPassed ? `Passed (${att.score}%)` : `Failed (${att.score}%)`,
      href: "/trainer/quizzes",
    })),
    ...recentBatchStudents.map((bs) => ({
      id: `bs-${bs.id}`,
      type: "STUDENT_ENROLLED" as const,
      title: `Joined ${bs.batch.name}`,
      subtitle: bs.batch.course.title,
      studentName: bs.user.name,
      timestamp: new Date(bs.joinedAt),
      statusText: "New Cohort Member",
      href: "/trainer/students",
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 3); // STRICTLY 3 latest per user request

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. Header Banner (~10% vh, matching JVM Institute studio standard) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Faculty Command Center
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="jvm-gradient-text">{dbUser.name}</span>! 🎓
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            href="/trainer/live-classes"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition flex items-center gap-2"
          >
            <Video className="w-4 h-4 text-cyan-600" /> Live Schedule
          </Link>
          <Link
            href="/trainer/batches/create"
            className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create Batch
          </Link>
        </div>
      </div>

      {/* 2. Premium Visual KPI Metric Grid (Handcrafted Studio Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Courses */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-[#1E2B88]/40 hover:shadow-sm group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-blue-50/50 pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Courses</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100/80 text-[#1E2B88] flex items-center justify-center transition group-hover:scale-110">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{assignedCoursesCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E2B88]" />
            Active Scope
          </div>
        </div>

        {/* Card 2: Batches */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-[#7C248C]/40 hover:shadow-sm group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-purple-50/50 pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Cohorts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100/80 text-[#7C248C] flex items-center justify-center transition group-hover:scale-110">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#7C248C] tracking-tight">{myBatchesCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C248C]" />
            {activeCohortsCount} Ongoing
          </div>
        </div>

        {/* Card 3: Total Enrolled Students */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-indigo-400/40 hover:shadow-sm group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-indigo-50/50 pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Students</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center transition group-hover:scale-110">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight">{totalStudents}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Enrolled Total
          </div>
        </div>

        {/* Card 4: Upcoming Live Classes */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-rose-400/40 hover:shadow-sm group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-rose-50/50 pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Live Classes</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100/80 text-rose-600 flex items-center justify-center transition group-hover:scale-110">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">{upcomingLiveClasses.length}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Upcoming
          </div>
        </div>

        {/* Card 5: Pending Grading */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-amber-400/40 hover:shadow-sm group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-amber-50/50 pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600 flex items-center justify-center transition group-hover:scale-110">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">{pendingGradingCount}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {assignmentEvalRate}% Done
          </div>
        </div>

        {/* Card 6: Active Quizzes */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-emerald-400/40 hover:shadow-sm group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-emerald-50/50 pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Quizzes</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center transition group-hover:scale-110">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{quizzes.length}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {quizPassRate}% Pass
          </div>
        </div>
      </div>

      {/* 3. Interactive Multi-Parameter Analytics Component (Bars & Donut Charts) */}
      <TrainerAnalyticsSection
        batches={analyticsBatches}
        totalStudents={totalStudents}
        totalClasses={completedClassesCount + upcomingLiveClasses.length}
        avgAttendanceRate={avgAttendanceRate}
        assignmentEvalRate={assignmentEvalRate}
        quizPassRate={quizPassRate}
      />

      {/* 4. Upcoming Live Sessions & Live Academic Feed (Latest 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: STRICTLY Upcoming Live Sessions */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-600" /> Upcoming Live Interactive Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Only scheduled upcoming classes with one-click Google Meet launch room.
              </p>
            </div>
            <Link
              href="/trainer/live-classes"
              className="text-xs font-bold text-[#7C248C] hover:underline flex items-center gap-1"
            >
              Full Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingLiveClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingLiveClasses.map((lc) => (
                <div
                  key={lc.id}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50/70 border border-slate-200/80 space-y-3 flex flex-col justify-between hover:border-purple-300 transition group shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          lc.status === "LIVE"
                            ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-200"
                            : "bg-purple-100 text-[#7C248C] border border-purple-200/60"
                        }`}
                      >
                        {lc.status}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(lc.scheduledDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-[#7C248C] transition">
                        {lc.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        Cohort: {lc.batch.name} &bull; {lc.batch.course.title}
                      </p>
                    </div>
                  </div>

                  <a
                    href={lc.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Video className="w-3.5 h-3.5" /> Launch Meet Room
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700">No Upcoming Sessions</h4>
                <p className="text-[11px] text-slate-400">
                  You currently have no scheduled live classes coming up.
                </p>
              </div>
              <Link
                href="/trainer/live-classes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl jvm-gradient-bg text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Class
              </Link>
            </div>
          )}
        </div>

        {/* Right 1 Column: Real Academic Activity Stream (EXACTLY LATEST 3) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C248C]" /> Academic Stream
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Latest 3 Submissions</p>
            </div>
          </div>

          {activityFeed.length > 0 ? (
            <div className="space-y-3">
              {activityFeed.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-purple-50/40 border border-slate-200/70 hover:border-purple-200 transition flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${
                          item.type === "ASSIGNMENT_SUBMITTED"
                            ? "bg-amber-100 text-amber-800"
                            : item.type === "QUIZ_COMPLETED"
                            ? "bg-purple-100 text-[#7C248C]"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {item.type === "ASSIGNMENT_SUBMITTED"
                          ? "Assignment"
                          : item.type === "QUIZ_COMPLETED"
                          ? "Quiz"
                          : "Enrollment"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 group-hover:text-[#7C248C] transition truncate">
                      {item.title}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-800 truncate">{item.studentName}</span>
                      <span>&bull;</span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">{item.subtitle}</span>
                    </div>
                  </div>

                  {item.statusText && (
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shrink-0 shadow-2xs group-hover:border-purple-200">
                      {item.statusText}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No student submissions recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Complete Portal Overview & Quick Modules Matrix */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">Faculty Workspace Modules</h2>
          <p className="text-xs text-slate-500">Full ecosystem overview for academic operations and records.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/trainer/courses"
            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1E2B88] flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#7C248C] transition">My Courses</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Syllabus & curriculum</div>
            </div>
          </Link>

          <Link
            href="/trainer/batches"
            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-[#7C248C] flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#7C248C] transition">Batches</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cohorts & members</div>
            </div>
          </Link>

          <Link
            href="/trainer/quizzes"
            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#7C248C] transition">Assessments</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Quizzes & tests</div>
            </div>
          </Link>

          <Link
            href="/trainer/assignments"
            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#7C248C] transition">Grading</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Review submissions</div>
            </div>
          </Link>

          <Link
            href="/trainer/attendance"
            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#7C248C] transition">Attendance</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Class session logs</div>
            </div>
          </Link>

          <Link
            href="/trainer/reports"
            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#7C248C] transition">Reports</div>
              <div className="text-[10px] text-slate-500 mt-0.5">CSV & Excel exports</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
