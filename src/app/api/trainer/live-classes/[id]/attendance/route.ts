import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError } from "@/lib/rbac";

// GET: Returns full student roster and attendance check-in records for a live class
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const { id: liveClassId } = await params;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        batch: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: { select: { avatarUrl: true, phone: true } },
                  },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatarUrl: true, phone: true } },
              },
            },
          },
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

    // If multi-batch, load students across all batches
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
            profile: { select: { avatarUrl: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        liveClass,
        roster: allBatchStudents,
        attendances: liveClass.attendances,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Batch or single attendance approval, status change, or manual override
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const { id: liveClassId } = await params;
    const body = await req.json();

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
    if (!hasAccess && liveClass.trainerId !== session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { action, attendanceIds = [], updates = [] } = body;

    // Action 1: "APPROVE_ALL" or "APPROVE_SELECTED"
    if (action === "APPROVE_ALL") {
      // 1. Fetch all enrolled students across all assigned batches
      const allBatchIds = liveClass.batchIds.length > 0 ? liveClass.batchIds : [liveClass.batchId];
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batchId: { in: allBatchIds } },
        select: { userId: true },
      });
      const uniqueStudentIds = Array.from(new Set(batchStudents.map((bs) => bs.userId)));

      // 2. Existing attendance records for this class
      const existingRecords = await prisma.attendance.findMany({
        where: { liveClassId },
        select: { userId: true, id: true },
      });
      const recordedUserIds = new Set(existingRecords.map((r) => r.userId));

      // 3. For any student who didn't click join / has no record, insert as ABSENT (isApproved: true)
      const missingUserIds = uniqueStudentIds.filter((uid) => !recordedUserIds.has(uid));
      if (missingUserIds.length > 0) {
        await prisma.attendance.createMany({
          data: missingUserIds.map((userId) => ({
            liveClassId,
            userId,
            status: "ABSENT",
            isApproved: true,
            recordedAt: new Date(),
            approvedAt: new Date(),
            approvedBy: session.userId,
          })),
        });
      }

      // 4. Update all attendance records for this class to isApproved: true
      await prisma.attendance.updateMany({
        where: { liveClassId },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: session.userId,
        },
      });

      return NextResponse.json({ success: true, message: "All attendance records (including absent students) approved & verified" });
    }

    if (action === "APPROVE_SELECTED" && Array.isArray(attendanceIds) && attendanceIds.length > 0) {
      await prisma.attendance.updateMany({
        where: {
          liveClassId,
          id: { in: attendanceIds },
        },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: session.userId,
        },
      });

      return NextResponse.json({ success: true, message: "Selected attendance records approved" });
    }

    // Action 2: Manual status override (e.g. mark PRESENT, LATE, EXCUSED, ABSENT)
    if (action === "UPDATE_STATUS" && Array.isArray(updates)) {
      await prisma.$transaction(
        updates.map((u: { userId: string; status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT"; isApproved?: boolean }) =>
          prisma.attendance.upsert({
            where: {
              liveClassId_userId: { liveClassId, userId: u.userId },
            },
            update: {
              status: u.status,
              isApproved: u.isApproved !== undefined ? u.isApproved : true,
              approvedAt: new Date(),
              approvedBy: session.userId,
            },
            create: {
              liveClassId,
              userId: u.userId,
              status: u.status,
              isApproved: u.isApproved !== undefined ? u.isApproved : true,
              recordedAt: new Date(),
              approvedAt: new Date(),
              approvedBy: session.userId,
            },
          })
        )
      );

      return NextResponse.json({ success: true, message: "Attendance statuses updated successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action payload" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
