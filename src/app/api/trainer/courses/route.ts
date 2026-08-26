import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, handleApiError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";

    const courses = await prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId: session.userId },
              { batches: { some: { trainers: { some: { trainerId: session.userId } } } } },
            ],
          },
      include: {
        modules: {
          include: {
            lessons: {
              include: { resources: true },
            },
          },
        },
        enrollments: true,
        batches: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = courses.map((course) => {
      const totalModules = course.modules.length;
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const totalResources = course.modules.reduce(
        (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.resources.length, 0),
        0
      );

      return {
        ...course,
        stats: {
          totalModules,
          totalLessons,
          totalResources,
          totalStudents: course.enrollments.length,
          totalBatches: course.batches.length,
        },
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
