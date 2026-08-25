import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'isActive' boolean property." },
        { status: 400 }
      );
    }

    const trainer = await prisma.user.findFirst({
      where: { id, role: "TRAINER" },
    });

    if (!trainer) {
      return NextResponse.json(
        { success: false, error: "Trainer not found." },
        { status: 404 }
      );
    }

    const updatedTrainer = await prisma.user.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: body.isActive ? "TRAINER_ACTIVATED" : "TRAINER_DEACTIVATED",
        resource: `User:${id}`,
        details: { trainerEmail: trainer.email, isActive: body.isActive },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Trainer account ${body.isActive ? "activated" : "deactivated"} successfully.`,
      data: updatedTrainer,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
