import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { LessonCreateSchema, LessonReorderSchema } from "@/validations/course.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: courseId, moduleId } = await params;
    const body = await req.json();
    const validated = LessonCreateSchema.parse(body);

    const moduleObj = await prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
    });

    if (!moduleObj) {
      return NextResponse.json(
        { success: false, error: "Module not found in this course" },
        { status: 404 }
      );
    }

    let orderIndex = validated.orderIndex;
    if (orderIndex === 0) {
      const highestLesson = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });
      orderIndex = (highestLesson?.orderIndex ?? -1) + 1;
    }

    const newLesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: validated.title,
        description: validated.description || null,
        contentType: validated.contentType,
        contentUrl: validated.contentUrl || null,
        textContent: validated.textContent || null,
        durationMinutes: validated.durationMinutes,
        orderIndex,
        isFreePreview: validated.isFreePreview,
      },
      include: {
        resources: true,
      },
    });

    return NextResponse.json({ success: true, data: newLesson }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { moduleId } = await params;
    const body = await req.json();
    const { lessonOrders } = LessonReorderSchema.parse(body);

    await prisma.$transaction(
      lessonOrders.map((l) =>
        prisma.lesson.update({
          where: { id: l.id, moduleId },
          data: { orderIndex: l.orderIndex },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Lessons reordered successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
