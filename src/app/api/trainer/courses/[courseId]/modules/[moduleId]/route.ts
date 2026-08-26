import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const { courseId, moduleId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot edit modules for this course", 403);
    }

    const body = await req.json();
    const { title, description, orderIndex } = body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description || null;
    if (orderIndex !== undefined) dataToUpdate.orderIndex = Number(orderIndex);

    const updatedMod = await prisma.$transaction(async (tx) => {
      const mod = await tx.courseModule.update({
        where: { id: moduleId },
        data: dataToUpdate,
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "MODULE_UPDATED",
          resource: `CourseModule:${moduleId}`,
          details: { title: mod.title, courseId },
        },
      });

      return mod;
    });

    return NextResponse.json({ success: true, data: updatedMod });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const { courseId, moduleId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot delete modules for this course", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.courseModule.delete({
        where: { id: moduleId },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "MODULE_DELETED",
          resource: `CourseModule:${moduleId}`,
          details: { courseId },
        },
      });
    });

    return NextResponse.json({ success: true, message: "Module deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
