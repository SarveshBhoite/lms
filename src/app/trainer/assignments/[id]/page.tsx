import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import TrainerAssignmentEvaluateClient from "./TrainerAssignmentEvaluateClient";

export default async function TrainerAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          batches: {
            select: { id: true, name: true, status: true },
          },
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
          module: { select: { title: true } },
        },
      },
      submissions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              
              profile: { select: { avatarUrl: true, phone: true } },
            },
          },
          feedback: {
            include: {
              trainer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  const hasAccess = await verifyTrainerCourseAccess(
    session.userId,
    assignment.courseId,
    isAdmin
  );
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  // Serialize dates
  const serializedAssignment = {
    id: assignment.id,
    courseId: assignment.courseId,
    batchIds: assignment.batchIds || [],
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions,
    deadline: assignment.deadline ? assignment.deadline.toISOString() : null,
    totalMarks: assignment.totalMarks,
    allowedFileTypes: assignment.allowedFileTypes,
    maxFileSizeMb: assignment.maxFileSizeMb,
    createdAt: assignment.createdAt.toISOString(),
    course: assignment.course,
    lesson: assignment.lesson,
    submissions: assignment.submissions.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      fileUrl: sub.fileUrl,
      fileName: sub.fileName,
      fileSize: sub.fileSize,
      notes: sub.notes || null,
      status: sub.status,
      submittedAt: sub.submittedAt.toISOString(),
      user: {
        id: sub.user.id,
        name: sub.user.name,
        email: sub.user.email,
        image: sub.user.profile?.avatarUrl || null,
        avatarUrl: sub.user.profile?.avatarUrl || null,
        phone: sub.user.profile?.phone || null,
      },
      feedback: sub.feedback
        ? {
            id: sub.feedback.id,
            marksAwarded: sub.feedback.marksAwarded,
            feedbackText: sub.feedback.feedbackText,
            evaluatedAt: sub.feedback.evaluatedAt.toISOString(),
            trainerName: sub.feedback.trainer?.name || "Lead Faculty",
          }
        : null,
    })),
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <TrainerAssignmentEvaluateClient initialAssignment={serializedAssignment} />
    </div>
  );
}

