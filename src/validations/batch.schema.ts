import { z } from "zod";

export const LiveClassCreateSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  title: z.string().min(3, "Class title is required").max(120),
  description: z.string().optional().nullable(),
  scheduledDate: z.string().or(z.date()),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  meetUrl: z.string().url("Must be a valid URL e.g. Google Meet link"),
  recordingUrl: z.string().url().optional().or(z.literal("")).nullable(),
});

export const AttendanceMarkSchema = z.object({
  liveClassId: z.string().min(1, "Live class ID is required"),
  userId: z.string().min(1, "Student user ID is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).default("PRESENT"),
});

export type LiveClassCreateInput = z.infer<typeof LiveClassCreateSchema>;
export type AttendanceMarkInput = z.infer<typeof AttendanceMarkSchema>;
