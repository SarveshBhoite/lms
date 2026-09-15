import prisma from "./prisma";
import { sendPushToUser, sendPushToUsers } from "./push";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string | null;
}

interface CreateBulkNotificationParams {
  userIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string | null;
}

/**
 * Creates a notification in database AND dispatches native Web Push notification to user's devices
 */
export async function createUserNotification(params: CreateNotificationParams) {
  const { userId, title, message, type = "SYSTEM_ALERT", actionUrl } = params;

  // 1. Save to DB
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      actionUrl: actionUrl || null,
    },
  });

  // 2. Dispatch push notification asynchronously (non-blocking)
  sendPushToUser(userId, {
    title,
    message,
    actionUrl: actionUrl || "/notifications",
  }).catch((err) => {
    console.error("Background push notification failed:", err);
  });

  return notification;
}

/**
 * Creates notifications for multiple users in bulk AND dispatches Web Push notifications
 */
export async function createBulkUserNotifications(params: CreateBulkNotificationParams) {
  const { userIds, title, message, type = "SYSTEM_ALERT", actionUrl } = params;
  if (!userIds || userIds.length === 0) return;

  const uniqueUserIds = Array.from(new Set(userIds));

  // 1. Save to DB
  await prisma.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      actionUrl: actionUrl || null,
    })),
  });

  // 2. Dispatch push notifications asynchronously
  sendPushToUsers(uniqueUserIds, {
    title,
    message,
    actionUrl: actionUrl || "/notifications",
  }).catch((err) => {
    console.error("Background bulk push notification failed:", err);
  });
}
