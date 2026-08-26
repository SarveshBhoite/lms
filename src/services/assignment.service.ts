import prisma from "@/lib/prisma";
import { AssignmentCreateInput, AssignmentEvaluationInput } from "@/validations/assignment.schema";
import { SubmissionStatus } from "@prisma/client";
import { verifyTrainerCourseAccess } from "@/lib/rbac";

export class AssignmentService {
  static async getTrainerAssignments(trainerId: string, isAdmin = false) {
    return prisma.assignment.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          include: {
            user: { include: { profile: true } },
            feedback: true,
          },
        },
      },
      orderBy: { deadline: "asc" },
    });
  }

  static async createAssignment(trainerId: string, data: AssignmentCreateInput, isAdmin = false) {
    const hasAccess = await verifyTrainerCourseAccess(trainerId, data.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You are not assigned to teach this course");

    return prisma.$transaction(async (tx) => {
      const asgn = await tx.assignment.create({
        data: {
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          deadline: new Date(data.deadline),
          totalMarks: data.totalMarks,
          allowedFileTypes: data.allowedFileTypes,
          maxFileSizeMb: data.maxFileSizeMb,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "ASSIGNMENT_CREATED",
          resource: `Assignment:${asgn.id}`,
          details: { title: asgn.title, deadline: asgn.deadline },
        },
      });

      return asgn;
    });
  }

  static async evaluateSubmission(trainerId: string, data: AssignmentEvaluationInput, isAdmin = false) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: data.submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) throw new Error("Submission not found");
    const hasAccess = await verifyTrainerCourseAccess(trainerId, submission.assignment.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You are not assigned to evaluate this submission");

    return prisma.$transaction(async (tx) => {
      const feedback = await tx.assignmentFeedback.upsert({
        where: { submissionId: data.submissionId },
        update: {
          marksAwarded: data.marksAwarded,
          feedbackText: data.feedbackText,
          evaluatedAt: new Date(),
        },
        create: {
          submissionId: data.submissionId,
          trainerId,
          marksAwarded: data.marksAwarded,
          feedbackText: data.feedbackText,
        },
      });

      await tx.assignmentSubmission.update({
        where: { id: data.submissionId },
        data: { status: SubmissionStatus.EVALUATED },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "ASSIGNMENT_EVALUATED",
          resource: `Submission:${submission.id}`,
          details: { marksAwarded: data.marksAwarded },
        },
      });

      return feedback;
    });
  }
}

