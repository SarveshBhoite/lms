import "dotenv/config";
import prisma from "./lib/prisma";
import { generateCertificateForUser } from "./lib/certificates";

async function main() {
  console.log("=== SYNCING CERTIFICATES FOR COMPLETED COURSES ===");

  // Find all completed CourseProgress records
  const completedProgresses = await prisma.courseProgress.findMany({
    where: {
      OR: [
        { isCompleted: true },
        { progressPercent: { gte: 100 } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  console.log(`Found ${completedProgresses.length} completed course progress record(s).`);

  for (const cp of completedProgresses) {
    try {
      console.log(`Processing student "${cp.user.name}" (${cp.user.email}) for course "${cp.course.title}"...`);
      const cert = await generateCertificateForUser(cp.userId, cp.courseId);
      console.log(` -> Certificate READY: ID=${cert.certificateNumber}, Issued=${cert.issueDate}`);
    } catch (err: any) {
      console.error(` -> Failed for student ${cp.user.name}:`, err.message);
    }
  }

  // Also check all completed enrollments
  const completedEnrollments = await prisma.enrollment.findMany({
    where: { status: "COMPLETED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  for (const en of completedEnrollments) {
    try {
      const cert = await generateCertificateForUser(en.userId, en.courseId);
      console.log(` -> Certificate from Enrollment: ID=${cert.certificateNumber}`);
    } catch (err: any) {
      // Ignore if not fully completed
    }
  }

  // List all certificates in database
  const allCertificates = await prisma.certificate.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  console.log("\n=== ALL CERTIFICATES IN DATABASE ===");
  allCertificates.forEach((c) => {
    console.log(`- Recipient: ${c.user.name} (${c.user.email}) | Course: ${c.course.title} | Cert #: ${c.certificateNumber}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
