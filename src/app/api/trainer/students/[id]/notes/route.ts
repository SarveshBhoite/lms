import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id: studentId } = await params;
    const isAdmin = session.role === "ADMIN";
    const trainerId = session.userId;

    if (!isAdmin) {
      const scopeCheck = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: "STUDENT",
          OR: [
            {
              enrollments: {
                some: {
                  course: {
                    OR: [
                      { trainerId },
                      { batches: { some: { trainers: { some: { trainerId } } } } },
                    ],
                  },
                },
              },
            },
            {
              studentBatches: {
                some: {
                  batch: {
                    OR: [
                      { course: { trainerId } },
                      { trainers: { some: { trainerId } } },
                    ],
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!scopeCheck) {
        throw new AuthError("Forbidden: Cannot view notes for this student", 403);
      }
    }

    const notes = await prisma.trainerNote.findMany({
      where: { studentId },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id: studentId } = await params;
    const isAdmin = session.role === "ADMIN";
    const trainerId = session.userId;

    if (!isAdmin) {
      const scopeCheck = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: "STUDENT",
          OR: [
            {
              enrollments: {
                some: {
                  course: {
                    OR: [
                      { trainerId },
                      { batches: { some: { trainers: { some: { trainerId } } } } },
                    ],
                  },
                },
              },
            },
            {
              studentBatches: {
                some: {
                  batch: {
                    OR: [
                      { course: { trainerId } },
                      { trainers: { some: { trainerId } } },
                    ],
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!scopeCheck) {
        throw new AuthError("Forbidden: Cannot add notes for this student", 403);
      }
    }

    const { content } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new Error("Note content is required");
    }

    const note = await prisma.trainerNote.create({
      data: {
        studentId,
        trainerId: session.userId,
        content: content.trim(),
      },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return handleApiError(error);
  }
}
