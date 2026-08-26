import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { include: { lessons: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

    // Upsert Enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: session.userId,
          courseId,
        },
      },
      create: {
        userId: session.userId,
        courseId,
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
    });

    // Upsert CourseProgress
    await prisma.courseProgress.upsert({
      where: {
        userId_courseId: {
          userId: session.userId,
          courseId,
        },
      },
      create: {
        userId: session.userId,
        courseId,
        totalLessonsCount: totalLessons,
        completedLessonsCount: 0,
        progressPercent: 0.0,
      },
      update: {
        totalLessonsCount: totalLessons,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled in ${course.title}`,
      enrollment,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
