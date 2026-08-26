import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";

    const liveClasses = await prisma.liveClass.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId: session.userId },
              { batch: { trainers: { some: { trainerId: session.userId } } } },
              { batch: { course: { trainerId: session.userId } } },
            ],
          },
      include: {
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
        trainer: { select: { id: true, name: true, email: true } },
        attendances: { select: { id: true, userId: true, status: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ success: true, data: liveClasses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const body = await req.json();

    const { batchId, title, scheduledDate, startTime, endTime, meetUrl, recordingUrl, description, status = "SCHEDULED" } = body;

    if (!batchId || !title || !scheduledDate || !startTime || !endTime || !meetUrl) {
      throw new Error("Missing required live class fields (batchId, title, scheduledDate, startTime, endTime, meetUrl)");
    }

    const hasBatchAccess = await verifyTrainerBatchAccess(session.userId, batchId, isAdmin);
    if (!hasBatchAccess) {
      throw new AuthError("Forbidden: You cannot schedule live classes for a batch assigned to another trainer", 403);
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        batchId,
        trainerId: session.userId,
        title,
        description: description || null,
        scheduledDate: new Date(scheduledDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetUrl,
        recordingUrl: recordingUrl || null,
        status,
      },
      include: {
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
        trainer: { select: { id: true, name: true, email: true } },
      },
    });

    // Send notifications to batch students
    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId },
      select: { userId: true },
    });

    if (batchStudents.length > 0) {
      await prisma.notification.createMany({
        data: batchStudents.map((bs) => ({
          userId: bs.userId,
          title: `New Live Class Scheduled: ${title}`,
          message: `Live class "${title}" for batch ${liveClass.batch.name} is scheduled for ${new Date(scheduledDate).toLocaleDateString()}.`,
          type: "LIVE_CLASS_REMINDER",
          actionUrl: `/student/live-classes`,
        })),
      });
    }

    return NextResponse.json({ success: true, data: liveClass });
  } catch (error) {
    return handleApiError(error);
  }
}
