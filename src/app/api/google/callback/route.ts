import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/google/googleAuth.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const rawState = searchParams.get("state");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let redirectPath = "/trainer/profile";
  let stateData: any = null;

  if (rawState) {
    try {
      stateData = JSON.parse(decodeURIComponent(rawState));
      if (stateData?.role === "ADMIN") {
        redirectPath = "/admin/profile";
      }
    } catch (e) {
      console.warn("Could not parse OAuth state parameter:", e);
    }
  }

  if (error) {
    return NextResponse.redirect(`${baseUrl}${redirectPath}?google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}${redirectPath}?google_error=missing_code`);
  }

  try {
    const session = await getSession();
    const userId = session?.userId || stateData?.userId;

    if (!userId) {
      return NextResponse.redirect(`${baseUrl}/login?error=session_expired`);
    }

    await exchangeCodeForTokens(code, userId);

    return NextResponse.redirect(`${baseUrl}${redirectPath}?google=connected`);
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?google_error=${encodeURIComponent(err.message || "oauth_failed")}`
    );
  }
}
