import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BatchStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const batches = await prisma.batch.findMany({
      include: {
        course: { select: { id: true, title: true } },
        students: { include: { user: { select: { id: true, name: true, email: true } } } },
        trainers: { include: { trainer: { select: { id: true, name: true, email: true } } } },
        liveClasses: true,
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { name, courseId, trainerId, startDate, endDate, status } = body;

    if (!name || !courseId) {
      return NextResponse.json(
        { success: false, error: "Batch name and Course ID are required." },
        { status: 400 }
      );
    }

    const assignedTrainerId = trainerId || session.userId;

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.batch.create({
        data: {
          name: name.trim(),
          courseId,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 3600 * 1000),
          status: (status as BatchStatus) || BatchStatus.ONGOING,
        },
      });

      // Link trainer if trainer exists
      const trainerUser = await tx.user.findUnique({ where: { id: assignedTrainerId } });
      if (trainerUser) {
        await tx.batchTrainer.create({
          data: {
            batchId: createdBatch.id,
            trainerId: assignedTrainerId,
          },
        });
      }

      // Activity log
      try {
        await tx.activityLog.create({
          data: {
            userId: session.userId,
            action: "BATCH_CREATED",
            resource: `Batch:${createdBatch.id}`,
            details: { name: createdBatch.name, courseId },
          },
        });
      } catch {
        // ignore log error
      }

      return createdBatch;
    });

    return NextResponse.json(
      { success: true, message: `Batch ${batch.name} created successfully.`, batch },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const batchId = searchParams.get("batchId") || searchParams.get("id");

    if (!batchId) {
      return NextResponse.json({ success: false, error: "Batch ID is required" }, { status: 400 });
    }

    await prisma.batch.delete({
      where: { id: batchId },
    });

    return NextResponse.json({
      success: true,
      message: "Batch cohort deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
