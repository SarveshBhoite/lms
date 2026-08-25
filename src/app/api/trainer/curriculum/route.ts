import { NextRequest, NextResponse } from "next/server";
import { ModuleCreateSchema, LessonCreateSchema } from "@/validations/course.schema";
import { CourseService } from "@/services/course.service";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();

    if (body.type === "module") {
      const validated = ModuleCreateSchema.parse(body);
      const mod = await CourseService.createModule(session.userId, validated, session.role === "ADMIN");
      return NextResponse.json({ success: true, data: mod }, { status: 201 });
    } else if (body.type === "lesson") {
      const validated = LessonCreateSchema.parse(body);
      const lesson = await CourseService.createLesson(session.userId, validated, session.role === "ADMIN");
      return NextResponse.json({ success: true, data: lesson }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: "Invalid curriculum item type" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
