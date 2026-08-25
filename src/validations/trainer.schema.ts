import { z } from "zod";

export const CreateTrainerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  designation: z.string().optional().nullable(), // Specialization
  bio: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  courseIds: z.array(z.string()).optional().default([]),
  batchIds: z.array(z.string()).optional().default([]),
});

export const UpdateTrainerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const AssignTrainerSchema = z.object({
  courseIds: z.array(z.string()),
  batchIds: z.array(z.string()),
});

export type CreateTrainerInput = z.infer<typeof CreateTrainerSchema>;
export type UpdateTrainerInput = z.infer<typeof UpdateTrainerSchema>;
export type AssignTrainerInput = z.infer<typeof AssignTrainerSchema>;
