import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { AttendanceBulkMarkSchema } from "@/validations/batch.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: batchId, classId } = await params;

    const [liveClass, batchStudents] = await Promise.all([
      prisma.liveClass.findUnique({
        where: { id: classId, batchId },
        include: {
          attendances: {
            include: {
              user: {
                select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } },
              },
            },
          },
        },
      }),
      prisma.batchStudent.findMany({
        where: { batchId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
    ]);

    if (!liveClass) {
      return NextResponse.json(
        { success: false, error: "Live class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        liveClass,
        students: batchStudents.map((bs) => bs.user),
        attendances: liveClass.attendances,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { classId } = await params;
    const body = await req.json();
    const { records } = AttendanceBulkMarkSchema.parse({ ...body, liveClassId: classId });

    // Upsert attendance records for each student
    const results = await Promise.all(
      records.map(async (record) => {
        return prisma.attendance.upsert({
          where: {
            liveClassId_userId: {
              liveClassId: classId,
              userId: record.userId,
            },
          },
          create: {
            liveClassId: classId,
            userId: record.userId,
            status: record.status,
            joinedTime: record.joinedTime ? new Date(record.joinedTime) : null,
            leftTime: record.leftTime ? new Date(record.leftTime) : null,
          },
          update: {
            status: record.status,
            joinedTime: record.joinedTime ? new Date(record.joinedTime) : null,
            leftTime: record.leftTime ? new Date(record.leftTime) : null,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Attendance updated for ${results.length} students`,
      data: results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
