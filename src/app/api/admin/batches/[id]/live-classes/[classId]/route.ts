import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { LiveClassUpdateSchema } from "@/validations/batch.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: batchId, classId } = await params;
    const body = await req.json();
    const validated = LiveClassUpdateSchema.parse(body);

    const updateData: any = {};
    if (validated.title) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.trainerId) updateData.trainerId = validated.trainerId;
    if (validated.scheduledDate) updateData.scheduledDate = new Date(validated.scheduledDate);
    if (validated.startTime) updateData.startTime = new Date(validated.startTime);
    if (validated.endTime) updateData.endTime = new Date(validated.endTime);
    if (validated.meetUrl) updateData.meetUrl = validated.meetUrl;
    if (validated.recordingUrl !== undefined) updateData.recordingUrl = validated.recordingUrl;
    if (validated.status) updateData.status = validated.status;

    const updatedClass = await prisma.liveClass.update({
      where: { id: classId, batchId },
      data: updateData,
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        attendances: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedClass });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: batchId, classId } = await params;

    await prisma.liveClass.delete({
      where: { id: classId, batchId },
    });

    return NextResponse.json({
      success: true,
      message: "Live class deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
