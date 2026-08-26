import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { assignmentId, projectUrl, notes, fileName } = await req.json();

    if (!assignmentId || !projectUrl) {
      return NextResponse.json(
        { success: false, error: "Assignment ID and Project Submission URL are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: session.userId,
        },
      },
      create: {
        assignmentId,
        userId: session.userId,
        fileUrl: projectUrl,
        fileName: fileName || "Solution Repository / Deliverable",
        fileSize: 1024,
        notes: notes || null,
        status: "SUBMITTED",
      },
      update: {
        fileUrl: projectUrl,
        fileName: fileName || "Solution Repository / Deliverable",
        notes: notes || null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment submitted successfully to your faculty instructor.",
      submission,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
