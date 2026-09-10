import { z } from "zod";
import { QuestionType, QuestionDifficulty, QuizStatus } from "@prisma/client";

export const QuestionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean().default(false),
  orderIndex: z.number().int().default(0),
});

export const QuestionCreateSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(3, "Question text is required"),
  type: z.nativeEnum(QuestionType).default(QuestionType.MCQ),
  difficulty: z.nativeEnum(QuestionDifficulty).default(QuestionDifficulty.MEDIUM),
  marks: z.number().int().min(1).default(1),
  explanation: z.string().optional().nullable(),
  correctAnswerText: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
  options: z.array(QuestionOptionSchema).default([]),
}).refine((data) => {
  if (data.type === QuestionType.FILL_IN_BLANK) {
    return Boolean(data.correctAnswerText && data.correctAnswerText.trim().length > 0);
  }
  return data.options.length >= 2;
}, {
  message: "Multiple choice/True-False questions must have at least 2 options, and Fill in the Blank questions require an expected answer text.",
  path: ["options"],
});

export const QuizCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  batchIds: z.array(z.string()).default([]),
  title: z.string().min(3, "Quiz title is required").max(100),
  description: z.string().optional().nullable(),
  timeLimitMinutes: z.number().int().min(5).max(180).default(30),
  passingMarks: z.number().int().min(1).max(100).default(60),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  status: z.nativeEnum(QuizStatus).default(QuizStatus.PUBLISHED),
  questions: z.array(QuestionCreateSchema).optional().default([]),
});

export const QuizUpdateSchema = z.object({
  title: z.string().min(3, "Quiz title is required").max(100).optional(),
  description: z.string().optional().nullable(),
  timeLimitMinutes: z.number().int().min(5).max(180).optional(),
  passingMarks: z.number().int().min(1).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  status: z.nativeEnum(QuizStatus).optional(),
  batchIds: z.array(z.string()).optional(),
  questions: z.array(QuestionCreateSchema).optional(),
});

export type QuizCreateInput = z.infer<typeof QuizCreateSchema>;
export type QuizUpdateInput = z.infer<typeof QuizUpdateSchema>;
export type QuestionCreateInput = z.infer<typeof QuestionCreateSchema>;
