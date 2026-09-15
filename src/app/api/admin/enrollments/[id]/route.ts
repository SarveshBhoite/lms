import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createUserNotification } from "@/lib/notifications";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { EnrollmentUpdateSchema } from "@/validations/enrollment.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            profile: true,
          },
        },
        course: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
            _count: { select: { modules: true } },
          },
        },
        batch: {
          include: {
            trainers: { include: { trainer: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const [courseProgress, lessonProgresses] = await Promise.all([
      prisma.courseProgress.findUnique({
        where: {
          userId_courseId: {
            userId: enrollment.userId,
            courseId: enrollment.courseId,
          },
        },
      }),
      prisma.lessonProgress.findMany({
        where: {
          userId: enrollment.userId,
          lesson: {
            module: { courseId: enrollment.courseId },
          },
        },
        include: {
          lesson: { select: { id: true, title: true, durationMinutes: true } },
        },
        orderBy: { lastWatchedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...enrollment,
        progress: courseProgress || {
          completedLessonsCount: 0,
          totalLessonsCount: 0,
          progressPercent: 0.0,
          isCompleted: false,
        },
        lessonProgresses,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();
    const validated = EnrollmentUpdateSchema.parse(body);

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id },
    });
    if (!existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validated.status) {
      updateData.status = validated.status;
      if (validated.status === "COMPLETED") {
        updateData.completedAt = new Date();

        // Check if certificate already exists for this student & course
        const existingCert = await prisma.certificate.findUnique({
          where: {
            userId_courseId: {
              userId: existingEnrollment.userId,
              courseId: existingEnrollment.courseId,
            },
          },
        });

        if (!existingCert) {
          // Fetch student and course details for certificate creation
          const [studentUser, courseData] = await Promise.all([
            prisma.user.findUnique({
              where: { id: existingEnrollment.userId },
              select: { id: true, name: true, email: true },
            }),
            prisma.course.findUnique({
              where: { id: existingEnrollment.courseId },
              select: { id: true, title: true },
            }),
          ]);

          if (studentUser && courseData) {
            const randomSuffix = Math.floor(100000 + Math.random() * 900000);
            const year = new Date().getFullYear();
            const certificateNumber = `JVM-CERT-${year}-${randomSuffix}`;

            let qrCodeDataUrl = "";
            try {
              const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "https://jvm.institute";
              const verificationUrl = `${origin}/verify/certificate/${certificateNumber}`;
              const QRCode = (await import("qrcode")).default;
              qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
                margin: 1,
                width: 250,
                color: {
                  dark: "#1e1b4b",
                  light: "#ffffff",
                },
              });
            } catch (qrErr) {
              console.error("Failed to generate certificate QR code:", qrErr);
            }

            await prisma.certificate.create({
              data: {
                certificateNumber,
                userId: studentUser.id,
                courseId: courseData.id,
                issueDate: new Date(),
                qrCodeUrl: qrCodeDataUrl,
                metadata: {
                  studentName: studentUser.name,
                  studentEmail: studentUser.email,
                  courseTitle: courseData.title,
                  issuedAt: new Date().toISOString(),
                },
              },
            });

            // Notify the student that certificate has been unlocked with Web Push dispatch
            await createUserNotification({
              userId: studentUser.id,
              title: "🎓 Certificate Unlocked!",
              message: `Congratulations! Your course ${courseData.title} is completed and your certificate has been unlocked.`,
              type: "CERTIFICATE_ISSUED",
              actionUrl: `/verify/certificate/${certificateNumber}`,
            });
          }
        }
      } else {
        updateData.completedAt = null;
      }
    }

    // Handle batch re-allocation if batchId is specified
    if (validated.batchId !== undefined) {
      const oldBatchId = existingEnrollment.batchId;
      const newBatchId = validated.batchId;

      updateData.batchId = newBatchId;

      // Remove from previous batch in BatchStudent if any
      if (oldBatchId && oldBatchId !== newBatchId) {
        await prisma.batchStudent.deleteMany({
          where: { batchId: oldBatchId, userId: existingEnrollment.userId },
        });
      }

      // Add to new batch in BatchStudent if set
      if (newBatchId) {
        // Verify new batch belongs to this course
        const newBatch = await prisma.batch.findUnique({ where: { id: newBatchId } });
        if (!newBatch || newBatch.courseId !== existingEnrollment.courseId) {
          return NextResponse.json(
            { success: false, error: "New batch does not belong to this course" },
            { status: 400 }
          );
        }

        await prisma.batchStudent.upsert({
          where: {
            batchId_userId: { batchId: newBatchId, userId: existingEnrollment.userId },
          },
          create: { batchId: newBatchId, userId: existingEnrollment.userId },
          update: {},
        });
      }
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ENROLLMENT_UPDATED",
        resource: `Enrollment:${id}`,
        details: {
          studentName: updated.user.name,
          courseTitle: updated.course.title,
          newBatch: updated.batch?.name || "Self-Paced",
          status: updated.status,
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // If batchId set, remove from BatchStudent table as well
    if (enrollment.batchId) {
      await prisma.batchStudent.deleteMany({
        where: { batchId: enrollment.batchId, userId: enrollment.userId },
      });
    }

    await prisma.enrollment.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ENROLLMENT_CANCELLED",
        resource: `Enrollment:${id}`,
        details: {
          studentName: enrollment.user.name,
          courseTitle: enrollment.course.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Enrollment for ${enrollment.user.name} removed successfully`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
