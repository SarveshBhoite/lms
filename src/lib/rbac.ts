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
