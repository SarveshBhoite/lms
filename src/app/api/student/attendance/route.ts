import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.userId;

    const attendances = await prisma.attendance.findMany({
      where: { userId: studentId },
      include: {
        liveClass: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            startTime: true,
            batch: { select: { name: true, course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    const totalClasses = attendances.length;
    const presentClasses = attendances.filter((a) => a.status === "PRESENT").length;
    const attendancePercent = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        attendances,
        totalClasses,
        presentClasses,
        attendancePercent: Number(attendancePercent.toFixed(1)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch attendance" }, { status: 500 });
  }
}
