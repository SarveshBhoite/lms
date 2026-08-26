import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If the email is registered, a new verification link will be issued.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: "This account email is already verified. You can log in directly.",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpiresAt },
    });

    console.log(`[AUTH] Resent Verification Token for ${user.email}: ${verificationToken}`);

    return NextResponse.json({
      success: true,
      message: "A fresh verification link has been generated.",
      token: verificationToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
