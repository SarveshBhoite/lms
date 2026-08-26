import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.userId;

    const [
      enrollments,
      studentBatches,
      courseProgresses,
      liveClasses,
      quizAttempts,
      assignmentSubmissions,
      notifications,
      certificates,
    ] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: studentId, status: "ACTIVE" },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              level: true,
              durationHours: true,
              trainer: { select: { name: true } },
            },
          },
          batch: { select: { id: true, name: true } },
        },
      }),
      prisma.batchStudent.findMany({
        where: { userId: studentId },
        select: { batchId: true },
      }),
      prisma.courseProgress.findMany({
        where: { userId: studentId },
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
        take: 5,
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
        take: 5,
      }),
      prisma.certificate.findMany({
        where: { userId: studentId },
        include: { course: { select: { title: true } } },
      }),
    ]);

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // Fetch pending quizzes and assignments for enrolled courses
    const [availableQuizzes, availableAssignments] = await Promise.all([
      prisma.quiz.findMany({
        where: { courseId: { in: enrolledCourseIds }, status: "PUBLISHED" },
        select: { id: true, title: true, courseId: true },
      }),
      prisma.assignment.findMany({
        where: { courseId: { in: enrolledCourseIds } },
        select: { id: true, title: true, deadline: true, courseId: true },
      }),
    ]);

    const attemptedQuizIds = new Set(quizAttempts.map((q) => q.quizId));
    const submittedAssignmentIds = new Set(assignmentSubmissions.map((a) => a.assignmentId));

    const pendingQuizzes = availableQuizzes.filter((q) => !attemptedQuizIds.has(q.id));
    const pendingAssignments = availableAssignments.filter((a) => !submittedAssignmentIds.has(a.id));

    // Calculate overall progress
    const totalProgressPcts = courseProgresses.map((cp) => cp.progressPercent);
    const overallProgressPercent =
      totalProgressPcts.length > 0
        ? totalProgressPcts.reduce((a, b) => a + b, 0) / totalProgressPcts.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        enrollments,
        overallProgressPercent: Number(overallProgressPercent.toFixed(1)),
        liveClasses,
        pendingQuizzesCount: pendingQuizzes.length,
        pendingAssignmentsCount: pendingAssignments.length,
        recentNotifications: notifications,
        certificates,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
