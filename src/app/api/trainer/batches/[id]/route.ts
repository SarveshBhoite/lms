import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerBatchAccess(session.userId, id, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You do not have access to manage this batch", 403);
    }

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnailUrl: true,
            level: true,
            durationHours: true,
            quizzes: { select: { id: true, title: true, status: true } },
            assignments: { select: { id: true, title: true, deadline: true } },
          },
        },
        trainers: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: { select: { phone: true, avatarUrl: true, designation: true } },
              },
            },
          },
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                profile: { select: { phone: true, avatarUrl: true, designation: true } },
              },
            },
          },
        },
        liveClasses: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
            attendances: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
          orderBy: { scheduledDate: "desc" },
        },
        _count: {
          select: { students: true, trainers: true, liveClasses: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerBatchAccess(session.userId, id, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You do not have access to edit this batch", 403);
    }

    const body = await req.json();
    const { name, startDate, endDate, status } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (startDate) dataToUpdate.startDate = new Date(startDate);
    if (endDate) dataToUpdate.endDate = new Date(endDate);
    if (status) dataToUpdate.status = status;

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: dataToUpdate,
      include: {
        course: { select: { id: true, title: true } },
        trainers: { include: { trainer: { select: { id: true, name: true } } } },
        students: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ success: true, data: updatedBatch });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerBatchAccess(session.userId, id, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You do not have access to delete this batch", 403);
    }

    // Reset enrollment batchId for students in this batch
    await prisma.enrollment.updateMany({
      where: { batchId: id },
      data: { batchId: null },
    });

    await prisma.batch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Batch deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
