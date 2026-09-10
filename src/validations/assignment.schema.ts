import { z } from "zod";

export const AssignmentCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  batchIds: z.array(z.string()).default([]),
  title: z.string().min(3, "Title is required").max(120),
  description: z.string().min(5, "Description is required"),
  instructions: z.string().optional().nullable(),
  deadline: z.string().or(z.date()).optional().nullable(),
  totalMarks: z.number().int().min(1).default(100),
  allowedFileTypes: z.array(z.string()).default(["pdf", "zip", "docx", "pptx"]),
  maxFileSizeMb: z.number().int().min(1).max(100).default(25),
});

export const AssignmentUpdateSchema = z.object({
  title: z.string().min(3, "Title is required").max(120).optional(),
  description: z.string().min(5, "Description is required").optional(),
  instructions: z.string().optional().nullable(),
  deadline: z.string().or(z.date()).optional().nullable(),
  totalMarks: z.number().int().min(1).optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSizeMb: z.number().int().min(1).max(100).optional(),
  batchIds: z.array(z.string()).optional(),
});

export const AssignmentEvaluationSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  marksAwarded: z.number().min(0, "Marks cannot be negative"),
  feedbackText: z.string().min(3, "Feedback text is required"),
  status: z.enum(["EVALUATED", "RESUBMISSION_REQUESTED", "SUBMITTED"]).optional().default("EVALUATED"),
});

export type AssignmentCreateInput = z.infer<typeof AssignmentCreateSchema>;
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>;
export type AssignmentEvaluationInput = z.infer<typeof AssignmentEvaluationSchema>;
