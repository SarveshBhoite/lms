import { NextRequest, NextResponse } from "next/server";
import { ForgotPasswordSchema, ResetPasswordSchema } from "@/validations/auth.schema";
import { AuthService } from "@/services/auth.service";
import { handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "request") {
      const { email } = ForgotPasswordSchema.parse(body);
      const result = await AuthService.requestPasswordReset(email);
      return NextResponse.json(result);
    } else if (body.action === "reset") {
      const { token, password } = ResetPasswordSchema.parse(body);
      const result = await AuthService.resetPassword(token, password);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
