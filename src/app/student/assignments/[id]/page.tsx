import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import StudentAssignmentClient from "./StudentAssignmentClient";

export default async function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id: assignmentId } = await params;
  const studentId = session.userId;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: { select: { id: true, title: true } },
      submissions: {
        where: { userId: studentId },
        include: {
          feedback: { include: { trainer: { select: { name: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  const serializedAssignment = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    totalMarks: assignment.totalMarks,
    deadline: assignment.deadline ? assignment.deadline.toISOString() : null,
    course: assignment.course,
    submissions: assignment.submissions.map((sub) => ({
      id: sub.id,
      fileUrl: sub.fileUrl,
      fileName: sub.fileName,
      fileSize: sub.fileSize,
      status: sub.status,
      submittedAt: sub.submittedAt.toISOString(),
      notes: sub.notes || null,
      feedback: sub.feedback
        ? {
            marksAwarded: sub.feedback.marksAwarded,
            feedbackText: sub.feedback.feedbackText,
            trainer: { name: sub.feedback.trainer?.name || "Lead Instructor" },
          }
        : null,
    })),
  };

  return <StudentAssignmentClient initialAssignment={serializedAssignment as any} currentUserId={session.userId} />;
}

