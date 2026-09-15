import webpush from "web-push";
import prisma from "./prisma";

// Configure web-push with VAPID keys
const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BAQKLf2LmNPLSN6ooP3v1nTBWY_nD7s7w15CdA8RZfX4mZcjHt58_Rx92oQHzDG2lApwBwfpEIajob1RudSHGT4";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "54GhbRPveyAMQ2ujR1-E1BRdp3JjV7LjA3Y0af9zVmI";
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:jmgrouponline@gmail.com";

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.error("Failed to initialize web-push VAPID details:", err);
}

export interface PushPayload {
  title: string;
  message: string;
  actionUrl?: string | null;
  tag?: string;
  icon?: string;
}

/**
 * Send push notification to all active devices of a single user
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions.length) {
      return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl || "/notifications",
      tag: payload.tag || `jvm-${Date.now()}`,
      icon: payload.icon || "/logo.png",
      badge: "/logo.png",
    });

    const expiredEndpoints: string[] = [];
    let sentCount = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload);
          sentCount++;
        } catch (error: any) {
          // If status code is 404 or 410, subscription is expired or unsubscribed
          if (error.statusCode === 404 || error.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          } else {
            console.error(
              `Push failed for endpoint ${sub.endpoint.slice(0, 30)}...:`,
              error.message || error
            );
          }
        }
      })
    );

    // Clean up expired subscriptions automatically
    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: { in: expiredEndpoints },
        },
      });
    }

    return { sent: sentCount, failed: expiredEndpoints.length };
  } catch (error) {
    console.error("sendPushToUser general error:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send push notification to multiple users simultaneously
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!userIds || userIds.length === 0) return;
  // Deduplicate user IDs
  const uniqueUserIds = Array.from(new Set(userIds));

  // Run in chunks to prevent connection saturation
  const CHUNK_SIZE = 25;
  for (let i = 0; i < uniqueUserIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueUserIds.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map((uid) => sendPushToUser(uid, payload)));
  }
}
