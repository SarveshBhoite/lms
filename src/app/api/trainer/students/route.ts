import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, handleApiError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const trainerId = session.userId;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const courseId = searchParams.get("courseId") || "";
    const batchId = searchParams.get("batchId") || "";

    // 1. Get trainer's assigned course & batch IDs
    const [assignedCourses, assignedBatches] = await Promise.all([
      prisma.course.findMany({
        where: isAdmin
          ? {}
          : {
              OR: [
                { trainerId },
                { batches: { some: { trainers: { some: { trainerId } } } } },
              ],
            },
        select: { id: true },
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
        select: { id: true },
      }),
    ]);

    const assignedCourseIds = assignedCourses.map((c) => c.id);
    const assignedBatchIds = assignedBatches.map((b) => b.id);

    // Build Prisma query filter
    const whereFilter: any = {
      role: "STUDENT",
      OR: [
        { enrollments: { some: { courseId: { in: assignedCourseIds } } } },
        { studentBatches: { some: { batchId: { in: assignedBatchIds } } } },
      ],
    };

    if (q) {
      whereFilter.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { profile: { phone: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    if (courseId) {
      whereFilter.enrollments = { some: { courseId } };
    }

    if (batchId) {
      whereFilter.studentBatches = { some: { batchId } };
    }

    const students = await prisma.user.findMany({
      where: whereFilter,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        profile: { select: { avatarUrl: true, phone: true, designation: true } },
        enrollments: {
          where: isAdmin ? {} : { courseId: { in: assignedCourseIds } },
          select: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
            status: true,
            enrolledAt: true,
          },
        },
        studentBatches: {
          where: isAdmin ? {} : { batchId: { in: assignedBatchIds } },
          select: { batch: { select: { id: true, name: true, courseId: true } } },
        },
        courseProgresses: {
          where: isAdmin ? {} : { courseId: { in: assignedCourseIds } },
          select: { progressPercent: true, completedLessonsCount: true, totalLessonsCount: true },
        },
        quizAttempts: {
          select: { score: true, isPassed: true },
        },
        assignmentSubmissions: {
          select: {
            status: true,
            feedback: { select: { marksAwarded: true } },
            assignment: { select: { totalMarks: true } },
          },
        },
        attendances: {
          select: { status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedData = students.map((s) => {
      const progObj = s.courseProgresses[0];
      const progressPercent = progObj ? progObj.progressPercent : 0;

      const totalAttendance = s.attendances.length;
      const presentCount = s.attendances.filter((a) => a.status === "PRESENT").length;
      const attendancePercent = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      const quizAvg =
        s.quizAttempts.length > 0
          ? s.quizAttempts.reduce((acc, q) => acc + q.score, 0) / s.quizAttempts.length
          : 0;

      const evaluatedSubs = s.assignmentSubmissions.filter((sub) => sub.feedback);
      const assignmentAvg =
        evaluatedSubs.length > 0
          ? evaluatedSubs.reduce(
              (acc, sub) => acc + ((sub.feedback?.marksAwarded || 0) / (sub.assignment.totalMarks || 100)) * 100,
              0
            ) / evaluatedSubs.length
          : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.profile?.phone || "N/A",
        avatarUrl: s.profile?.avatarUrl,
        courses: s.enrollments.map((e) => e.course.title),
        batches: s.studentBatches.map((b) => b.batch.name),
        progressPercent: Number(progressPercent.toFixed(1)),
        attendancePercent: Number(attendancePercent.toFixed(1)),
        quizAvg: Number(quizAvg.toFixed(1)),
        assignmentAvg: Number(assignmentAvg.toFixed(1)),
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    return handleApiError(error);
  }
}
