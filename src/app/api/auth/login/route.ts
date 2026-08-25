import { NextRequest, NextResponse } from "next/server";
import { LoginSchema } from "@/validations/auth.schema";
import { AuthService } from "@/services/auth.service";
import { handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = LoginSchema.parse(body);
    const result = await AuthService.login(validatedData);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
