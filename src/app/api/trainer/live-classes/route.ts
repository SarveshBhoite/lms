import { NextRequest, NextResponse } from "next/server";
import { LiveClassCreateSchema, AttendanceMarkSchema } from "@/validations/batch.schema";
import { BatchService } from "@/services/batch.service";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();

    if (body.action === "attendance") {
      const validated = AttendanceMarkSchema.parse(body);
      const att = await BatchService.markAttendance(session.userId, validated);
      return NextResponse.json({ success: true, data: att });
    } else {
      const validated = LiveClassCreateSchema.parse(body);
      const liveClass = await BatchService.scheduleLiveClass(session.userId, validated);
      return NextResponse.json({ success: true, data: liveClass }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
