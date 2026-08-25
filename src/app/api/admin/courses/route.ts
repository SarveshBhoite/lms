import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { CourseCreateSchema } from "@/validations/course.schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "ALL";
    const level = searchParams.get("level") || "ALL";
    const trainerId = searchParams.get("trainerId") || "";

    const whereClause: any = {};

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (level !== "ALL") {
      whereClause.level = level;
    }

    if (trainerId) {
      whereClause.trainerId = trainerId;
    }

    if (query.trim()) {
      whereClause.OR = [
        { title: { contains: query.trim(), mode: "insensitive" } },
        { description: { contains: query.trim(), mode: "insensitive" } },
      ];
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true, designation: true } },
          },
        },
        modules: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
        enrollments: { select: { id: true } },
        batches: { select: { id: true, name: true, status: true } },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            batches: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total lessons per course
    const formattedCourses = courses.map((course) => {
      const totalLessons = course.modules.reduce(
        (sum, m) => sum + (m._count?.lessons || 0),
        0
      );
      return {
        ...course,
        totalLessons,
        totalStudents: course._count.enrollments,
        totalModules: course._count.modules,
        totalBatches: course._count.batches,
      };
    });

    return NextResponse.json({ success: true, data: formattedCourses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const validatedData = CourseCreateSchema.parse(body);

    // Verify assigned trainer exists and has TRAINER role or ADMIN role
    const trainerUser = await prisma.user.findUnique({
      where: { id: validatedData.trainerId },
    });

    if (!trainerUser || (trainerUser.role !== "TRAINER" && trainerUser.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Selected user is not a valid trainer or admin." },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(validatedData.title);
    if (!baseSlug) baseSlug = "course";
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newCourse = await prisma.course.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        objectives: validatedData.objectives,
        durationHours: validatedData.durationHours,
        level: validatedData.level,
        prerequisites: validatedData.prerequisites,
        trainerId: validatedData.trainerId,
        status: validatedData.status,
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "COURSE_CREATED",
        resource: `Course:${newCourse.id}`,
        details: {
          title: newCourse.title,
          trainerId: newCourse.trainerId,
          status: newCourse.status,
        },
      },
    });

    return NextResponse.json({ success: true, data: newCourse }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
