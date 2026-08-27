import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const status = searchParams.get("status");

    const where: any = {};
    if (batchId) {
      where.liveClass = { batchId };
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        liveClass: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            trainer: { select: { name: true } },
            batch: { select: { id: true, name: true, course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    const totalRecords = attendances.length;
    const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
    const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
    const lateCount = attendances.filter((a) => a.status === "LATE").length;
    const excusedCount = attendances.filter((a) => a.status === "EXCUSED").length;

    const overallRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        attendances,
        stats: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          overallRate,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { liveClassId, userId, status } = body;

    if (!liveClassId || !userId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing liveClassId, userId, or status" },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.upsert({
      where: {
        liveClassId_userId: {
          liveClassId,
          userId,
        },
      },
      create: {
        liveClassId,
        userId,
        status,
      },
      update: {
        status,
        recordedAt: new Date(),
      },
    });

    // Notify student of admin override
    await prisma.notification.create({
      data: {
        userId,
        title: "Attendance Updated by Admin",
        message: `Your attendance record was updated to ${status}.`,
        type: "SYSTEM_ALERT",
        actionUrl: "/student/attendance",
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Attendance updated successfully by Admin",
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
