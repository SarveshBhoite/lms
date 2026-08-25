import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { LessonUpdateSchema } from "@/validations/course.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { moduleId, lessonId } = await params;
    const body = await req.json();
    const validated = LessonUpdateSchema.parse(body);

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId, moduleId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.contentType && { contentType: validated.contentType }),
        ...(validated.contentUrl !== undefined && { contentUrl: validated.contentUrl }),
        ...(validated.textContent !== undefined && { textContent: validated.textContent }),
        ...(validated.durationMinutes !== undefined && { durationMinutes: validated.durationMinutes }),
        ...(validated.orderIndex !== undefined && { orderIndex: validated.orderIndex }),
        ...(validated.isFreePreview !== undefined && { isFreePreview: validated.isFreePreview }),
      },
      include: {
        resources: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedLesson });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { moduleId, lessonId } = await params;

    await prisma.lesson.delete({
      where: { id: lessonId, moduleId },
    });

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
