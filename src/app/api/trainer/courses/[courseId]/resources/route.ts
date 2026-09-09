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
      throw new AuthError("Forbidden: Cannot add learning resources to this course", 403);
    }

    const body = await req.json();
    const { lessonId, batchId, title, fileType = "PDF", fileSize = 1024, fileUrl, isPublic = true } = body;

    if (!title || !fileUrl) {
      throw new Error("Resource title and file URL are required");
    }

    const resourceRecord = await prisma.$transaction(async (tx) => {
      const res = await tx.resource.create({
        data: {
          courseId,
          batchId: batchId || null,
          lessonId: lessonId || null,
          title,
          fileType,
          fileSize: Number(fileSize) || 1024,
          fileUrl,
          isPublic: Boolean(isPublic),
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "RESOURCE_CREATED",
          resource: `Resource:${res.id}`,
          details: { title: res.title, lessonId: lessonId || null, batchId: batchId || null, courseId },
        },
      });

      return res;
    });

    return NextResponse.json({ success: true, data: resourceRecord });
  } catch (error) {
    return handleApiError(error);
  }
}
