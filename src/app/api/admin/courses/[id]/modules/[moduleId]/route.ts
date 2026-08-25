import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { ModuleUpdateSchema } from "@/validations/course.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: courseId, moduleId } = await params;
    const body = await req.json();
    const validated = ModuleUpdateSchema.parse(body);

    const updatedModule = await prisma.courseModule.update({
      where: { id: moduleId, courseId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.orderIndex !== undefined && { orderIndex: validated.orderIndex }),
      },
      include: {
        lessons: {
          include: { resources: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedModule });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: courseId, moduleId } = await params;

    await prisma.courseModule.delete({
      where: { id: moduleId, courseId },
    });

    return NextResponse.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
