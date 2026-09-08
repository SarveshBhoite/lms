import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const studentId = session.userId;

    // Check student and course
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, email: true },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      }),
    ]);

    if (!user || !course) {
      return NextResponse.json({ success: false, error: "User or Course not found" }, { status: 404 });
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: course.id,
        },
      },
    });

    if (existingCert) {
      return NextResponse.json({ success: true, data: existingCert });
    }

    // Verify course completion criteria
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    const finalLesson = allLessons.find((l) => l.isFinalLesson);

    if (totalLessons === 0) {
      return NextResponse.json({ success: false, error: "Course has no lessons" }, { status: 400 });
    }

    // Must have at least one final lesson designated
    if (!finalLesson) {
      return NextResponse.json(
        {
          success: false,
          error: "Course curriculum is still in progress. Final lesson is not posted yet.",
        },
        { status: 400 }
      );
    }

    // Count student's completed lessons
    const completedProgresses = await prisma.lessonProgress.findMany({
      where: {
        userId: studentId,
        isCompleted: true,
        lesson: { module: { courseId } },
      },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(completedProgresses.map((p) => p.lessonId));
    const isAllLessonsCompleted = totalLessons > 0 && completedLessonIds.size >= totalLessons;
    const isFinalLessonCompleted = completedLessonIds.has(finalLesson.id);

    if (!isAllLessonsCompleted || !isFinalLessonCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: "You must complete 100% of all course lessons and requirements to claim your certificate.",
        },
        { status: 400 }
      );
    }

    // Generate unique certificate ID e.g. JVM-CERT-2026-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const year = new Date().getFullYear();
    const certificateNumber = `JVM-CERT-${year}-${randomSuffix}`;

    // Generate QR code Data URL pointing to public verification page
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "https://jvm.institute";
    const verificationUrl = `${origin}/verify/certificate/${certificateNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: "#1e1b4b",
        light: "#ffffff",
      },
    });

    // Save Certificate record
    const newCertificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        userId: studentId,
        courseId: course.id,
        issueDate: new Date(),
        qrCodeUrl: qrCodeDataUrl,
        metadata: {
          studentName: user.name,
          studentEmail: user.email,
          courseTitle: course.title,
          verificationUrl,
          issuedAt: new Date().toISOString(),
        },
      },
    });

    // Create a notification for the student
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: "🎓 Certificate Issued!",
        message: `Congratulations! Your certificate for ${course.title} has been generated.`,
        type: "CERTIFICATE_ISSUED",
        actionUrl: `/verify/certificate/${certificateNumber}`,
      },
    });

    return NextResponse.json({ success: true, data: newCertificate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate certificate" }, { status: 500 });
  }
}
