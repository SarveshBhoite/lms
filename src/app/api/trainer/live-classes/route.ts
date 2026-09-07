import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError, AuthError } from "@/lib/rbac";
import { getValidAccessToken, createGoogleMeetEvent } from "@/lib/googleMeet";

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
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
        trainer: { select: { id: true, name: true, email: true } },
        attendances: { select: { id: true, userId: true, status: true, isApproved: true, joinClickTime: true, excuseReason: true } },
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

    const {
      courseId,
      batchId,
      batchIds = [],
      title,
      scheduledDate,
      startTime,
      endTime,
      lateCutoffMinutes = 10,
      meetUrl: rawMeetUrl,
      useConnectedGoogle = false,
      recordingUrl,
      description,
      status = "SCHEDULED",
    } = body;

    const allBatchIds: string[] = Array.from(
      new Set([batchId, ...(Array.isArray(batchIds) ? batchIds : [])].filter(Boolean))
    );

    if (allBatchIds.length === 0 || !title || !scheduledDate || !startTime) {
      throw new Error("Missing required live class fields (batch, title, scheduledDate, startTime)");
    }

    const calculatedEndTime = endTime 
      ? new Date(endTime) 
      : new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000);

    const primaryBatchId = allBatchIds[0];

    const hasBatchAccess = await verifyTrainerBatchAccess(session.userId, primaryBatchId, isAdmin);
    if (!hasBatchAccess) {
      throw new AuthError("Forbidden: You cannot schedule live classes for a batch assigned to another trainer", 403);
    }

    let finalMeetUrl = (rawMeetUrl || "").trim();

    // Auto-generate Google Meet link if requested and connected
    if (useConnectedGoogle || (!finalMeetUrl && useConnectedGoogle !== false)) {
      const accessToken = await getValidAccessToken(session.userId);
      if (accessToken) {
        try {
          const meetEvent = await createGoogleMeetEvent(accessToken, {
            title: `JVM LMS: ${title}`,
            description: description || `Live session for batch ${primaryBatchId}`,
            startTime: new Date(startTime),
            endTime: calculatedEndTime,
          });
          finalMeetUrl = meetEvent.meetUrl;
        } catch (e: any) {
          console.error("Failed to auto-create Google Meet event:", e);
          if (!finalMeetUrl) {
            throw new Error(`Google Meet creation error: ${e.message}`);
          }
        }
      }
    }

    if (!finalMeetUrl) {
      throw new Error("Meeting URL is required. Please paste a Google Meet URL or connect your Google Account to auto-generate.");
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        courseId: courseId || null,
        batchId: primaryBatchId,
        batchIds: allBatchIds,
        trainerId: session.userId,
        title,
        description: description || null,
        scheduledDate: new Date(scheduledDate),
        startTime: new Date(startTime),
        endTime: calculatedEndTime,
        lateCutoffMinutes: Number(lateCutoffMinutes) || 10,
        meetUrl: finalMeetUrl,
        recordingUrl: recordingUrl || null,
        status,
      },
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
        trainer: { select: { id: true, name: true, email: true } },
      },
    });

    // Send notifications to all students across all assigned batches
    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId: { in: allBatchIds } },
      select: { userId: true },
    });

    const uniqueStudentIds = Array.from(new Set(batchStudents.map((bs) => bs.userId)));

    if (uniqueStudentIds.length > 0) {
      await prisma.notification.createMany({
        data: uniqueStudentIds.map((userId) => ({
          userId,
          title: `New Live Class Scheduled: ${title}`,
          message: `Live session "${title}" is scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
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
