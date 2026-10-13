import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  details?: Prisma.InputJsonValue,
  client: any = prisma
) {
  try {
    let validUserId = userId;
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      const fallback = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'TRAINER', 'STUDENT'] } },
        select: { id: true },
      });
      if (fallback) {
        validUserId = fallback.id;
      } else {
        return;
      }
    }

    await client.activityLog.create({
      data: {
        userId: validUserId,
        action,
        resource,
        details: details || {},
      },
    });
  } catch (err) {
    console.warn('Safe ActivityLog skipped error:', err);
  }
}