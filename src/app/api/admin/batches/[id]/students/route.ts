import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BatchStudentsSyncSchema } from "@/validations/batch.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: batchId } = await params;
    const body = await req.json();
    const { studentIds } = BatchStudentsSyncSchema.parse(body);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    // Add new students to batch
    for (const userId of studentIds) {
      await prisma.batchStudent.upsert({
        where: {
          batchId_userId: { batchId, userId },
        },
        create: {
          batchId,
          userId,
        },
        update: {},
      });

      // Automatically enroll student in the course associated with this batch
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: { userId, courseId: batch.courseId },
        },
        create: {
          userId,
          courseId: batch.courseId,
          batchId,
          status: "ACTIVE",
        },
        update: {
          batchId,
        },
      });
    }

    const updatedStudents = await prisma.batchStudent.findMany({
      where: { batchId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            profile: { select: { phone: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedStudents });
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
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.batchStudent.deleteMany({
      where: { batchId, userId },
    });

    return NextResponse.json({
      success: true,
      message: "Student removed from batch",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
