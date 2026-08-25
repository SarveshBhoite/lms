import prisma from "@/lib/prisma";

export class ReportService {
  static async getTrainerPerformanceSummary(trainerId: string) {
    const courses = await prisma.course.findMany({
      where: { trainerId },
      include: {
        enrollments: {
          include: {
            user: {
              include: {
                profile: true,
                courseProgresses: true,
                quizAttempts: true,
                assignmentSubmissions: true,
              },
            },
          },
        },
        quizzes: {
          include: { quizAttempts: true },
        },
        assignments: {
          include: { submissions: true },
        },
      },
    });

    return {
      totalCourses: courses.length,
      courses,
    };
  }
}
