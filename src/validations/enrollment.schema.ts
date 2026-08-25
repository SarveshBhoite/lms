import { z } from "zod";
import { EnrollmentStatus } from "@prisma/client";

export const EnrollmentCreateSchema = z.object({
  userId: z.string().min(1, "Student selection is required"),
  courseId: z.string().min(1, "Course selection is required"),
  batchId: z.string().optional().nullable(),
  status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
});

export const BulkEnrollmentCreateSchema = z.object({
  courseId: z.string().min(1, "Course selection is required"),
  batchId: z.string().optional().nullable(),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
});

export const EnrollmentUpdateSchema = z.object({
  batchId: z.string().optional().nullable(),
  status: z.nativeEnum(EnrollmentStatus).optional(),
});

export type EnrollmentCreateInput = z.infer<typeof EnrollmentCreateSchema>;
export type BulkEnrollmentCreateInput = z.infer<typeof BulkEnrollmentCreateSchema>;
export type EnrollmentUpdateInput = z.infer<typeof EnrollmentUpdateSchema>;
