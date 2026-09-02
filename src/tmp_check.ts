import "dotenv/config";
import prisma from "./lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      enrollments: {
        select: {
          id: true,
          courseId: true,
          course: { select: { title: true } },
          status: true,
        },
      },
      courseProgresses: {
        select: {
          courseId: true,
          completedLessonsCount: true,
          totalLessonsCount: true,
          isCompleted: true,
        },
      },
      certificates: {
        select: {
          id: true,
          certificateNumber: true,
          courseId: true,
          issueDate: true,
          metadata: true,
        },
      },
    },
  });

  console.log("=== ALL USERS & CERTIFICATES ===");
  for (const user of users) {
    console.log(`User: ${user.name} (${user.email}) - Role: ${user.role}`);
    console.log(`  Enrollments (${user.enrollments.length}):`);
    user.enrollments.forEach((e) => console.log(`    - Course: ${e.course.title} | Status: ${e.status}`));
    console.log(`  Course Progresses (${user.courseProgresses.length}):`);
    user.courseProgresses.forEach((cp) =>
      console.log(`    - CourseId: ${cp.courseId} | Completed: ${cp.completedLessonsCount}/${cp.totalLessonsCount} | isCompleted: ${cp.isCompleted}`)
    );
    console.log(`  Certificates (${user.certificates.length}):`);
    user.certificates.forEach((c) =>
      console.log(`    - Cert #: ${c.certificateNumber} | Issued: ${c.issueDate}`)
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
