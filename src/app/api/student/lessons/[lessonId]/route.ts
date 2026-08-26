import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const session = await getSession();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        resources: true,
        module: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    lessons: {
                      select: { id: true, title: true, durationMinutes: true, contentType: true },
                      orderBy: { orderIndex: "asc" },
                    },
                  },
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    // Get progress if student is logged in
    let progress = null;
    let completedLessonIds: string[] = [];

    if (session?.userId) {
      progress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: session.userId,
            lessonId,
          },
        },
      });

      const allCompleted = await prisma.lessonProgress.findMany({
        where: {
          userId: session.userId,
          isCompleted: true,
        },
        select: { lessonId: true },
      });
      completedLessonIds = allCompleted.map((c) => c.lessonId);
    }

    return NextResponse.json({
      success: true,
      lesson,
      progress,
      completedLessonIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
