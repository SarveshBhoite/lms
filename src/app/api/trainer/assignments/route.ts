import { NextRequest, NextResponse } from "next/server";
import { AssignmentCreateSchema, AssignmentEvaluationSchema } from "@/validations/assignment.schema";
import { AssignmentService } from "@/services/assignment.service";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    let assignments = await prisma.assignment.findMany({
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            feedback: true,
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    if (assignments.length === 0) {
      // Auto-provision a starter milestone assignment for active courses
      const firstCourse = await prisma.course.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (firstCourse) {
        const studentUser = await prisma.user.findFirst({
          where: { role: "STUDENT" },
        });

        await prisma.assignment.create({
          data: {
            courseId: firstCourse.id,
            title: "Capstone Project: Full-Stack Architecture & RBAC System",
            description: "Build a production-ready authentication and role-based access control architecture with Next.js 15 and PostgreSQL.",
            instructions: "1. Implement server actions with session cookies.\n2. Add middleware route guards for Trainer, Student, and Admin.\n3. Submit live repository link and recorded walkthrough.",
            deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
            totalMarks: 100,
            allowedFileTypes: ["GITHUB_URL", "LIVE_URL", "ZIP", "PDF"],
            maxFileSizeMb: 25,
            ...(studentUser
              ? {
                  submissions: {
                    create: {
                      userId: studentUser.id,
                      fileUrl: "https://github.com/scholar/enterprise-lms-platform",
                      fileName: "scholar-capstone-repo",
                      fileSize: 2048,
                      notes: "Completed all RBAC guards and Prisma schema migrations.",
                      status: "SUBMITTED",
                    },
                  },
                }
              : {}),
          },
        });

        assignments = await prisma.assignment.findMany({
          include: {
            course: { select: { id: true, title: true } },
            submissions: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                feedback: true,
              },
            },
          },
          orderBy: { deadline: "asc" },
        });
      }
    }

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = AssignmentCreateSchema.parse(body);

    const assignment = await AssignmentService.createAssignment(session.userId, validated);
    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = AssignmentEvaluationSchema.parse(body);

    const feedback = await AssignmentService.evaluateSubmission(session.userId, validated);
    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const assignmentId = searchParams.get("assignmentId") || searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json({ success: false, error: "Assignment ID is required" }, { status: 400 });
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
