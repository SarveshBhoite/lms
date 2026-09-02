import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateCertificateForUser } from "@/lib/certificates";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ success: false, error: "courseId is required" }, { status: 400 });
    }

    const studentId = session.userId;
    const certificate = await generateCertificateForUser(studentId, courseId);

    return NextResponse.json({ success: true, data: certificate });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate certificate" },
      { status: 400 }
    );
  }
}
