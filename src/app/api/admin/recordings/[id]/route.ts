import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();

    const { title, description, videoUrl, recordedDate } = body;

    const existingClass = await prisma.liveClass.findUnique({
      where: { id },
    });

    if (existingClass) {
      const updateData: Record<string, unknown> = {};
      if (title) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (videoUrl) {
        updateData.recordingUrl = videoUrl.trim();
        updateData.meetUrl = videoUrl.trim();
      }
      if (recordedDate) {
        updateData.scheduledDate = new Date(recordedDate);
        updateData.startTime = new Date(recordedDate);
      }

      const updated = await prisma.liveClass.update({
        where: { id },
        data: updateData,
        include: {
          course: { select: { id: true, title: true, slug: true } },
          batch: { select: { id: true, name: true } },
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          sourceType: "LIVE_CLASS" as const,
          title: updated.title,
          description: updated.description,
          videoUrl: updated.recordingUrl || "",
          recordedDate: updated.scheduledDate.toISOString(),
          course: updated.course,
          batch: updated.batch,
          trainer: {
            id: updated.trainer.id,
            name: updated.trainer.name,
            email: updated.trainer.email,
            avatarUrl: updated.trainer.profile?.avatarUrl,
          },
          createdAt: updated.createdAt.toISOString(),
        },
      });
    }

    // Check if it was a Resource
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    });

    if (existingResource) {
      const updateData: Record<string, unknown> = {};
      if (title) updateData.title = title.trim();
      if (videoUrl) updateData.fileUrl = videoUrl.trim();

      const updated = await prisma.resource.update({
        where: { id },
        data: updateData,
        include: {
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          sourceType: "RESOURCE" as const,
          title: updated.title,
          description: null,
          videoUrl: updated.fileUrl,
          recordedDate: updated.createdAt.toISOString(),
          course: updated.course,
          batch: updated.batch,
          createdAt: updated.createdAt.toISOString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Lecture not found" },
      { status: 404 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    const existingClass = await prisma.liveClass.findUnique({
      where: { id },
    });

    if (existingClass) {
      // Clear recording or delete session
      await prisma.liveClass.delete({
        where: { id },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: "RECORDED_LECTURE_DELETED",
          resource: `LiveClass:${id}`,
          details: { title: existingClass.title },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Recorded lecture removed successfully",
      });
    }

    const existingResource = await prisma.resource.findUnique({
      where: { id },
    });

    if (existingResource) {
      await prisma.resource.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Recorded lecture removed successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Lecture not found" },
      { status: 404 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
