import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch timestamped data to allow real-time client-side time-frame slicing (7D, 30D, 90D, ALL)
  const [
    studentsRaw,
    trainersRaw,
    coursesRaw,
    batchesRaw,
    enrollmentsRaw,
    liveClassesRaw,
    submissionsRaw,
    quizAttemptsRaw,
    certificatesRaw,
    modulesCount,
    lessonsCount,
  ] = await Promise.all([
    // All students
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        createdAt: true,
        isActive: true,
        isEmailVerified: true,
      },
    }),

    // Faculty trainers
    prisma.user.findMany({
      where: { role: "TRAINER" },
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
    }),

    // Courses with counts
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        level: true,
        status: true,
        createdAt: true,
        _count: { select: { enrollments: true, batches: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
    }),

    // Batches with students
    prisma.batch.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        course: { select: { title: true } },
        _count: { select: { students: true } },
      },
      orderBy: { startDate: "desc" },
    }),

    // All Enrollments
    prisma.enrollment.findMany({
      select: {
        id: true,
        enrolledAt: true,
        status: true,
        courseId: true,
        batchId: true,
      },
    }),

    // All Live Classes with attendances
    prisma.liveClass.findMany({
      select: {
        id: true,
        title: true,
        scheduledDate: true,
        startTime: true,
        status: true,
        course: { select: { title: true } },
        batch: { select: { name: true } },
        trainer: { select: { name: true } },
        attendances: {
          select: {
            status: true,
            isApproved: true,
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    }),

    // Assignment Submissions
    prisma.assignmentSubmission.findMany({
      select: {
        id: true,
        submittedAt: true,
        status: true,
      },
    }),

    // Quiz Attempts
    prisma.quizAttempt.findMany({
      select: {
        id: true,
        startedAt: true,
        score: true,
        isPassed: true,
      },
    }),

    // Certificates
    prisma.certificate.findMany({
      select: {
        id: true,
        issueDate: true,
        qrCodeUrl: true,
      },
    }),

    // Totals for lessons & modules
    prisma.courseModule.count(),
    prisma.lesson.count(),
  ]);

  // Serialize raw items for client
  const serialized = {
    admin: {
      name: session.name,
      email: session.email,
    },
    students: studentsRaw.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      isActive: s.isActive,
      isEmailVerified: s.isEmailVerified,
    })),
    trainers: trainersRaw.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      isActive: t.isActive,
      designation: t.profile?.designation || "Faculty Instructor",
      avatarUrl: t.profile?.avatarUrl,
      coursesCount: t._count.coursesCreated,
      batchesCount: t._count.trainerBatches,
      liveClassesCount: t._count.liveClassesTaught,
    })),
    courses: coursesRaw.map((c) => ({
      id: c.id,
      title: c.title,
      level: c.level,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      enrollmentCount: c._count.enrollments,
      batchCount: c._count.batches,
    })),
    batches: batchesRaw.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      courseTitle: b.course?.title || "Assigned Course",
      studentCount: b._count.students,
    })),
    enrollments: enrollmentsRaw.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt.toISOString(),
      status: e.status,
      courseId: e.courseId,
      batchId: e.batchId,
    })),
    liveClasses: liveClassesRaw.map((lc) => ({
      id: lc.id,
      title: lc.title,
      scheduledDate: lc.scheduledDate.toISOString(),
      startTime: lc.startTime instanceof Date ? lc.startTime.toISOString() : String(lc.startTime),
      status: lc.status,
      courseTitle: lc.course?.title || "Special Session",
      batchName: lc.batch?.name || "Open Cohort",
      trainerName: lc.trainer.name,
      attendances: lc.attendances.map((a) => ({ status: a.status })),
    })),
    submissions: submissionsRaw.map((sub) => ({
      id: sub.id,
      submittedAt: sub.submittedAt.toISOString(),
      status: sub.status,
    })),
    quizAttempts: quizAttemptsRaw.map((qa) => ({
      id: qa.id,
      startedAt: qa.startedAt.toISOString(),
      score: qa.score,
      isPassed: qa.isPassed,
    })),
    certificates: certificatesRaw.map((cert) => ({
      id: cert.id,
      issueDate: cert.issueDate.toISOString(),
      hasQr: !!cert.qrCodeUrl,
    })),
    meta: {
      modulesCount,
      lessonsCount,
    },
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <AdminDashboardClient rawData={serialized} />
    </div>
  );
}
