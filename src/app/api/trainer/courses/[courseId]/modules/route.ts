import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { courseId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot manage modules for this course", 403);
    }

    const { title, description, orderIndex } = await req.json();

    if (!title) {
      throw new Error("Module title is required");
    }

    const maxOrderMod = await prisma.courseModule.findFirst({
      where: { courseId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = orderIndex !== undefined ? Number(orderIndex) : (maxOrderMod?.orderIndex ?? 0) + 1;

    const moduleRecord = await prisma.$transaction(async (tx) => {
      const mod = await tx.courseModule.create({
        data: {
          courseId,
          title,
          description: description || null,
          orderIndex: nextOrder,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "MODULE_CREATED",
          resource: `CourseModule:${mod.id}`,
          details: { title: mod.title, courseId },
        },
      });

      return mod;
    });

    return NextResponse.json({ success: true, data: moduleRecord });
  } catch (error) {
    return handleApiError(error);
  }
}
