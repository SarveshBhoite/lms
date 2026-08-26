import { Role } from "@prisma/client";
import { getSession, SessionPayload } from "./auth";
import { NextResponse } from "next/server";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Server-side RBAC Guard for Server Actions and Route Handlers.
 * Throws AuthError or returns the verified session.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new AuthError("Unauthorized: Authentication is required", 401);
  }
  return session;
}

/**
 * Assert that the authenticated user possesses one of the allowed roles.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(
      `Forbidden: Access denied. Required role: [${allowedRoles.join(", ")}], your role: [${session.role}]`,
      403
    );
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  return requireRole([Role.ADMIN]);
}

export async function requireTrainerOrAdmin(): Promise<SessionPayload> {
  return requireRole([Role.TRAINER, Role.ADMIN]);
}

export async function requireActiveTrainer(): Promise<SessionPayload> {
  const session = await requireTrainerOrAdmin();
  const prisma = (await import("./prisma")).default;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, role: true },
  });
  if (!user || !user.isActive) {
    throw new AuthError("Forbidden: Account is inactive or disabled", 403);
  }
  return session;
}

export async function verifyTrainerCourseAccess(trainerId: string, courseId: string, isRoleAdmin: boolean = false): Promise<boolean> {
  if (isRoleAdmin) return true;
  const prisma = (await import("./prisma")).default;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { trainerId: true, batches: { select: { trainers: { select: { trainerId: true } } } } },
  });
  if (!course) return false;
  if (course.trainerId === trainerId) return true;
  const isBatchTrainer = course.batches.some((b) => b.trainers.some((t) => t.trainerId === trainerId));
  return isBatchTrainer;
}

export async function verifyTrainerBatchAccess(trainerId: string, batchId: string, isRoleAdmin: boolean = false): Promise<boolean> {
  if (isRoleAdmin) return true;
  const prisma = (await import("./prisma")).default;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { courseId: true, course: { select: { trainerId: true } }, trainers: { select: { trainerId: true } } },
  });
  if (!batch) return false;
  if (batch.course.trainerId === trainerId) return true;
  if (batch.trainers.some((t) => t.trainerId === trainerId)) return true;
  return false;
}

export async function requireStudent(): Promise<SessionPayload> {
  return requireRole([Role.STUDENT, Role.ADMIN]);
}

/**
 * Standard API error response helper
 */
export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { success: false, error: "Internal Server Error" },
    { status: 500 }
  );
}

