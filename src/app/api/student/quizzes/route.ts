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

    // Get enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        status: "PUBLISHED",
      },
      include: {
        course: { select: { id: true, title: true } },
        questions: { select: { id: true } },
        quizAttempts: {
          where: { userId: studentId },
          orderBy: { startedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: quizzes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch quizzes" }, { status: 500 });
  }
}
