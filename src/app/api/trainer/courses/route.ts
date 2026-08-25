import { NextRequest, NextResponse } from "next/server";
import { CourseCreateSchema } from "@/validations/course.schema";
import { CourseService } from "@/services/course.service";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = CourseCreateSchema.parse(body);

    const course = await CourseService.createCourse(session.userId, validated);
    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
