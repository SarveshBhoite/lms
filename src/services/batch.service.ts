import prisma from "@/lib/prisma";
import { LiveClassCreateInput, AttendanceMarkInput } from "@/validations/batch.schema";
import { AttendanceStatus, LiveClassStatus } from "@prisma/client";

export class BatchService {
  static async getTrainerBatches(trainerId: string) {
    return prisma.batch.findMany({
      where: {
        trainers: { some: { trainerId } },
      },
      include: {
        course: true,
        students: {
          include: {
            user: {
              include: {
                profile: true,
                courseProgresses: true,
                quizAttempts: true,
                assignmentSubmissions: true,
              },
            },
          },
        },
        liveClasses: {
          include: { attendances: true },
          orderBy: { scheduledDate: "desc" },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }

  static async getTrainerLiveClasses(trainerId: string) {
    return prisma.liveClass.findMany({
      where: { trainerId },
      include: {
        batch: {
          include: {
            course: true,
            students: { include: { user: true } },
          },
        },
        attendances: { include: { user: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });
  }

  static async scheduleLiveClass(trainerId: string, data: LiveClassCreateInput) {
    return prisma.$transaction(async (tx) => {
      const liveClass = await tx.liveClass.create({
        data: {
          batchId: data.batchId,
          trainerId,
          title: data.title,
          description: data.description,
          scheduledDate: new Date(data.scheduledDate),
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          meetUrl: data.meetUrl,
          recordingUrl: data.recordingUrl,
          status: LiveClassStatus.SCHEDULED,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "LIVE_CLASS_CREATED",
          resource: `LiveClass:${liveClass.id}`,
          details: { title: liveClass.title, batchId: liveClass.batchId },
        },
      });

      return liveClass;
    });
  }

  static async markAttendance(trainerId: string, data: AttendanceMarkInput) {
    const liveClass = await prisma.liveClass.findUnique({ where: { id: data.liveClassId } });
    if (!liveClass || liveClass.trainerId !== trainerId) throw new Error("Forbidden or Class Not Found");

    return prisma.$transaction(async (tx) => {
      const att = await tx.attendance.upsert({
        where: {
          liveClassId_userId: {
            liveClassId: data.liveClassId,
            userId: data.userId,
          },
        },
        update: {
          status: data.status as AttendanceStatus,
        },
        create: {
          liveClassId: data.liveClassId,
          userId: data.userId,
          status: data.status as AttendanceStatus,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "ATTENDANCE_UPDATED",
          resource: `Attendance:${att.id}`,
          details: { status: att.status, userId: att.userId },
        },
      });

      return att;
    });
  }
}
