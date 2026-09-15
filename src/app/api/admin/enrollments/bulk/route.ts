import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createUserNotification } from "@/lib/notifications";
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

    const isCompleted = validated.status === "COMPLETED";

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
            completedAt: isCompleted ? new Date() : null,
          },
          update: {
            batchId: validated.batchId || null,
            status: validated.status,
            completedAt: isCompleted ? new Date() : null,
          },
        });

        if (isCompleted) {
          const existingCert = await prisma.certificate.findUnique({
            where: {
              userId_courseId: {
                userId,
                courseId: validated.courseId,
              },
            },
          });

          if (!existingCert) {
            const studentUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true },
            });

            if (studentUser) {
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
                  courseId: course.id,
                  issueDate: new Date(),
                  qrCodeUrl: qrCodeDataUrl,
                  metadata: {
                    studentName: studentUser.name,
                    studentEmail: studentUser.email,
                    courseTitle: course.title,
                    issuedAt: new Date().toISOString(),
                  },
                },
              });

              await createUserNotification({
                userId: studentUser.id,
                title: "🎓 Certificate Unlocked!",
                message: `Congratulations! Your course ${course.title} is completed and your certificate has been unlocked.`,
                type: "CERTIFICATE_ISSUED",
                actionUrl: `/verify/certificate/${certificateNumber}`,
              });
            }
          }
        }

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
