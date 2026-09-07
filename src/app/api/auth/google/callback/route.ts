import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleMeet";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !userId) {
    return NextResponse.redirect(`${baseUrl}/trainer/live-classes?google_auth=failed&msg=${encodeURIComponent(error || "Missing code or state")}`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Fetch user email from Google UserInfo
    let googleEmail = "Connected Account";
    try {
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        googleEmail = info.email || googleEmail;
      }
    } catch (e) {
      console.error("Error fetching Google user profile:", e);
    }

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    await prisma.trainerGoogleAccount.upsert({
      where: { userId },
      update: {
        email: googleEmail,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        scope: tokens.scope || null,
        expiresAt,
      },
      create: {
        userId,
        email: googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        scope: tokens.scope || null,
        expiresAt,
      },
    });

    return NextResponse.redirect(`${baseUrl}/trainer/live-classes?google_auth=success&email=${encodeURIComponent(googleEmail)}`);
  } catch (err: any) {
    console.error("Google OAuth Callback Error:", err);
    return NextResponse.redirect(`${baseUrl}/trainer/live-classes?google_auth=error&msg=${encodeURIComponent(err.message || "Failed to link Google account")}`);
  }
}
