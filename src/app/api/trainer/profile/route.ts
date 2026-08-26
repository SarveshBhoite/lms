import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { name, phone, bio, designation, avatarUrl, githubUrl, linkedinUrl, websiteUrl, currentPassword, newPassword } = body;

    // Password change verification
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: "Current password is required to set a new password" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash: newPasswordHash },
      });
    }

    // Update Name and Profile metadata
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        profile: {
          upsert: {
            create: {
              phone: phone || null,
              bio: bio || null,
              avatarUrl: avatarUrl || null,
              designation: designation || "Faculty Trainer",
              githubUrl: githubUrl || null,
              linkedinUrl: linkedinUrl || null,
              websiteUrl: websiteUrl || null,
            },
            update: {
              phone: phone !== undefined ? phone : undefined,
              bio: bio !== undefined ? bio : undefined,
              avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
              designation: designation !== undefined ? designation : undefined,
              githubUrl: githubUrl !== undefined ? githubUrl : undefined,
              linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
              websiteUrl: websiteUrl !== undefined ? websiteUrl : undefined,
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: "Trainer profile updated successfully." });
  } catch (error) {
    return handleApiError(error);
  }
}
