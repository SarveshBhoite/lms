import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.userId;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
        studentBatches: {
          include: { batch: { select: { id: true, name: true } } },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 404 });
    }

    const { passwordHash, ...safeStudent } = student;
    return NextResponse.json({ success: true, data: safeStudent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch student profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.userId;
    const body = await req.json();

    const { name, phone, bio, designation, avatarUrl, currentPassword, newPassword } = body;

    // Password change verification
    let passwordHashToUpdate: string | undefined = undefined;
    if (newPassword) {
      if (!currentPassword) {
        throw new Error("Current password is required to change your password");
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: studentId },
        select: { passwordHash: true },
      });

      if (!existingUser) {
        throw new Error("User record not found");
      }

      const isValid = await bcrypt.compare(currentPassword, existingUser.passwordHash);
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      passwordHashToUpdate = await bcrypt.hash(newPassword, 10);
    }

    // Update User & UserProfile
    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: {
        ...(name ? { name } : {}),
        ...(passwordHashToUpdate ? { passwordHash: passwordHashToUpdate } : {}),
        profile: {
          upsert: {
            create: {
              phone: phone || null,
              bio: bio || null,
              designation: designation || null,
              avatarUrl: avatarUrl || null,
            },
            update: {
              ...(phone !== undefined ? { phone: phone || null } : {}),
              ...(bio !== undefined ? { bio: bio || null } : {}),
              ...(designation !== undefined ? { designation: designation || null } : {}),
              ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
            },
          },
        },
      },
      include: { profile: true },
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
