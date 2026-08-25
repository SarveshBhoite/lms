import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BatchTrainersSyncSchema } from "@/validations/batch.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: batchId } = await params;
    const body = await req.json();
    const { trainerIds } = BatchTrainersSyncSchema.parse(body);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    // Delete existing links and recreate
    await prisma.batchTrainer.deleteMany({ where: { batchId } });
    if (trainerIds.length > 0) {
      await prisma.batchTrainer.createMany({
        data: trainerIds.map((trainerId) => ({
          batchId,
          trainerId,
        })),
      });
    }

    const updatedTrainers = await prisma.batchTrainer.findMany({
      where: { batchId },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: { select: { phone: true, avatarUrl: true, designation: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedTrainers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: batchId } = await params;
    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get("trainerId");

    if (!trainerId) {
      return NextResponse.json(
        { success: false, error: "trainerId query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.batchTrainer.deleteMany({
      where: { batchId, trainerId },
    });

    return NextResponse.json({
      success: true,
      message: "Trainer removed from batch",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
