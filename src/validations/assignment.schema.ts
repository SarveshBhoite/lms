import { z } from "zod";

export const AssignmentCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(3, "Title is required").max(120),
  description: z.string().min(10, "Description is required"),
  instructions: z.string().optional().nullable(),
  deadline: z.string().or(z.date()),
  totalMarks: z.number().int().min(1).default(100),
  allowedFileTypes: z.array(z.string()).default(["pdf", "zip", "docx"]),
  maxFileSizeMb: z.number().int().min(1).max(100).default(25),
});

export const AssignmentEvaluationSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  marksAwarded: z.number().min(0, "Marks cannot be negative"),
  feedbackText: z.string().min(3, "Feedback text is required"),
});

export type AssignmentCreateInput = z.infer<typeof AssignmentCreateSchema>;
export type AssignmentEvaluationInput = z.infer<typeof AssignmentEvaluationSchema>;
