import { NextRequest, NextResponse } from "next/server";
import { exchangeDriveCodeForTokens } from "@/lib/googleDrive";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !userId) {
    return NextResponse.redirect(
      `${baseUrl}/admin/recorded-lectures?drive_auth=failed&msg=${encodeURIComponent(
        error || "Missing code or state"
      )}`
    );
  }

  try {
    const tokens = await exchangeDriveCodeForTokens(code);

    // Fetch user profile email
    let driveEmail = "Connected Drive Account";
    try {
      const infoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );
      if (infoRes.ok) {
        const info = await infoRes.json();
        driveEmail = info.email || driveEmail;
      }
    } catch (e) {
      console.error("Error fetching Google Drive user info:", e);
    }

    const expiresAt = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000
    );

    await prisma.adminGoogleDriveAccount.upsert({
      where: { userId },
      update: {
        email: driveEmail,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        scope: tokens.scope || null,
        expiresAt,
      },
      create: {
        userId,
        email: driveEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        scope: tokens.scope || null,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      `${baseUrl}/admin/recorded-lectures?drive_auth=success&email=${encodeURIComponent(
        driveEmail
      )}`
    );
  } catch (err: any) {
    console.error("Google Drive OAuth Callback Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/admin/recorded-lectures?drive_auth=error&msg=${encodeURIComponent(
        err.message || "Failed to link Google Drive"
      )}`
    );
  }
}
