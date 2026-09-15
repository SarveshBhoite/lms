import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createUserNotification } from "@/lib/notifications";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { EnrollmentCreateSchema } from "@/validations/enrollment.schema";

export async function GET(req: NextRequest) {
  try {
    await requireTrainerOrAdmin();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "ALL";
    const courseId = searchParams.get("courseId") || "";
    const batchId = searchParams.get("batchId") || "";

    const whereClause: any = {};

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (batchId) {
      whereClause.batchId = batchId;
    }

    if (query.trim()) {
      whereClause.OR = [
        { user: { name: { contains: query.trim(), mode: "insensitive" } } },
        { user: { email: { contains: query.trim(), mode: "insensitive" } } },
        { course: { title: { contains: query.trim(), mode: "insensitive" } } },
        { batch: { name: { contains: query.trim(), mode: "insensitive" } } },
      ];
    }

    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            profile: { select: { phone: true, avatarUrl: true } },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            durationHours: true,
            thumbnailUrl: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Attach CourseProgress and Certificate for each student-course pair
    const formatted = await Promise.all(
       enrollments.map(async (enr) => {
         const [progress, certificate] = await Promise.all([
           prisma.courseProgress.findUnique({
             where: {
               userId_courseId: {
                 userId: enr.userId,
                 courseId: enr.courseId,
               },
             },
           }),
           prisma.certificate.findUnique({
             where: {
               userId_courseId: {
                 userId: enr.userId,
                 courseId: enr.courseId,
               },
             },
             select: {
               id: true,
               certificateNumber: true,
               issueDate: true,
             },
           }),
         ]);

         return {
           ...enr,
           certificate: certificate
             ? {
                 id: certificate.id,
                 certificateNumber: certificate.certificateNumber,
                 issueDate: certificate.issueDate.toISOString(),
               }
             : null,
           progress: progress || {
             completedLessonsCount: 0,
             totalLessonsCount: 0,
             progressPercent: 0.0,
             isCompleted: false,
           },
         };
       })
     );

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = EnrollmentCreateSchema.parse(body);

    // Verify student exists
    const studentUser = await prisma.user.findUnique({
      where: { id: validated.userId },
    });
    if (!studentUser) {
      return NextResponse.json(
        { success: false, error: "Selected student account does not exist" },
        { status: 400 }
      );
    }

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

    // If batchId is provided, verify batch belongs to course
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

    // Upsert Enrollment (unique on userId_courseId)
    const isCompleted = validated.status === "COMPLETED";
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: validated.userId,
          courseId: validated.courseId,
        },
      },
      create: {
        userId: validated.userId,
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
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    // If completed status chosen upon enrollment, create certificate and unlock
    if (isCompleted) {
      const existingCert = await prisma.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: validated.userId,
            courseId: validated.courseId,
          },
        },
      });

      if (!existingCert) {
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
            userId: validated.userId,
            courseId: validated.courseId,
            issueDate: new Date(),
            qrCodeUrl: qrCodeDataUrl,
            metadata: {
              studentName: enrollment.user.name,
              studentEmail: enrollment.user.email,
              courseTitle: enrollment.course.title,
              issuedAt: new Date().toISOString(),
            },
          },
        });

        await createUserNotification({
          userId: validated.userId,
          title: "🎓 Certificate Unlocked!",
          message: `Congratulations! Your course ${enrollment.course.title} is completed and your certificate has been unlocked.`,
          type: "CERTIFICATE_ISSUED",
          actionUrl: `/verify/certificate/${certificateNumber}`,
        });
      }
    }

    // If batchId provided, also upsert BatchStudent (unique on batchId_userId)
    if (validated.batchId) {
      await prisma.batchStudent.upsert({
        where: {
          batchId_userId: {
            batchId: validated.batchId,
            userId: validated.userId,
          },
        },
        create: {
          batchId: validated.batchId,
          userId: validated.userId,
        },
        update: {},
      });
    }

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "STUDENT_ENROLLED",
        resource: `Enrollment:${enrollment.id}`,
        details: {
          studentName: enrollment.user.name,
          courseTitle: enrollment.course.title,
          batchName: enrollment.batch?.name || "Self-Paced",
          status: enrollment.status,
        },
      },
    });

    return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
