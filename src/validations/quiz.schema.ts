import { z } from "zod";
import { QuestionType, QuestionDifficulty, QuizStatus } from "@prisma/client";

export const QuestionOptionSchema = z.object({
  text: z.string().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean().default(false),
  orderIndex: z.number().int().default(0),
});

export const QuestionCreateSchema = z.object({
  question: z.string().min(3, "Question text is required"),
  type: z.nativeEnum(QuestionType).default(QuestionType.MCQ),
  difficulty: z.nativeEnum(QuestionDifficulty).default(QuestionDifficulty.MEDIUM),
  marks: z.number().int().min(1).default(1),
  explanation: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
  options: z.array(QuestionOptionSchema).min(2, "At least 2 options are required"),
});

export const QuizCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  lessonId: z.string().optional().nullable(),
  isRequiredForUnlock: z.boolean().default(false),
  title: z.string().min(3, "Quiz title is required").max(100),
  description: z.string().optional().nullable(),
  timeLimitMinutes: z.number().int().min(5).max(180).default(30),
  passingMarks: z.number().int().min(1).max(100).default(60),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  status: z.nativeEnum(QuizStatus).default(QuizStatus.PUBLISHED),
  questions: z.array(QuestionCreateSchema).optional().default([]),
});

export type QuizCreateInput = z.infer<typeof QuizCreateSchema>;
export type QuestionCreateInput = z.infer<typeof QuestionCreateSchema>;
