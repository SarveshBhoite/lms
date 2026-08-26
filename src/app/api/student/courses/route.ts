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

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
      include: {
        course: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
            modules: {
              select: { id: true, lessons: { select: { id: true } } },
            },
          },
        },
        batch: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    });

    const courseProgresses = await prisma.courseProgress.findMany({
      where: { userId: studentId },
    });

    const formattedCourses = enrollments.map((en) => {
      const progObj = courseProgresses.find((cp) => cp.courseId === en.courseId);
      const totalLessons = en.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

      return {
        id: en.course.id,
        title: en.course.title,
        slug: en.course.slug,
        description: en.course.description,
        thumbnailUrl: en.course.thumbnailUrl,
        level: en.course.level,
        durationHours: en.course.durationHours,
        trainer: en.course.trainer,
        batch: en.batch,
        progressPercent: progObj ? progObj.progressPercent : 0,
        completedLessonsCount: progObj ? progObj.completedLessonsCount : 0,
        totalLessonsCount: totalLessons,
      };
    });

    return NextResponse.json({ success: true, data: formattedCourses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch student courses" }, { status: 500 });
  }
}
