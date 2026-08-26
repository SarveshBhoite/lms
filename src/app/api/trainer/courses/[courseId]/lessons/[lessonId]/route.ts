import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";
import { ContentType } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const { courseId, lessonId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot edit lessons for this course", 403);
    }

    const body = await req.json();
    const {
      title,
      description,
      contentType,
      contentUrl,
      textContent,
      durationMinutes,
      orderIndex,
      isFreePreview,
    } = body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description || null;
    if (contentType !== undefined) {
      dataToUpdate.contentType = Object.values(ContentType).includes(contentType as ContentType)
        ? (contentType as ContentType)
        : ContentType.VIDEO;
    }
    if (contentUrl !== undefined) dataToUpdate.contentUrl = contentUrl || null;
    if (textContent !== undefined) dataToUpdate.textContent = textContent || null;
    if (durationMinutes !== undefined) dataToUpdate.durationMinutes = Number(durationMinutes);
    if (orderIndex !== undefined) dataToUpdate.orderIndex = Number(orderIndex);
    if (isFreePreview !== undefined) dataToUpdate.isFreePreview = Boolean(isFreePreview);

    const updatedLesson = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.update({
        where: { id: lessonId },
        data: dataToUpdate,
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "LESSON_UPDATED",
          resource: `Lesson:${lessonId}`,
          details: { title: lesson.title, courseId },
        },
      });

      return lesson;
    });

    return NextResponse.json({ success: true, data: updatedLesson });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const { courseId, lessonId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot delete lessons for this course", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.lesson.delete({
        where: { id: lessonId },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "LESSON_DELETED",
          resource: `Lesson:${lessonId}`,
          details: { courseId },
        },
      });
    });

    return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
