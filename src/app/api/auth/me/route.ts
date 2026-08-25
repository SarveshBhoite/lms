import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/lib/rbac";

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
        profile: {
          select: {
            avatarUrl: true,
            phone: true,
            bio: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleApiError(error);
  }
}
