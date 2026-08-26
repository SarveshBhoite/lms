import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { title, message, batchId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required." },
        { status: 400 }
      );
    }

    // If batchId is provided, broadcast notification to all students in that batch
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { students: true },
      });

      if (batch && batch.students.length > 0) {
        await prisma.notification.createMany({
          data: batch.students.map((st) => ({
            userId: st.userId,
            title: `[${batch.name}] ${title}`,
            message,
            type: "COURSE_ANNOUNCEMENT",
          })),
        });
      }
    }

    // Always create a copy for the trainer/sender
    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: batchId ? `[Broadcast Sent] ${title}` : title,
        message,
        type: "COURSE_ANNOUNCEMENT",
      },
    });

    return NextResponse.json({ success: true, message: "Broadcast sent successfully." }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true, message: "Notifications marked as read." });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const notifId = searchParams.get("notificationId") || searchParams.get("id");

    if (notifId) {
      await prisma.notification.delete({
        where: { id: notifId },
      });
    } else {
      // Clear all for current user
      await prisma.notification.deleteMany({
        where: { userId: session.userId },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notification(s) deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
