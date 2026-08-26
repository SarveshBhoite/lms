import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const body = await req.json();

    const { liveClassId, records } = body;

    if (!liveClassId || !Array.isArray(records)) {
      throw new Error("Invalid payload: liveClassId and records array are required");
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      select: { batchId: true },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You do not have access to mark attendance for this batch", 403);
    }

    // Upsert attendance for each student record
    for (const record of records) {
      if (record.userId && record.status) {
        await prisma.attendance.upsert({
          where: {
            liveClassId_userId: {
              liveClassId,
              userId: record.userId,
            },
          },
          create: {
            liveClassId,
            userId: record.userId,
            status: record.status,
          },
          update: {
            status: record.status,
            recordedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Attendance records updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
