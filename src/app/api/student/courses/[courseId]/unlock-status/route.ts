import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCourseLessonUnlockStatuses } from "@/lib/quizUnlock";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const unlockStatuses = await getCourseLessonUnlockStatuses(session.userId, courseId);

    return NextResponse.json({
      success: true,
      data: unlockStatuses,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch unlock status" }, { status: 500 });
  }
}
