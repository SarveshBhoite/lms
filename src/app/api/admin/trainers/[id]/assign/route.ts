import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { AssignTrainerSchema } from "@/validations/trainer.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const validatedData = AssignTrainerSchema.parse(body);

    const trainer = await prisma.user.findFirst({
      where: { id, role: "TRAINER" },
    });

    if (!trainer) {
      return NextResponse.json(
        { success: false, error: "Trainer profile not found." },
        { status: 404 }
      );
    }

    // 1. Assign multiple courses: Update specified courses to have this trainerId
    if (Array.isArray(validatedData.courseIds)) {
      await prisma.course.updateMany({
        where: { id: { in: validatedData.courseIds } },
        data: { trainerId: id },
      });
    }

    // 2. Assign multiple batches: Synchronize BatchTrainer table for this trainer
    if (Array.isArray(validatedData.batchIds)) {
      // Remove previous batch assignments for this trainer
      await prisma.batchTrainer.deleteMany({
        where: { trainerId: id },
      });

      // Add new batch assignments
      if (validatedData.batchIds.length > 0) {
        const batchData = validatedData.batchIds.map((batchId) => ({
          batchId,
          trainerId: id,
        }));
        await prisma.batchTrainer.createMany({
          data: batchData,
          skipDuplicates: true,
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "TRAINER_ASSIGNMENTS_UPDATED",
        resource: `User:${id}`,
        details: {
          assignedCourseCount: validatedData.courseIds.length,
          assignedBatchCount: validatedData.batchIds.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Multiple courses and batches assigned to trainer successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
