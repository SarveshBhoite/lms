import { NextRequest, NextResponse } from "next/server";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { getGoogleOAuthUrl } from "@/lib/googleMeet";
import prisma from "@/lib/prisma";

// GET: returns status of connected Google Account or returns Auth URL
export async function GET(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const account = await prisma.trainerGoogleAccount.findUnique({
      where: { userId: session.userId },
      select: { email: true, createdAt: true, updatedAt: true },
    });

    const isConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here");
    const authUrl = isConfigured ? getGoogleOAuthUrl(session.userId) : null;

    return NextResponse.json({
      success: true,
      data: {
        isConnected: Boolean(account),
        email: account?.email || null,
        isConfigured,
        authUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: disconnects Google Account
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    await prisma.trainerGoogleAccount.deleteMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Google Account disconnected successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
