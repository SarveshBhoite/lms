import { NextRequest, NextResponse } from "next/server";
import { AssignmentCreateSchema, AssignmentEvaluationSchema } from "@/validations/assignment.schema";
import { AssignmentService } from "@/services/assignment.service";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();

    if (body.action === "evaluate") {
      const validated = AssignmentEvaluationSchema.parse(body);
      const feedback = await AssignmentService.evaluateSubmission(session.userId, validated, session.role === "ADMIN");
      return NextResponse.json({ success: true, data: feedback });
    } else {
      const validated = AssignmentCreateSchema.parse(body);
      const asgn = await AssignmentService.createAssignment(session.userId, validated, session.role === "ADMIN");
      return NextResponse.json({ success: true, data: asgn }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
