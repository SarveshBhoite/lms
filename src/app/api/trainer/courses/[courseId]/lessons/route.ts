import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";
import { ContentType } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { courseId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot add lessons to this course", 403);
    }

    const body = await req.json();
    const {
      moduleId,
      title,
      description,
      contentType = "VIDEO",
      contentUrl,
      textContent,
      durationMinutes = 0,
      orderIndex,
      isFreePreview = false,
    } = body;

    if (!moduleId || !title) {
      throw new Error("Module ID and Lesson title are required");
    }

    const validContentType = Object.values(ContentType).includes(contentType as ContentType)
      ? (contentType as ContentType)
      : ContentType.VIDEO;

    const maxOrderLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = orderIndex !== undefined ? Number(orderIndex) : (maxOrderLesson?.orderIndex ?? 0) + 1;

    const lessonRecord = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          moduleId,
          title,
          description: description || null,
          contentType: validContentType,
          contentUrl: contentUrl || null,
          textContent: textContent || null,
          durationMinutes: Number(durationMinutes) || 0,
          orderIndex: nextOrder,
          isFreePreview: Boolean(isFreePreview),
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "LESSON_CREATED",
          resource: `Lesson:${lesson.id}`,
          details: { title: lesson.title, moduleId, courseId },
        },
      });

      return lesson;
    });

    return NextResponse.json({ success: true, data: lessonRecord });
  } catch (error) {
    return handleApiError(error);
  }
}
