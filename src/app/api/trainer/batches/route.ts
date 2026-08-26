import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BatchStatus } from "@prisma/client";

// GET all batches accessible to the trainer
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Trainer directly creates an active batch with NO admin approval needed
export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { name, courseId, startDate, endDate, status } = body;

    if (!name || !courseId) {
      return NextResponse.json(
        { success: false, error: "Batch name and Course are required." },
        { status: 400 }
      );
    }

    const batch = await prisma.$transaction(async (tx) => {
      // 1. Create the Batch immediately active (no admin approval required)
      const createdBatch = await tx.batch.create({
        data: {
          name: name.trim(),
          courseId,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 3600 * 1000),
          status: (status as BatchStatus) || BatchStatus.ONGOING,
        },
      });

      // 2. Link trainer directly to the batch
      await tx.batchTrainer.upsert({
        where: {
          batchId_trainerId: {
            batchId: createdBatch.id,
            trainerId: session.userId,
          },
        },
        update: {},
        create: {
          batchId: createdBatch.id,
          trainerId: session.userId,
        },
      });

      // 3. Log activity
      try {
        await tx.activityLog.create({
          data: {
            userId: session.userId,
            action: "BATCH_CREATED",
            resource: `Batch:${createdBatch.id}`,
            details: { name: createdBatch.name, courseId, createdBy: "TRAINER", directApproval: true },
          },
        });
      } catch {
        // ignore log failures
      }

      return createdBatch;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Batch "${batch.name}" created and activated successfully! No admin approval required.`,
        batch,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Trainer directly deletes a batch
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
      message: "Batch deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
