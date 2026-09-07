import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const { id } = await params;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        batch: {
          select: {
            id: true,
            name: true,
            courseId: true,
            course: { select: { id: true, title: true } },
          },
        },
        trainer: { select: { id: true, name: true, email: true } },
        attendances: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
    if (!hasAccess && liveClass.trainerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Multi-batch student roster
    const allBatchIds = liveClass.batchIds.length > 0 ? liveClass.batchIds : [liveClass.batchId];
    const allBatchStudents = await prisma.batchStudent.findMany({
      where: { batchId: { in: allBatchIds } },
      include: {
        batch: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { phone: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const enrichedClass = {
      ...liveClass,
      batch: {
        ...liveClass.batch,
        students: allBatchStudents,
      },
    };

    return NextResponse.json({ success: true, data: enrichedClass });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const { id } = await params;
    const body = await req.json();

    const existingClass = await prisma.liveClass.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!existingClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, existingClass.batchId, isAdmin);
    if (!hasAccess && existingClass.trainerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this class" }, { status: 403 });
    }

    const {
      title,
      description,
      scheduledDate,
      startTime,
      endTime,
      lateCutoffMinutes,
      meetUrl,
      recordingUrl,
      status,
      batchIds,
    } = body;

    const updated = await prisma.liveClass.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(lateCutoffMinutes !== undefined && { lateCutoffMinutes: Number(lateCutoffMinutes) }),
        ...(meetUrl !== undefined && { meetUrl }),
        ...(recordingUrl !== undefined && { recordingUrl }),
        ...(status !== undefined && { status }),
        ...(Array.isArray(batchIds) && { batchIds }),
      },
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
        trainer: { select: { id: true, name: true, email: true } },
      },
    });

    // If time was modified and class is still upcoming/scheduled, optionally notify students
    if (startTime && new Date(startTime).getTime() !== existingClass.startTime.getTime()) {
      const allBatchIds = updated.batchIds.length > 0 ? updated.batchIds : [updated.batchId];
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batchId: { in: allBatchIds } },
        select: { userId: true },
      });

      const uniqueStudentIds = Array.from(new Set(batchStudents.map((bs) => bs.userId)));
      if (uniqueStudentIds.length > 0) {
        await prisma.notification.createMany({
          data: uniqueStudentIds.map((userId) => ({
            userId,
            title: `Schedule Updated: ${updated.title}`,
            message: `The live class time has been updated to ${new Date(updated.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${new Date(updated.scheduledDate).toLocaleDateString()}.`,
            type: "LIVE_CLASS_REMINDER",
            actionUrl: `/student/live-classes`,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const { id } = await params;

    const existingClass = await prisma.liveClass.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, existingClass.batchId, isAdmin);
    if (!hasAccess && existingClass.trainerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this class" }, { status: 403 });
    }

    await prisma.liveClass.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Live class deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
