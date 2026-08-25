import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { CreateStudentSchema } from "@/validations/student.schema";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "ALL"; // ALL, ACTIVE, INACTIVE
    const courseId = searchParams.get("courseId") || "";
    const batchId = searchParams.get("batchId") || "";

    const whereClause: any = {
      role: "STUDENT",
    };

    if (status === "ACTIVE") {
      whereClause.isActive = true;
    } else if (status === "INACTIVE") {
      whereClause.isActive = false;
    }

    if (query.trim()) {
      whereClause.OR = [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { email: { contains: query.trim(), mode: "insensitive" } },
        { profile: { phone: { contains: query.trim(), mode: "insensitive" } } },
      ];
    }

    if (courseId) {
      whereClause.enrollments = {
        some: { courseId },
      };
    }

    if (batchId) {
      whereClause.studentBatches = {
        some: { batchId },
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
          orderBy: { enrolledAt: "desc" },
        },
        studentBatches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
        courseProgresses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const validatedData = CreateStudentSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    const defaultAvatar = validatedData.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validatedData.name)}`;

    const newStudent = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        passwordHash,
        role: "STUDENT",
        isEmailVerified: true,
        isActive: validatedData.isActive ?? true,
        profile: {
          create: {
            phone: validatedData.phone || null,
            avatarUrl: defaultAvatar,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Create initial course enrollment and batch assignment if specified
    if (validatedData.courseId) {
      await prisma.enrollment.create({
        data: {
          userId: newStudent.id,
          courseId: validatedData.courseId,
          batchId: validatedData.batchId || null,
          status: "ACTIVE",
        },
      });
    }

    if (validatedData.batchId) {
      await prisma.batchStudent.create({
        data: {
          userId: newStudent.id,
          batchId: validatedData.batchId,
        },
      });
    }

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "STUDENT_CREATED",
        resource: `User:${newStudent.id}`,
        details: {
          studentName: newStudent.name,
          studentEmail: newStudent.email,
          assignedCourseId: validatedData.courseId || null,
          assignedBatchId: validatedData.batchId || null,
        },
      },
    });

    return NextResponse.json({ success: true, data: newStudent }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
