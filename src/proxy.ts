import { NextRequest, NextResponse } from "next/server";
import { decryptToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Seamlessly redirect removed /trainer/notifications path to /trainer/dashboard
  if (pathname === "/trainer/notifications" || pathname.startsWith("/trainer/notifications/")) {
    return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await decryptToken(token) : null;

  const response = NextResponse.next();

  // Standard Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Protect sensitive Admin API routes
  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Authentication required" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
  }

  // Protect sensitive Trainer API routes
  if (pathname.startsWith("/api/trainer")) {
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Authentication required" }, { status: 401 });
    }
    if (session.role !== "TRAINER" && session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Faculty Trainer access required" }, { status: 403 });
    }
  }

  // Protect Student Pages
  if (pathname.startsWith("/student")) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
  }

  // Protect Trainer Pages (accessible to TRAINER and ADMIN)
  if (pathname.startsWith("/trainer")) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    if (session.role !== "TRAINER" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/unauthorized?required=Faculty+Trainer&from=${encodeURIComponent(pathname)}`, request.url));
    }
  }

  // Protect Admin Pages (accessible ONLY to ADMIN)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/unauthorized?required=Super+Admin&from=${encodeURIComponent(pathname)}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|verify/certificate|public).*)"],
};
