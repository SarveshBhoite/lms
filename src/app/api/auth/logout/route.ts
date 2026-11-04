import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    await AuthService.logout();

    // If request has header x-requested-with: XMLHttpRequest or explicitly asks for json via header
    const acceptHeader = req.headers.get("accept") || "";
    const isFetchRequest =
      acceptHeader === "application/json" ||
      req.headers.get("content-type")?.includes("application/json");

    if (isFetchRequest) {
      return NextResponse.json({ success: true, message: "Logged out successfully" });
    }

    // Standard HTML form submission redirects directly to login
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl, 303);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await AuthService.logout();
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
