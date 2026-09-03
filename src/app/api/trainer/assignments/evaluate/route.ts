import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, marksAwarded, feedbackText, status = "EVALUATED" } = await req.json();

    if (!submissionId || marksAwarded === undefined || !feedbackText) {
      return NextResponse.json(
        { success: false, error: "Missing submissionId, marksAwarded, or feedbackText" },
        { status: 400 }
      );
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      return NextResponse.json({ success: false, error: "Assignment submission not found" }, { status: 404 });
    }

    // Upsert feedback record
    await prisma.assignmentFeedback.upsert({
      where: { submissionId },
      create: {
        submissionId,
        trainerId: session.userId,
        marksAwarded: Number(marksAwarded),
        feedbackText,
      },
      update: {
        trainerId: session.userId,
        marksAwarded: Number(marksAwarded),
        feedbackText,
      },
    });

    // Update submission status (EVALUATED, RESUBMISSION_REQUESTED, or SUBMITTED)
    const validStatus = ["EVALUATED", "RESUBMISSION_REQUESTED", "SUBMITTED"].includes(status)
      ? (status as any)
      : "EVALUATED";

    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { status: validStatus },
    });

    // Send notification to student
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: validStatus === "RESUBMISSION_REQUESTED" ? "Assignment Revision Requested" : "Assignment Evaluated",
        message: `Your submission for '${submission.assignment.title}' was reviewed. Status: ${validStatus}. Marks: ${marksAwarded}/${submission.assignment.totalMarks}. Remarks: "${feedbackText}"`,
        type: "ASSIGNMENT_EVALUATED",
        actionUrl: `/student/assignments/${submission.assignmentId}`,
      },
    });

    return NextResponse.json({ success: true, message: "Submission evaluated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate assignment" },
      { status: 500 }
    );
  }
}
