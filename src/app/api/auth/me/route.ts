import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { handleApiError, requireAuth } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            avatarUrl: true,
            phone: true,
            bio: true,
            designation: true,
            githubUrl: true,
            linkedinUrl: true,
            websiteUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      name,
      phone,
      bio,
      designation,
      avatarUrl,
      currentPassword,
      newPassword,
    } = body;

    // Handle Password Change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!currentUser) {
        return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Incorrect current password." },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash },
      });
    }

    // Update user name if provided
    if (name && name.trim().length >= 2) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { name: name.trim() },
      });
    }

    // Upsert user profile
    await prisma.userProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        phone: phone || null,
        bio: bio || null,
        designation: designation || null,
        avatarUrl: avatarUrl || null,
      },
      update: {
        phone: phone !== undefined ? phone : undefined,
        bio: bio !== undefined ? bio : undefined,
        designation: designation !== undefined ? designation : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

