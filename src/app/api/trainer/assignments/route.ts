import { NextRequest, NextResponse } from "next/server";
import { AssignmentCreateSchema, AssignmentEvaluationSchema } from "@/validations/assignment.schema";
import { AssignmentService } from "@/services/assignment.service";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const assignments = await prisma.assignment.findMany({
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            feedback: true,
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = AssignmentCreateSchema.parse(body);

    const assignment = await AssignmentService.createAssignment(session.userId, validated);
    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = AssignmentEvaluationSchema.parse(body);

    const feedback = await AssignmentService.evaluateSubmission(session.userId, validated);
    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const assignmentId = searchParams.get("assignmentId") || searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json({ success: false, error: "Assignment ID is required" }, { status: 400 });
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
