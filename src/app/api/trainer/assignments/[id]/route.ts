import { NextRequest, NextResponse } from "next/server";
import { AssignmentService } from "@/services/assignment.service";
import { AssignmentUpdateSchema } from "@/validations/assignment.schema";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    const assignment = await AssignmentService.getAssignmentById(
      session.userId,
      id,
      session.role === "ADMIN"
    );

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();

    const validated = AssignmentUpdateSchema.parse(body);

    const updated = await AssignmentService.updateAssignment(
      session.userId,
      id,
      validated,
      session.role === "ADMIN"
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    await AssignmentService.deleteAssignment(
      session.userId,
      id,
      session.role === "ADMIN"
    );

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
