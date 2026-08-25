import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BulkEnrollmentCreateSchema } from "@/validations/enrollment.schema";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = BulkEnrollmentCreateSchema.parse(body);

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: validated.courseId },
    });
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Selected course does not exist" },
        { status: 400 }
      );
    }

    // If batchId provided, verify batch belongs to course
    if (validated.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: validated.batchId },
      });
      if (!batch || batch.courseId !== validated.courseId) {
        return NextResponse.json(
          { success: false, error: "Selected batch does not belong to this course" },
          { status: 400 }
        );
      }
    }

    // Process bulk enrollments securely
    const results = await Promise.all(
      validated.studentIds.map(async (userId) => {
        // Upsert Enrollment
        const enr = await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: validated.courseId,
            },
          },
          create: {
            userId,
            courseId: validated.courseId,
            batchId: validated.batchId || null,
            status: validated.status,
          },
          update: {
            batchId: validated.batchId || null,
            status: validated.status,
          },
        });

        // Upsert BatchStudent if batchId is provided
        if (validated.batchId) {
          await prisma.batchStudent.upsert({
            where: {
              batchId_userId: {
                batchId: validated.batchId,
                userId,
              },
            },
            create: {
              batchId: validated.batchId,
              userId,
            },
            update: {},
          });
        }

        return enr;
      })
    );

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "BULK_STUDENTS_ENROLLED",
        resource: `Course:${validated.courseId}`,
        details: {
          courseTitle: course.title,
          enrolledCount: results.length,
          batchId: validated.batchId || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled ${results.length} students into ${course.title}`,
      data: results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
