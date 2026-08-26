import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: assignmentId } = await params;
    const studentId = session.userId;
    const body = await req.json();

    const { fileUrl, fileName = "assignment_submission.pdf", fileSize = 1024 * 500 } = body;

    if (!fileUrl) {
      throw new Error("File URL or project link is required for submission");
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, title: true },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    // Upsert submission
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId: studentId },
    });

    let submission;
    if (existingSubmission) {
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl,
          fileName,
          fileSize: Number(fileSize),
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    } else {
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          userId: studentId,
          fileUrl,
          fileName,
          fileSize: Number(fileSize),
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    }

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: `Assignment Submitted: ${assignment.title}`,
        message: `Your project solution for "${assignment.title}" was successfully submitted.`,
        type: "ASSIGNMENT_DUE",
        actionUrl: `/student/assignments/${assignmentId}`,
      },
    });

    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to submit assignment" }, { status: 500 });
  }
}
