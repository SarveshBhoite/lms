import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGoogleAccountStatus } from "@/lib/google/googleAuth.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const status = await getGoogleAccountStatus(session.userId);
    return NextResponse.json({ success: true, data: status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch Google status" }, { status: 500 });
  }
}
