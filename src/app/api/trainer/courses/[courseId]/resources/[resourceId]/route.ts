import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; resourceId: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const { courseId, resourceId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot edit resources for this course", 403);
    }

    const body = await req.json();
    const { title, fileType, fileUrl, isPublic } = body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (fileType !== undefined) dataToUpdate.fileType = fileType;
    if (fileUrl !== undefined) dataToUpdate.fileUrl = fileUrl;
    if (isPublic !== undefined) dataToUpdate.isPublic = Boolean(isPublic);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.resource.update({
        where: { id: resourceId },
        data: dataToUpdate,
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "RESOURCE_UPDATED",
          resource: `Resource:${resourceId}`,
          details: { title: res.title, courseId },
        },
      });

      return res;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; resourceId: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const { courseId, resourceId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot delete resources for this course", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.resource.delete({
        where: { id: resourceId },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "RESOURCE_DELETED",
          resource: `Resource:${resourceId}`,
          details: { courseId },
        },
      });
    });

    return NextResponse.json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
