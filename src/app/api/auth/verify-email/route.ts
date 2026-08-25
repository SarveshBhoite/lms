import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { handleApiError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Verification token is required" }, { status: 400 });
    }

    const result = await AuthService.verifyEmail(token);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
