import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { handleApiError } from "@/lib/rbac";

export async function POST() {
  try {
    await AuthService.logout();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
