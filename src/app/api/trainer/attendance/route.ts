import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { AttendanceStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const attendances = await prisma.attendance.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        liveClass: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json({ success: true, attendances });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { liveClassId, userId, status } = body;

    if (!liveClassId || !userId) {
      return NextResponse.json(
        { success: false, error: "Live class ID and student ID are required" },
        { status: 400 }
      );
    }

    const att = await prisma.attendance.upsert({
      where: {
        liveClassId_userId: {
          liveClassId,
          userId,
        },
      },
      update: {
        status: (status as AttendanceStatus) || AttendanceStatus.PRESENT,
      },
      create: {
        liveClassId,
        userId,
        status: (status as AttendanceStatus) || AttendanceStatus.PRESENT,
      },
    });

    return NextResponse.json({ success: true, attendance: att });
  } catch (error) {
    return handleApiError(error);
  }
}
