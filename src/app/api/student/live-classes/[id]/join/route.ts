import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError, AuthError } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      throw new AuthError("Unauthorized", 401);
    }

    const { id: liveClassId } = await params;
    const studentId = session.userId;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        batch: {
          include: {
            students: { where: { userId: studentId } },
          },
        },
      },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    // Check if class is completed or cancelled
    if (liveClass.status === "COMPLETED") {
      return NextResponse.json({
        success: false,
        error: "This live class session has already ended.",
        recordingUrl: liveClass.recordingUrl,
      }, { status: 400 });
    }

    if (liveClass.status === "CANCELLED") {
      return NextResponse.json({
        success: false,
        error: "This live class session was cancelled by the instructor.",
      }, { status: 400 });
    }

    // Verify student belongs to at least one allowed batch
    const allBatchIds = liveClass.batchIds.length > 0 ? liveClass.batchIds : [liveClass.batchId];
    const isEnrolledInBatch = await prisma.batchStudent.findFirst({
      where: {
        userId: studentId,
        batchId: { in: allBatchIds },
      },
    });

    if (!isEnrolledInBatch && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "You are not enrolled in the batch for this live session" }, { status: 403 });
    }

    // Attendance calculation based on current time vs startTime + lateCutoffMinutes
    const now = new Date();
    const startTime = new Date(liveClass.startTime);
    const cutoffMinutes = liveClass.lateCutoffMinutes || 10;
    const lateThresholdTime = new Date(startTime.getTime() + cutoffMinutes * 60 * 1000);

    const isLate = now.getTime() > lateThresholdTime.getTime();
    const attendanceStatus = isLate ? "LATE" : "PRESENT";

    // Upsert student attendance check-in (pending trainer approval)
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        liveClassId_userId: { liveClassId, userId: studentId },
      },
    });

    if (!existingAttendance) {
      await prisma.attendance.create({
        data: {
          liveClassId,
          userId: studentId,
          status: attendanceStatus,
          isApproved: false, // Pending trainer/admin confirmation
          joinClickTime: now,
          recordedAt: now,
        },
      });
    } else if (!existingAttendance.joinClickTime) {
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          joinClickTime: now,
          status: existingAttendance.status === "EXCUSED" ? "EXCUSED" : attendanceStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      meetUrl: liveClass.meetUrl,
      status: attendanceStatus,
      isLate,
      joinTime: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
