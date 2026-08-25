import prisma from "@/lib/prisma";
import { AssignmentCreateInput, AssignmentEvaluationInput } from "@/validations/assignment.schema";
import { SubmissionStatus } from "@prisma/client";

export class AssignmentService {
  static async getTrainerAssignments(trainerId: string) {
    return prisma.assignment.findMany({
      where: {
        course: { trainerId },
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
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) throw new Error("Course not found");
    if (!isAdmin && course.trainerId !== trainerId) throw new Error("Forbidden");

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
    if (!isAdmin && submission.assignment.course.trainerId !== trainerId) throw new Error("Forbidden");

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
