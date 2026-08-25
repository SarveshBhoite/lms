import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BatchUpdateSchema } from "@/validations/batch.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnailUrl: true,
            level: true,
            durationHours: true,
          },
        },
        trainers: {
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
        },
        students: {
          orderBy: { joinedAt: "desc" },
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
        },
        liveClasses: {
          orderBy: { scheduledDate: "asc" },
          include: {
            trainer: { select: { id: true, name: true, email: true } },
            attendances: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            _count: { select: { attendances: true } },
          },
        },
        _count: {
          select: {
            students: true,
            trainers: true,
            liveClasses: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();
    const validated = BatchUpdateSchema.parse(body);

    const existingBatch = await prisma.batch.findUnique({ where: { id } });
    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.courseId) updateData.courseId = validated.courseId;
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);
    if (validated.status) updateData.status = validated.status;

    // Handle trainers sync if trainerIds is explicitly passed
    if (validated.trainerIds !== undefined) {
      await prisma.batchTrainer.deleteMany({ where: { batchId: id } });
      if (validated.trainerIds.length > 0) {
        await prisma.batchTrainer.createMany({
          data: validated.trainerIds.map((trainerId) => ({
            batchId: id,
            trainerId,
          })),
        });
      }
    }

    // Handle students sync if studentIds is explicitly passed
    if (validated.studentIds !== undefined) {
      await prisma.batchStudent.deleteMany({ where: { batchId: id } });
      if (validated.studentIds.length > 0) {
        await prisma.batchStudent.createMany({
          data: validated.studentIds.map((userId) => ({
            batchId: id,
            userId,
          })),
        });

        // Upsert enrollments for course
        const targetCourseId = validated.courseId || existingBatch.courseId;
        await Promise.all(
          validated.studentIds.map(async (userId) => {
            await prisma.enrollment.upsert({
              where: {
                userId_courseId: { userId, courseId: targetCourseId },
              },
              create: {
                userId,
                courseId: targetCourseId,
                batchId: id,
                status: "ACTIVE",
              },
              update: {
                batchId: id,
              },
            });
          })
        );
      }
    }

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: updateData,
      include: {
        course: { select: { id: true, title: true } },
        trainers: { include: { trainer: { select: { id: true, name: true } } } },
        students: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "BATCH_UPDATED",
        resource: `Batch:${id}`,
        details: { name: updatedBatch.name, status: updatedBatch.status },
      },
    });

    return NextResponse.json({ success: true, data: updatedBatch });
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

    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    await prisma.batch.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "BATCH_DELETED",
        resource: `Batch:${id}`,
        details: { name: batch.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Batch "${batch.name}" deleted successfully`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
