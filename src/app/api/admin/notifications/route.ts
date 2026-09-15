import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createBulkUserNotifications } from "@/lib/notifications";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { z } from "zod";

const BroadcastSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  targetRole: z.enum(["ALL", "STUDENT", "TRAINER"]),
  type: z.enum([
    "ADMIN_ANNOUNCEMENT",
    "COURSE_ANNOUNCEMENT",
    "SYSTEM_ALERT",
    "LIVE_CLASS_REMINDER",
  ]).default("ADMIN_ANNOUNCEMENT"),
  actionUrl: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 10;
    const query = searchParams.get("query")?.trim() || "";
    const roleFilter = searchParams.get("role") || "ALL"; // ALL, STUDENT, TRAINER
    const typeFilter = searchParams.get("type") || "ALL"; // ALL or specific NotificationType

    const where: any = {};

    // Filter by role of recipient
    if (roleFilter !== "ALL") {
      where.user = { role: roleFilter };
    }

    // Filter by notification type
    if (typeFilter !== "ALL") {
      where.type = typeFilter;
    }

    // Filter by search query on title, message, or user name/email
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { message: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [totalCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const validated = BroadcastSchema.parse(body);

    // Find recipients based on target role
    const recipientWhere: any = { isActive: true };
    if (validated.targetRole !== "ALL") {
      recipientWhere.role = validated.targetRole;
    }

    const targetUsers = await prisma.user.findMany({
      where: recipientWhere,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active users found for selected target" },
        { status: 400 }
      );
    }

    // Create notifications for all matching users in bulk AND push to mobile devices
    await createBulkUserNotifications({
      userIds: targetUsers.map((u) => u.id),
      title: validated.title,
      message: validated.message,
      type: validated.type as any,
      actionUrl: validated.actionUrl || null,
    });

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "BROADCAST_SENT",
        resource: `Broadcast:${validated.targetRole}`,
        details: {
          title: validated.title,
          targetRole: validated.targetRole,
          recipientsCount: targetUsers.length,
          type: validated.type,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully dispatched to ${targetUsers.length} users`,
      recipientsCount: targetUsers.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
