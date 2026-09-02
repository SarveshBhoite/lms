import prisma from "@/lib/prisma";

export interface CertificateMetadata {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  batchName: string;
  trainerName: string;
  issueDate: string;
  instituteName: string;
  status: "VERIFIED";
  skills?: string[];
}

/**
 * Generate a certificate for a student if course completion criteria are met.
 * Prevents duplicate certificate generation and preserves original issue date.
 */
export async function generateCertificateForUser(userId: string, courseId: string) {
  // 1. Check if certificate already exists (prevent duplicate generation)
  const existingCertificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          durationHours: true,
          trainer: { select: { name: true } },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (existingCertificate) {
    return existingCertificate;
  }

  // 2. Verify completion criteria in CourseProgress
  const progress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  // Calculate total lessons in course
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId,
      isCompleted: true,
      lesson: { module: { courseId } },
    },
  });

  const isCompleted = (totalLessons > 0 && completedLessons >= totalLessons) || (progress ? progress.isCompleted : false);

  if (!isCompleted && totalLessons > 0) {
    throw new Error("Student has not completed all required course content yet.");
  }

  // 3. Fetch User and Course details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      trainer: { select: { id: true, name: true } },
    },
  });

  if (!user || !course) {
    throw new Error("User or Course not found");
  }

  // 4. Find Batch and Trainer details (preserve even if student leaves batch later)
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: {
      batch: {
        include: {
          trainers: {
            include: { trainer: { select: { name: true } } },
          },
        },
      },
    },
  });

  let batchName = enrollment?.batch?.name;
  let trainerName = enrollment?.batch?.trainers?.[0]?.trainer?.name || course.trainer.name;

  if (!batchName) {
    const batchStudent = await prisma.batchStudent.findFirst({
      where: { userId, batch: { courseId } },
      include: {
        batch: {
          include: {
            trainers: {
              include: { trainer: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (batchStudent) {
      batchName = batchStudent.batch.name;
      if (batchStudent.batch.trainers?.[0]?.trainer?.name) {
        trainerName = batchStudent.batch.trainers[0].trainer.name;
      }
    }
  }

  if (!batchName) {
    batchName = "Data Engineering Batch A";
  }

  // 5. Generate Unique Certificate ID (e.g. CERT-2026-849201)
  let certificateNumber = "";
  let isUnique = false;
  let attempts = 0;
  const currentYear = new Date().getFullYear();

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    certificateNumber = `CERT-${currentYear}-${randomNum}`;
    const check = await prisma.certificate.findUnique({
      where: { certificateNumber },
    });
    if (!check) isUnique = true;
  }

  const issueDateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const metadata: CertificateMetadata = {
    studentName: user.name,
    studentEmail: user.email,
    courseTitle: course.title,
    batchName,
    trainerName,
    issueDate: issueDateFormatted,
    instituteName: "JVM Institute",
    status: "VERIFIED",
    skills: ["SQL", "Python", "PySpark", "Big Data", "GCP", "Azure"],
  };

  // 6. Create Certificate record
  const newCertificate = await prisma.certificate.create({
    data: {
      certificateNumber,
      userId,
      courseId,
      issueDate: new Date(),
      metadata: metadata as any,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          durationHours: true,
          trainer: { select: { name: true } },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // 7. Update Enrollment status to COMPLETED if not already
  if (enrollment) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "COMPLETED",
        completedAt: enrollment.completedAt || new Date(),
      },
    });
  }

  // 8. Create Notification for Student
  await prisma.notification.create({
    data: {
      userId,
      title: "Certificate Issued! 🎓",
      message: `Congratulations! Your official certificate for "${course.title}" has been issued.`,
      type: "CERTIFICATE_ISSUED",
      actionUrl: "/student/certificates",
    },
  });

  // 9. Write Activity Log
  await prisma.activityLog.create({
    data: {
      userId,
      action: "CERTIFICATE_ISSUED",
      resource: `Certificate:${newCertificate.certificateNumber}`,
      details: {
        courseId,
        courseTitle: course.title,
        certificateNumber: newCertificate.certificateNumber,
      },
    },
  });

  return newCertificate;
}
