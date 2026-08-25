import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { LiveClassCreateSchema } from "@/validations/batch.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id: batchId } = await params;
    const body = await req.json();
    const validated = LiveClassCreateSchema.parse({ ...body, batchId });

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const scheduledDate = new Date(validated.scheduledDate);
    const startTime = new Date(validated.startTime);
    const endTime = new Date(validated.endTime);

    const liveClass = await prisma.liveClass.create({
      data: {
        batchId,
        trainerId: validated.trainerId,
        title: validated.title,
        description: validated.description || null,
        scheduledDate,
        startTime,
        endTime,
        meetUrl: validated.meetUrl,
        recordingUrl: validated.recordingUrl || null,
        status: validated.status,
      },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        attendances: true,
      },
    });

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "LIVE_CLASS_SCHEDULED",
        resource: `LiveClass:${liveClass.id}`,
        details: {
          title: liveClass.title,
          batchId: liveClass.batchId,
          meetUrl: liveClass.meetUrl,
        },
      },
    });

    return NextResponse.json({ success: true, data: liveClass }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
