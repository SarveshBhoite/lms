import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // 1. Compute 6-month intervals for monthly enrollment and user growth trends
  const monthIntervals: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleDateString("en-US", { month: "short" });
    monthIntervals.push({ start, end, label });
  }

  // 2. Comprehensive parallel queries for system-wide intelligence
  const [
    // Students
    totalStudents,
    activeStudents,
    studentsWithVerifiedEmail,
    studentsEnrolledInBatches,

    // Trainers
    totalTrainers,
    activeTrainers,

    // Courses & Content
    totalCourses,
    publishedCourses,
    draftCourses,
    archivedCourses,
    totalModules,
    totalLessons,
    coursesByLevel,

    // Batches
    totalBatches,
    ongoingBatches,
    upcomingBatches,
    completedBatches,

    // Live Classes & Attendance
    totalLiveClasses,
    totalAttendances,
    attendancePresent,
    attendanceLate,
    attendanceAbsent,
    attendanceExcused,

    // Assignments & Submissions
    totalAssignments,
    totalSubmissions,
    pendingSubmissions,
    evaluatedSubmissions,
    resubmissionRequests,

    // Quizzes & Attempts
    totalQuizzes,
    totalQuizAttempts,
    passedQuizAttempts,
    avgQuizScoreRaw,

    // Certificates
    totalCertificates,
    activeCertificates,

    // Timeline Data (6-month enrollments)
    month1Enrollments,
    month2Enrollments,
    month3Enrollments,
    month4Enrollments,
    month5Enrollments,
    month6Enrollments,

    // Top Courses
    topCoursesRaw,

    // Faculty Roster with workload
    facultyWorkloadRaw,

    // Upcoming Live Classes
    upcomingClassesRaw,

    // Recent Student Admissions
    recentStudentsRaw,

    // Recent System Activity Logs
    recentActivitiesRaw,
  ] = await Promise.all([
    // Student Counts
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({ where: { role: "STUDENT", isEmailVerified: true } }),
    prisma.batchStudent.groupBy({ by: ["userId"] }).then((res) => res.length),

    // Faculty Counts
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.user.count({ where: { role: "TRAINER", isActive: true } }),

    // Courses & Content
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.course.count({ where: { status: "DRAFT" } }),
    prisma.course.count({ where: { status: "ARCHIVED" } }),
    prisma.courseModule.count(),
    prisma.lesson.count(),
    prisma.course.groupBy({
      by: ["level"],
      _count: { id: true },
    }),

    // Batches
    prisma.batch.count(),
    prisma.batch.count({ where: { status: "ONGOING" } }),
    prisma.batch.count({ where: { status: "UPCOMING" } }),
    prisma.batch.count({ where: { status: "COMPLETED" } }),

    // Live Classes & Attendance
    prisma.liveClass.count(),
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: "PRESENT" } }),
    prisma.attendance.count({ where: { status: "LATE" } }),
    prisma.attendance.count({ where: { status: "ABSENT" } }),
    prisma.attendance.count({ where: { status: "EXCUSED" } }),

    // Assignments
    prisma.assignment.count(),
    prisma.assignmentSubmission.count(),
    prisma.assignmentSubmission.count({ where: { status: "SUBMITTED" } }),
    prisma.assignmentSubmission.count({ where: { status: "EVALUATED" } }),
    prisma.assignmentSubmission.count({ where: { status: "RESUBMISSION_REQUESTED" } }),

    // Quizzes
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { isPassed: true } }),
    prisma.quizAttempt.aggregate({ _avg: { score: true } }),

    // Certificates
    prisma.certificate.count(),
    prisma.certificate.count({ where: { qrCodeUrl: { not: null } } }),

    // 6 Months Enrollment Trends
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthIntervals[0].start, lt: monthIntervals[0].end } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthIntervals[1].start, lt: monthIntervals[1].end } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthIntervals[2].start, lt: monthIntervals[2].end } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthIntervals[3].start, lt: monthIntervals[3].end } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthIntervals[4].start, lt: monthIntervals[4].end } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthIntervals[5].start, lt: monthIntervals[5].end } } }),

    // Top 5 Courses by Enrollments and Batches
    prisma.course.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        level: true,
        status: true,
        _count: { select: { enrollments: true, batches: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
    }),

    // Faculty workload
    prisma.user.findMany({
      where: { role: "TRAINER" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        profile: { select: { designation: true, avatarUrl: true } },
        _count: {
          select: {
            coursesCreated: true,
            trainerBatches: true,
            liveClassesTaught: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Upcoming Live Classes
    prisma.liveClass.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
      },
      take: 4,
      orderBy: { scheduledDate: "asc" },
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
      },
    }),

    // Recent Students
    prisma.user.findMany({
      where: { role: "STUDENT" },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        profile: { select: { avatarUrl: true, phone: true } },
        enrollments: {
          take: 1,
          select: {
            course: { select: { title: true } },
            batch: { select: { name: true } },
          },
        },
      },
    }),

    // Recent System Activity Logs
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);

  // Format 6-month trend array
  const monthlyCounts = [
    month1Enrollments,
    month2Enrollments,
    month3Enrollments,
    month4Enrollments,
    month5Enrollments,
    month6Enrollments,
  ];

  const enrollmentTrend = monthIntervals.map((m, idx) => ({
    label: m.label,
    count: monthlyCounts[idx] || 0,
  }));

  // Overall attendance turnout calculation
  const totalAttended = attendancePresent + attendanceLate;
  const attendanceTurnoutPct = totalAttendances > 0 ? Math.round((totalAttended / totalAttendances) * 100) : 0;

  // Quiz pass rate calculation
  const quizPassRatePct = totalQuizAttempts > 0 ? Math.round((passedQuizAttempts / totalQuizAttempts) * 100) : 0;
  const avgQuizScore = Math.round(avgQuizScoreRaw._avg.score || 0);

  // Assignment evaluated rate
  const assignmentEvaluatedPct = totalSubmissions > 0 ? Math.round((evaluatedSubmissions / totalSubmissions) * 100) : 0;

  // Course Level counts map
  const levelCounts: Record<string, number> = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
  };
  coursesByLevel.forEach((c) => {
    if (c.level && levelCounts[c.level] !== undefined) {
      levelCounts[c.level] = c._count.id;
    }
  });

  const payload = {
    admin: {
      id: session.userId,
      name: session.name,
      email: session.email,
    },
    metrics: {
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
        activeRatePct: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
        enrolledInBatches: studentsEnrolledInBatches,
        verifiedEmail: studentsWithVerifiedEmail,
      },
      trainers: {
        total: totalTrainers,
        active: activeTrainers,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
        archived: archivedCourses,
        modules: totalModules,
        lessons: totalLessons,
        levelCounts,
      },
      batches: {
        total: totalBatches,
        ongoing: ongoingBatches,
        upcoming: upcomingBatches,
        completed: completedBatches,
      },
      liveClasses: {
        total: totalLiveClasses,
        turnoutPct: attendanceTurnoutPct,
        attendance: {
          total: totalAttendances,
          present: attendancePresent,
          late: attendanceLate,
          absent: attendanceAbsent,
          excused: attendanceExcused,
        },
      },
      assignments: {
        total: totalAssignments,
        submissions: totalSubmissions,
        pending: pendingSubmissions,
        evaluated: evaluatedSubmissions,
        resubmission: resubmissionRequests,
        evaluatedPct: assignmentEvaluatedPct,
      },
      quizzes: {
        total: totalQuizzes,
        attempts: totalQuizAttempts,
        passed: passedQuizAttempts,
        passRatePct: quizPassRatePct,
        avgScore: avgQuizScore,
      },
      certificates: {
        total: totalCertificates,
        active: activeCertificates,
      },
    },
    trends: {
      enrollments: enrollmentTrend,
    },
    topCourses: topCoursesRaw.map((c) => ({
      id: c.id,
      title: c.title,
      level: c.level,
      status: c.status,
      enrollmentCount: c._count.enrollments,
      batchCount: c._count.batches,
    })),
    facultyWorkload: facultyWorkloadRaw.map((f) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      isActive: f.isActive,
      designation: f.profile?.designation || "Faculty Instructor",
      avatarUrl: f.profile?.avatarUrl,
      coursesCount: f._count.coursesCreated,
      batchesCount: f._count.trainerBatches,
      liveClassesCount: f._count.liveClassesTaught,
    })),
    upcomingClasses: upcomingClassesRaw.map((lc) => ({
      id: lc.id,
      title: lc.title,
      scheduledDate: lc.scheduledDate.toISOString(),
      startTime: lc.startTime,
      status: lc.status,
      courseTitle: lc.course?.title || "Special Session",
      batchName: lc.batch?.name || "Open Cohort",
      trainerName: lc.trainer.name,
    })),
    recentStudents: recentStudentsRaw.map((st) => ({
      id: st.id,
      name: st.name,
      email: st.email,
      isActive: st.isActive,
      avatarUrl: st.profile?.avatarUrl,
      phone: st.profile?.phone,
      createdAt: st.createdAt.toISOString(),
      courseTitle: st.enrollments[0]?.course?.title || "Not Enrolled",
      batchName: st.enrollments[0]?.batch?.name || "Self-Paced",
    })),
    recentActivities: recentActivitiesRaw.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      userName: log.user?.name || "System Automated",
      userRole: log.user?.role || "SYSTEM",
    })),
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <AdminDashboardClient data={payload} />
    </div>
  );
}
