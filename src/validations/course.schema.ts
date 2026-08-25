import { z } from "zod";
import { CourseLevel, CourseStatus } from "@prisma/client";

export const CourseCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(120),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  objectives: z.array(z.string()).default([]),
  durationHours: z.number().min(1, "Duration must be at least 1 hour").max(500),
  level: z.nativeEnum(CourseLevel).default(CourseLevel.BEGINNER),
  prerequisites: z.array(z.string()).default([]),
});

export const CourseUpdateSchema = CourseCreateSchema.partial().extend({
  status: z.nativeEnum(CourseStatus).optional(),
});

export const ModuleCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(3, "Module title is required").max(100),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const LessonCreateSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  title: z.string().min(3, "Lesson title is required").max(100),
  description: z.string().optional().nullable(),
  contentType: z.enum(["VIDEO", "PDF", "PPT", "DOC", "CODE", "LINK", "TEXT"]).default("VIDEO"),
  contentUrl: z.string().url().optional().or(z.literal("")).nullable(),
  textContent: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(1).default(15),
  orderIndex: z.number().int().default(0),
  isFreePreview: z.boolean().default(false),
});

export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof CourseUpdateSchema>;
export type ModuleCreateInput = z.infer<typeof ModuleCreateSchema>;
export type LessonCreateInput = z.infer<typeof LessonCreateSchema>;
