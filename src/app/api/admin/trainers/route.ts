import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { CreateTrainerSchema } from "@/validations/trainer.schema";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "ALL";

    const whereClause: any = {
      role: "TRAINER",
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
        { profile: { designation: { contains: query.trim(), mode: "insensitive" } } },
      ];
    }

    const trainers = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        coursesCreated: {
          select: { id: true, title: true, status: true, _count: { select: { enrollments: true } } },
        },
        trainerBatches: {
          include: {
            batch: { select: { id: true, name: true, status: true, _count: { select: { students: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total unique students per trainer
    const formattedTrainers = trainers.map((tr) => {
      const courseStudents = tr.coursesCreated.reduce((acc, c) => acc + c._count.enrollments, 0);
      const batchStudents = tr.trainerBatches.reduce((acc, tb) => acc + tb.batch._count.students, 0);
      return {
        ...tr,
        totalStudentsCount: courseStudents + batchStudents,
      };
    });

    return NextResponse.json({ success: true, data: formattedTrainers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const validatedData = CreateTrainerSchema.parse(body);

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

    const newTrainer = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        passwordHash,
        role: "TRAINER",
        isEmailVerified: true,
        isActive: validatedData.isActive ?? true,
        profile: {
          create: {
            phone: validatedData.phone || null,
            avatarUrl: defaultAvatar,
            designation: validatedData.designation || "Faculty Trainer",
            bio: validatedData.bio || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Assign multiple courses to trainer
    if (validatedData.courseIds && validatedData.courseIds.length > 0) {
      await prisma.course.updateMany({
        where: { id: { in: validatedData.courseIds } },
        data: { trainerId: newTrainer.id },
      });
    }

    // Assign multiple batches to trainer
    if (validatedData.batchIds && validatedData.batchIds.length > 0) {
      const batchData = validatedData.batchIds.map((batchId) => ({
        batchId,
        trainerId: newTrainer.id,
      }));
      await prisma.batchTrainer.createMany({
        data: batchData,
        skipDuplicates: true,
      });
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "TRAINER_CREATED",
        resource: `User:${newTrainer.id}`,
        details: {
          trainerName: newTrainer.name,
          trainerEmail: newTrainer.email,
          assignedCoursesCount: validatedData.courseIds?.length || 0,
          assignedBatchesCount: validatedData.batchIds?.length || 0,
        },
      },
    });

    return NextResponse.json({ success: true, data: newTrainer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
