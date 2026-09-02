import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { disconnectGoogleAccount } from "@/lib/google/googleAuth.service";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await disconnectGoogleAccount(session.userId);
    return NextResponse.json({ success: true, message: "Google Account disconnected successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to disconnect Google Account" }, { status: 500 });
  }
}
