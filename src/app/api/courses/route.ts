import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          trainer: { select: { name: true, email: true } },
          modules: {
            include: {
              lessons: {
                include: { resources: true },
                orderBy: { orderIndex: "asc" },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
          enrollments: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, course });
    }

    const courses = await prisma.course.findMany({
      include: {
        trainer: { select: { name: true } },
        modules: { include: { lessons: true } },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}
