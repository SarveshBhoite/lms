import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || "JVM Institute Mobile Push 🚀";
    const message = body.message || "Test push notification successfully delivered to your device!";
    const actionUrl = body.actionUrl || "/notifications";

    const result = await sendPushToUser(session.userId, {
      title,
      message,
      actionUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Test push sent to ${result.sent} device(s). (${result.failed} expired)`,
      result,
    });
  } catch (error: any) {
    console.error("Failed to send test push:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
