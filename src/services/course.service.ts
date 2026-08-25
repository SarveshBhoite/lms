import prisma from "@/lib/prisma";
import { CourseCreateInput, CourseUpdateInput, ModuleCreateInput, LessonCreateInput } from "@/validations/course.schema";
import { CourseStatus, Role } from "@prisma/client";

export class CourseService {
  /**
   * Get all courses belonging to a specific trainer
   */
  static async getTrainerCourses(trainerId: string) {
    return prisma.course.findMany({
      where: { trainerId },
      include: {
        modules: {
          include: { lessons: true },
          orderBy: { orderIndex: "asc" },
        },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single course with ownership check
   */
  static async getTrainerCourseById(courseId: string, trainerId: string, isAdmin = false) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              include: { resources: true },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
        enrollments: {
          include: { user: { include: { profile: true } } },
        },
        quizzes: true,
        assignments: true,
        batches: true,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!isAdmin && course.trainerId !== trainerId) {
      throw new Error("Forbidden: You do not own this course");
    }

    return course;
  }

  /**
   * Create a new course container
   */
  static async createCourse(trainerId: string, data: CourseCreateInput) {
    // Generate unique slug
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: data.title,
          slug: uniqueSlug,
          description: data.description,
          thumbnailUrl: data.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
          objectives: data.objectives,
          durationHours: data.durationHours,
          level: data.level,
          prerequisites: data.prerequisites,
          trainerId,
          status: CourseStatus.PUBLISHED,
        },
      });

      // Audit log
      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "COURSE_CREATED",
          resource: `Course:${course.id}`,
          details: { title: course.title },
        },
      });

      return course;
    });
  }

  /**
   * Update course metadata
   */
  static async updateCourse(courseId: string, trainerId: string, data: CourseUpdateInput, isAdmin = false) {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) throw new Error("Course not found");
    if (!isAdmin && existing.trainerId !== trainerId) throw new Error("Forbidden");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.course.update({
        where: { id: courseId },
        data: {
          ...data,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "COURSE_UPDATED",
          resource: `Course:${courseId}`,
          details: { title: updated.title, status: updated.status },
        },
      });

      return updated;
    });
  }

  /**
   * Create a syllabus module
   */
  static async createModule(trainerId: string, data: ModuleCreateInput, isAdmin = false) {
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) throw new Error("Course not found");
    if (!isAdmin && course.trainerId !== trainerId) throw new Error("Forbidden");

    return prisma.$transaction(async (tx) => {
      const mod = await tx.courseModule.create({
        data: {
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          orderIndex: data.orderIndex,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "MODULE_CREATED",
          resource: `CourseModule:${mod.id}`,
          details: { title: mod.title, courseId: mod.courseId },
        },
      });

      return mod;
    });
  }

  /**
   * Create a lesson in a module
   */
  static async createLesson(trainerId: string, data: LessonCreateInput, isAdmin = false) {
    const mod = await prisma.courseModule.findUnique({
      where: { id: data.moduleId },
      include: { course: true },
    });
    if (!mod) throw new Error("Module not found");
    if (!isAdmin && mod.course.trainerId !== trainerId) throw new Error("Forbidden");

    return prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          moduleId: data.moduleId,
          title: data.title,
          description: data.description,
          contentType: data.contentType,
          contentUrl: data.contentUrl,
          textContent: data.textContent,
          durationMinutes: data.durationMinutes,
          orderIndex: data.orderIndex,
          isFreePreview: data.isFreePreview,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "LESSON_CREATED",
          resource: `Lesson:${lesson.id}`,
          details: { title: lesson.title, moduleId: lesson.moduleId },
        },
      });

      return lesson;
    });
  }
}
