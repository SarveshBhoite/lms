import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google/googleAuth.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = JSON.stringify({ userId: session.userId, role: session.role });
    const url = getGoogleAuthUrl(encodeURIComponent(state));

    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to initiate Google OAuth" }, { status: 500 });
  }
}
