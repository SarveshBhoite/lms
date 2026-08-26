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
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: enrolledCourseIds } },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          where: { userId: studentId },
          include: {
            feedback: { include: { trainer: { select: { name: true } } } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch assignments" }, { status: 500 });
  }
}
