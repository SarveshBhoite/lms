import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, name: true, courseId: true } },
        trainer: { select: { id: true, name: true, email: true } },
        attendances: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You do not have access to this live class", 403);
    }

    return NextResponse.json({ success: true, data: liveClass });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      select: { batchId: true },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You cannot modify live classes belonging to another trainer's batch", 403);
    }

    const body = await req.json();
    const { title, scheduledDate, startTime, endTime, meetUrl, recordingUrl, description, status } = body;

    const dataToUpdate: any = {};
    if (title) dataToUpdate.title = title;
    if (scheduledDate) dataToUpdate.scheduledDate = new Date(scheduledDate);
    if (startTime) dataToUpdate.startTime = new Date(startTime);
    if (endTime) dataToUpdate.endTime = new Date(endTime);
    if (meetUrl) dataToUpdate.meetUrl = meetUrl;
    if (recordingUrl !== undefined) dataToUpdate.recordingUrl = recordingUrl || null;
    if (description !== undefined) dataToUpdate.description = description || null;
    if (status) dataToUpdate.status = status;

    const updated = await prisma.liveClass.update({
      where: { id },
      data: dataToUpdate,
      include: {
        batch: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      select: { batchId: true },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You cannot delete live classes belonging to another trainer's batch", 403);
    }

    await prisma.liveClass.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Live class deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
