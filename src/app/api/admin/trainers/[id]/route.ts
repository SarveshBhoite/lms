import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { UpdateTrainerSchema } from "@/validations/trainer.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const trainer = await prisma.user.findFirst({
      where: { id, role: "TRAINER" },
      include: {
        profile: true,
        coursesCreated: {
          include: {
            modules: { select: { id: true } },
            enrollments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: { select: { phone: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        trainerBatches: {
          include: {
            batch: {
              include: {
                course: { select: { id: true, title: true } },
                students: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: { select: { phone: true, avatarUrl: true } },
                      },
                    },
                  },
                },
                liveClasses: true,
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    if (!trainer) {
      return NextResponse.json(
        { success: false, error: "Trainer profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: trainer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const validatedData = UpdateTrainerSchema.parse(body);

    const existingTrainer = await prisma.user.findFirst({
      where: { id, role: "TRAINER" },
      include: { profile: true },
    });

    if (!existingTrainer) {
      return NextResponse.json(
        { success: false, error: "Trainer profile not found." },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email.toLowerCase();
    if (typeof validatedData.isActive === "boolean") updateData.isActive = validatedData.isActive;
    if (validatedData.password && validatedData.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 10);
    }

    const updatedTrainer = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update profile
    if (
      validatedData.phone !== undefined ||
      validatedData.avatarUrl !== undefined ||
      validatedData.designation !== undefined ||
      validatedData.bio !== undefined
    ) {
      await prisma.userProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          phone: validatedData.phone || null,
          avatarUrl: validatedData.avatarUrl || null,
          designation: validatedData.designation || null,
          bio: validatedData.bio || null,
        },
        update: {
          ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
          ...(validatedData.avatarUrl !== undefined && { avatarUrl: validatedData.avatarUrl || null }),
          ...(validatedData.designation !== undefined && { designation: validatedData.designation || null }),
          ...(validatedData.bio !== undefined && { bio: validatedData.bio || null }),
        },
      });
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "TRAINER_UPDATED",
        resource: `User:${id}`,
        details: { updatedFields: Object.keys(body) },
      },
    });

    return NextResponse.json({ success: true, data: updatedTrainer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;

    const trainer = await prisma.user.findFirst({
      where: { id, role: "TRAINER" },
    });

    if (!trainer) {
      return NextResponse.json(
        { success: false, error: "Trainer account not found." },
        { status: 404 }
      );
    }

    // Delete trainer user record (Cascade deletes profile, batch associations, etc.)
    await prisma.user.delete({
      where: { id },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "TRAINER_DELETED",
        resource: `User:${id}`,
        details: { trainerName: trainer.name, trainerEmail: trainer.email },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Trainer account for ${trainer.name} deleted successfully.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
