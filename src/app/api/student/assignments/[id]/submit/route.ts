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

    const { fileUrl, fileName = "assignment_submission.pdf", fileSize = 1024 * 500, notes } = body;

    if (!fileUrl) {
      throw new Error("File URL, project repository, or document link is required for submission");
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, title: true, lessonId: true, courseId: true },
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
          notes: notes || existingSubmission.notes,
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
          notes,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    }

    // If assignment is linked to a lesson, immediately satisfy completion on submission so student isn't blocked!
    if (assignment.lessonId) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: studentId,
            lessonId: assignment.lessonId,
          },
        },
        create: {
          userId: studentId,
          lessonId: assignment.lessonId,
          isCompleted: true,
          completionPercent: 100,
          completedAt: new Date(),
        },
        update: {
          isCompleted: true,
          completionPercent: 100,
          completedAt: new Date(),
        },
      });
    }

    // Create Notification for Student
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: `Assignment Submitted: ${assignment.title}`,
        message: `Your project solution for "${assignment.title}" was successfully submitted.`,
        type: "ASSIGNMENT_DUE",
        actionUrl: `/student/assignments/${assignmentId}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: submission,
      lessonId: assignment.lessonId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to submit assignment" }, { status: 500 });
  }
}
