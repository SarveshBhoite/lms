import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { handleApiError, requireAdmin } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role") as Role | null;
    const search = searchParams.get("search") || "";

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
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
            designation: true,
            bio: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            course: { select: { title: true } },
          },
        },
        coursesCreated: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    const { name, email, password, role, designation, bio, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and initial password are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role as Role) || Role.TRAINER;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole,
        isEmailVerified: true, // Admin-created accounts are auto-verified
        profile: {
          create: {
            phone: phone || null,
            bio: bio || null,
            designation: designation || (assignedRole === "TRAINER" ? "Faculty Trainer" : "Academic Member"),
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          },
        },
      },
      include: { profile: true },
    });

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ADMIN_CREATED_USER",
        resource: `User:${user.id}`,
        details: { targetEmail: user.email, targetRole: user.role },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${assignedRole} account for ${user.name} has been created successfully.`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    const { userId, role, isEmailVerified, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    const updateData: {
      role?: Role;
      isEmailVerified?: boolean;
      passwordHash?: string;
    } = {};

    if (role && Object.values(Role).includes(role)) {
      updateData.role = role;
    }

    if (isEmailVerified !== undefined) {
      updateData.isEmailVerified = Boolean(isEmailVerified);
    }

    if (newPassword && newPassword.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log admin update
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ADMIN_UPDATED_USER",
        resource: `User:${userId}`,
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
