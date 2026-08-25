import { z } from "zod";
import { CourseLevel, CourseStatus, ContentType } from "@prisma/client";

export const CourseCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(150),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  objectives: z.array(z.string()).default([]),
  durationHours: z.number().min(1, "Duration must be at least 1 hour").max(1000),
  level: z.nativeEnum(CourseLevel).default(CourseLevel.BEGINNER),
  prerequisites: z.array(z.string()).default([]),
  trainerId: z.string().min(1, "Assigned trainer is required"),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
});

export const CourseUpdateSchema = CourseCreateSchema.partial();

export const CourseStatusUpdateSchema = z.object({
  status: z.nativeEnum(CourseStatus),
});

export const ModuleCreateSchema = z.object({
  courseId: z.string().optional(),
  title: z.string().min(2, "Module title is required").max(120),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().default(0),
});

export const ModuleUpdateSchema = ModuleCreateSchema.partial();

export const ModuleReorderSchema = z.object({
  moduleOrders: z.array(
    z.object({
      id: z.string(),
      orderIndex: z.number().int(),
    })
  ),
});

export const LessonCreateSchema = z.object({
  moduleId: z.string().optional(),
  title: z.string().min(2, "Lesson title is required").max(120),
  description: z.string().optional().nullable(),
  contentType: z.nativeEnum(ContentType).default(ContentType.VIDEO),
  contentUrl: z.string().url().optional().or(z.literal("")).nullable(),
  textContent: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(0).default(15),
  orderIndex: z.number().int().default(0),
  isFreePreview: z.boolean().default(false),
});

export const LessonUpdateSchema = LessonCreateSchema.partial();

export const LessonReorderSchema = z.object({
  lessonOrders: z.array(
    z.object({
      id: z.string(),
      orderIndex: z.number().int(),
    })
  ),
});

export const ResourceCreateSchema = z.object({
  title: z.string().min(2, "Resource title is required").max(120),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().int().default(0),
  fileUrl: z.string().url("Valid file URL is required"),
  storageKey: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
});

export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof CourseUpdateSchema>;
export type ModuleCreateInput = z.infer<typeof ModuleCreateSchema>;
export type LessonCreateInput = z.infer<typeof LessonCreateSchema>;
export type ResourceCreateInput = z.infer<typeof ResourceCreateSchema>;
