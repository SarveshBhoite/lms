import { z } from "zod";
import { BatchStatus, LiveClassStatus, AttendanceStatus } from "@prisma/client";

export const BatchCreateSchema = z.object({
  name: z.string().min(3, "Batch name must be at least 3 characters").max(100),
  courseId: z.string().min(1, "Course selection is required"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: z.nativeEnum(BatchStatus).default(BatchStatus.UPCOMING),
  trainerIds: z.array(z.string()).default([]),
  studentIds: z.array(z.string()).default([]),
});

export const BatchUpdateSchema = BatchCreateSchema.partial();

export const BatchStatusUpdateSchema = z.object({
  status: z.nativeEnum(BatchStatus),
});

export const BatchTrainersSyncSchema = z.object({
  trainerIds: z.array(z.string()),
});

export const BatchStudentsSyncSchema = z.object({
  studentIds: z.array(z.string()),
});

export const LiveClassCreateSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  trainerId: z.string().min(1, "Assigned trainer is required"),
  title: z.string().min(3, "Class title must be at least 3 characters").max(120),
  description: z.string().optional().nullable(),
  scheduledDate: z.string().or(z.date()),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  meetUrl: z.string().url("Must be a valid URL (e.g. Google Meet link)"),
  recordingUrl: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.nativeEnum(LiveClassStatus).default(LiveClassStatus.SCHEDULED),
});

export const LiveClassUpdateSchema = LiveClassCreateSchema.partial();

export const AttendanceMarkSchema = z.object({
  liveClassId: z.string().min(1, "Live class ID is required"),
  userId: z.string().min(1, "Student user ID is required"),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
});

export const AttendanceMarkRecordSchema = z.object({
  userId: z.string().min(1, "Student ID is required"),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  joinedTime: z.string().or(z.date()).optional().nullable(),
  leftTime: z.string().or(z.date()).optional().nullable(),
});

export const AttendanceBulkMarkSchema = z.object({
  liveClassId: z.string().min(1, "Live class ID is required"),
  records: z.array(AttendanceMarkRecordSchema),
});

export type BatchCreateInput = z.infer<typeof BatchCreateSchema>;
export type BatchUpdateInput = z.infer<typeof BatchUpdateSchema>;
export type LiveClassCreateInput = z.infer<typeof LiveClassCreateSchema>;
export type LiveClassUpdateInput = z.infer<typeof LiveClassUpdateSchema>;
export type AttendanceMarkInput = z.infer<typeof AttendanceMarkSchema>;
export type AttendanceBulkMarkInput = z.infer<typeof AttendanceBulkMarkSchema>;
