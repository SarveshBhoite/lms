import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, handleApiError } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const body = await req.json();

    const { name, phone, designation, bio, avatarUrl, currentPassword, newPassword } = body;

    // 1. Update User basic info (cannot change role or isActive)
    if (name) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { name },
      });
    }

    // 2. Handle Password Change if requested
    if (newPassword) {
      if (!currentPassword) {
        throw new Error("Current password is required to set a new password");
      }

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) throw new Error("User not found");

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new Error("Current password is incorrect");
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash: hashed },
      });
    }

    // 3. Upsert UserProfile details
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        phone: phone || null,
        designation: designation || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      },
      update: {
        phone: phone !== undefined ? phone : undefined,
        designation: designation !== undefined ? designation : undefined,
        bio: bio !== undefined ? bio : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        profile: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}
