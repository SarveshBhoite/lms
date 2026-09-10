import prisma from "@/lib/prisma";
import {
  AssignmentCreateInput,
  AssignmentUpdateInput,
  AssignmentEvaluationInput,
} from "@/validations/assignment.schema";
import { SubmissionStatus } from "@prisma/client";
import { verifyTrainerCourseAccess } from "@/lib/rbac";

export class AssignmentService {
  /**
   * Fetch all assignments (standalone + lesson-linked) assigned to this trainer
   */
  static async getTrainerAssignments(trainerId: string, isAdmin = false) {
    return prisma.assignment.findMany({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            batches: { select: { id: true, name: true, status: true } },
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
                profile: { select: { avatarUrl: true } },
              },
            },
            feedback: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: [
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  /**
   * Get single assignment by ID with permission checks and full submissions
   */
  static async getAssignmentById(trainerId: string, assignmentId: string, isAdmin = false) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            batches: { select: { id: true, name: true, status: true } },
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
                profile: true,
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

    if (!assignment) return null;

    const hasAccess = await verifyTrainerCourseAccess(trainerId, assignment.courseId, isAdmin);
    if (!hasAccess) {
      throw new Error("Forbidden: You are not assigned to teach this course");
    }

    return assignment;
  }

  /**
   * Create a new standalone assignment
   */
  static async createAssignment(trainerId: string, data: AssignmentCreateInput, isAdmin = false) {
    const hasAccess = await verifyTrainerCourseAccess(trainerId, data.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You are not assigned to teach this course");

    return prisma.$transaction(async (tx) => {
      const asgn = await tx.assignment.create({
        data: {
          courseId: data.courseId,
          lessonId: null, // Standalone
          batchIds: data.batchIds || [],
          title: data.title,
          description: data.description,
          instructions: data.instructions || null,
          deadline: data.deadline ? new Date(data.deadline) : null,
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
          details: { title: asgn.title, deadline: asgn.deadline, batchIds: asgn.batchIds },
        },
      });

      return asgn;
    });
  }

  /**
   * Update an existing assignment
   */
  static async updateAssignment(
    trainerId: string,
    assignmentId: string,
    data: AssignmentUpdateInput,
    isAdmin = false
  ) {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true, title: true },
    });

    if (!existing) throw new Error("Assignment not found");

    const hasAccess = await verifyTrainerCourseAccess(trainerId, existing.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You are not assigned to manage this course");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          deadline: data.deadline ? new Date(data.deadline) : (data.deadline === null ? null : undefined),
          totalMarks: data.totalMarks,
          allowedFileTypes: data.allowedFileTypes,
          maxFileSizeMb: data.maxFileSizeMb,
          batchIds: data.batchIds,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "ASSIGNMENT_UPDATED",
          resource: `Assignment:${assignmentId}`,
          details: { title: updated.title },
        },
      });

      return updated;
    });
  }

  /**
   * Delete an assignment
   */
  static async deleteAssignment(trainerId: string, assignmentId: string, isAdmin = false) {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true, title: true },
    });

    if (!existing) throw new Error("Assignment not found");

    const hasAccess = await verifyTrainerCourseAccess(trainerId, existing.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You are not assigned to manage this course");

    return prisma.$transaction(async (tx) => {
      await tx.assignment.delete({
        where: { id: assignmentId },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "ASSIGNMENT_DELETED",
          resource: `Assignment:${assignmentId}`,
          details: { title: existing.title },
        },
      });

      return { success: true };
    });
  }

  /**
   * Evaluate a student submission
   */
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

      const nextStatus = data.status ? (data.status as SubmissionStatus) : SubmissionStatus.EVALUATED;

      await tx.assignmentSubmission.update({
        where: { id: data.submissionId },
        data: { status: nextStatus },
      });

      // Notify student
      await tx.notification.create({
        data: {
          userId: submission.userId,
          title: nextStatus === SubmissionStatus.RESUBMISSION_REQUESTED ? "Assignment Revision Requested" : "Assignment Evaluated",
          message: `Your submission for '${submission.assignment.title}' was reviewed. Status: ${nextStatus}. Marks: ${data.marksAwarded}/${submission.assignment.totalMarks}. Remarks: "${data.feedbackText}"`,
          type: "ASSIGNMENT_EVALUATED",
          actionUrl: `/student/assignments/${submission.assignmentId}`,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "ASSIGNMENT_EVALUATED",
          resource: `Submission:${submission.id}`,
          details: { marksAwarded: data.marksAwarded, status: nextStatus },
        },
      });

      return feedback;
    });
  }
}

