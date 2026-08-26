import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

// GET: Return all students + course/batch enrollments accessible to trainer or admin
export async function GET(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // If Trainer, get trainer's courses and batches
    let courseIds: string[] = [];
    let batchIds: string[] = [];

    if (session.role !== "ADMIN") {
      const [trainerCourses, trainerBatches] = await Promise.all([
        prisma.course.findMany({
          where: { trainerId: session.userId },
          select: { id: true },
        }),
        prisma.batch.findMany({
          where: { trainers: { some: { trainerId: session.userId } } },
          select: { id: true },
        }),
      ]);
      courseIds = trainerCourses.map((c) => c.id);
      batchIds = trainerBatches.map((b) => b.id);
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        profile: {
          select: {
            avatarUrl: true,
            phone: true,
            designation: true,
            bio: true,
          },
        },
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
        studentBatches: {
          include: {
            batch: { select: { id: true, name: true, courseId: true } },
          },
        },
        courseProgresses: true,
        quizAttempts: {
          include: {
            quiz: { select: { id: true, title: true, passingMarks: true } },
          },
          orderBy: { startedAt: "desc" },
        },
        assignmentSubmissions: {
          include: {
            assignment: { select: { id: true, title: true, totalMarks: true } },
            feedback: true,
          },
          orderBy: { submittedAt: "desc" },
        },
        attendances: {
          include: {
            liveClass: { select: { id: true, title: true, scheduledDate: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch available courses and batches for enrolling
    const [courses, batches] = await Promise.all([
      prisma.course.findMany({
        where: session.role === "ADMIN" ? {} : { trainerId: session.userId },
        select: { id: true, title: true },
      }),
      prisma.batch.findMany({
        where: session.role === "ADMIN" ? {} : { trainers: { some: { trainerId: session.userId } } },
        select: { id: true, name: true, courseId: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      students,
      courses,
      batches,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Directly enroll a student into a Course and/or Batch
export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { studentId, courseId, batchId } = body;

    if (!studentId || !courseId) {
      return NextResponse.json(
        { success: false, error: "Student ID and Course Track are required." },
        { status: 400 }
      );
    }

    // Verify course belongs to trainer if not admin
    if (session.role !== "ADMIN") {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course || course.trainerId !== session.userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: You can only enroll students into your own course tracks." },
          { status: 403 }
        );
      }
    }

    // 1. Upsert Course Enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId,
        },
      },
      update: {
        batchId: batchId || null,
        status: "ACTIVE",
      },
      create: {
        userId: studentId,
        courseId,
        batchId: batchId || null,
        status: "ACTIVE",
      },
    });

    // 2. If Batch is provided, link student to batch
    if (batchId) {
      await prisma.batchStudent.upsert({
        where: {
          batchId_userId: {
            batchId,
            userId: studentId,
          },
        },
        update: {},
        create: {
          batchId,
          userId: studentId,
        },
      });
    }

    // 3. Initialize Course Progress if not existing
    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId } },
    });

    await prisma.courseProgress.upsert({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId,
        },
      },
      update: {
        totalLessonsCount: totalLessons,
      },
      create: {
        userId: studentId,
        courseId,
        totalLessonsCount: totalLessons,
        completedLessonsCount: 0,
        progressPercent: 0,
        isCompleted: false,
      },
    });

    // 4. Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "TRAINER_ENROLLED_STUDENT",
        resource: `Enrollment:${enrollment.id}`,
        details: {
          studentId,
          courseId,
          batchId,
          enrolledBy: session.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student successfully enrolled!",
      enrollment,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
