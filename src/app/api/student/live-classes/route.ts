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

    const liveClasses = await prisma.liveClass.findMany({
      where: {
        batch: { students: { some: { userId: studentId } } },
      },
      include: {
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
        trainer: { select: { id: true, name: true, email: true } },
        attendances: {
          where: { userId: studentId },
          select: { status: true },
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ success: true, data: liveClasses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch live classes" }, { status: 500 });
  }
}
