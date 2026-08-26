import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.userId;

    const certificates = await prisma.certificate.findMany({
      where: { userId: studentId },
      include: {
        course: { select: { id: true, title: true, level: true, durationHours: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json({ success: true, data: certificates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch certificates" }, { status: 500 });
  }
}
