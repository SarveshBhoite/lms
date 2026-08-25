import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema } from "@/validations/auth.schema";
import { AuthService } from "@/services/auth.service";
import { handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = RegisterSchema.parse(body);
    const result = await AuthService.register(validatedData);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
