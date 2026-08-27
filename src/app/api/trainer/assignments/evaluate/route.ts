import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, marksAwarded, feedbackText } = await req.json();

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

    // Update submission status to EVALUATED
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { status: "EVALUATED" },
    });

    // Send notification to student
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: "Assignment Evaluated",
        message: `Your submission for '${submission.assignment.title}' was evaluated. Marks: ${marksAwarded}/${submission.assignment.totalMarks}`,
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
