import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError, AuthError } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      throw new AuthError("Unauthorized", 401);
    }

    const { id: liveClassId } = await params;
    const studentId = session.userId;
    const body = await req.json();
    const { reason, documentUrl } = body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ success: false, error: "Please provide a valid reason for absence" }, { status: 400 });
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
    });

    if (!liveClass) {
      return NextResponse.json({ success: false, error: "Live class not found" }, { status: 404 });
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        liveClassId_userId: { liveClassId, userId: studentId },
      },
      update: {
        status: "EXCUSED",
        isApproved: false, // Pending trainer/admin review
        excuseReason: reason.trim(),
        excuseDocumentUrl: documentUrl || null,
        recordedAt: new Date(),
      },
      create: {
        liveClassId,
        userId: studentId,
        status: "EXCUSED",
        isApproved: false,
        excuseReason: reason.trim(),
        excuseDocumentUrl: documentUrl || null,
        recordedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Absence excuse submitted for review",
      data: attendance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
