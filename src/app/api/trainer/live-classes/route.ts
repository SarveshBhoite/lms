import { NextRequest, NextResponse } from "next/server";
import { BatchService } from "@/services/batch.service";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const liveClasses = await prisma.liveClass.findMany({
      include: {
        batch: { select: { id: true, name: true } },
        attendances: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ success: true, liveClasses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();

    if (body.action === "attendance") {
      const att = await BatchService.markAttendance(session.userId, {
        liveClassId: body.liveClassId,
        userId: body.userId,
        status: body.status || "PRESENT",
      });
      return NextResponse.json({ success: true, data: att });
    } else {
      const scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : new Date();
      const startTime = body.startTime ? new Date(body.startTime) : scheduledDate;
      const endTime = body.endTime ? new Date(body.endTime) : new Date(scheduledDate.getTime() + 60 * 60 * 1000);
      const meetUrl = body.meetUrl || body.meetingUrl || "https://meet.google.com/demo-classroom";

      if (!body.batchId || !body.title) {
        return NextResponse.json({ success: false, error: "Batch and session title are required" }, { status: 400 });
      }

      const liveClass = await BatchService.scheduleLiveClass(session.userId, {
        batchId: body.batchId,
        title: body.title,
        description: body.description || "",
        scheduledDate,
        startTime,
        endTime,
        meetUrl,
        recordingUrl: body.recordingUrl || null,
      });

      return NextResponse.json({ success: true, data: liveClass }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const classId = searchParams.get("classId") || searchParams.get("id");

    if (!classId) {
      return NextResponse.json({ success: false, error: "Class ID is required" }, { status: 400 });
    }

    await prisma.liveClass.delete({
      where: { id: classId },
    });

    return NextResponse.json({
      success: true,
      message: "Live class session deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
