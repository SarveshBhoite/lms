import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const secretKey = process.env.AUTH_SECRET || "fallback-secret-for-development-mode-min-32-chars-key!";
const key = new TextEncoder().encode(secretKey);

export const AUTH_COOKIE_NAME = "lms_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  expires: Date;
}

export async function encryptToken(payload: Omit<SessionPayload, "expires">): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

const tokenCache = new Map<string, { payload: SessionPayload; expiresAt: number }>();

export async function decryptToken(token: string): Promise<SessionPayload | null> {
  try {
    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }

    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    const sessionData = payload as unknown as SessionPayload;
    // Cache for 5 minutes
    tokenCache.set(token, {
      payload: sessionData,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return sessionData;
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; email: string; name: string; role: Role }) {
  const token = await encryptToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return token;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptToken(token);
}
