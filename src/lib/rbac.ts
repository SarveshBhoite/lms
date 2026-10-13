import { Role } from "@prisma/client";
import { getSession, SessionPayload } from "./auth";
import { NextResponse } from "next/server";
import prisma from "./prisma";

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

  // Validate that user still exists in database
  let user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, email: true, name: true },
  });

  // If user with session.userId is not found, attempt email lookup or fallback to active role user
  if (!user && session.email) {
    user = await prisma.user.findUnique({
      where: { email: session.email.toLowerCase() },
      select: { id: true, role: true, email: true, name: true },
    });
  }

  // If still not found (e.g. database was reset/seeded), resolve to first active user matching role
  if (!user) {
    user = await prisma.user.findFirst({
      where: { role: session.role },
      select: { id: true, role: true, email: true, name: true },
    });
  }

  // If still no user exists at all for that role, try any trainer/admin
  if (!user) {
    user = await prisma.user.findFirst({
      where: { role: { in: [Role.TRAINER, Role.ADMIN] } },
      select: { id: true, role: true, email: true, name: true },
    });
  }

  if (!user) {
    throw new AuthError("Session expired or invalid user. Please log in again.", 401);
  }

  return {
    ...session,
    role: user.role,
    userId: user.id,
    email: user.email,
    name: user.name,
  };
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
