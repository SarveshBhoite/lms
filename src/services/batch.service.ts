import prisma from "@/lib/prisma";
import { LiveClassCreateInput, AttendanceMarkInput } from "@/validations/batch.schema";
import { AttendanceStatus, LiveClassStatus } from "@prisma/client";

export class BatchService {
  static async getTrainerBatches(trainerId?: string) {
    return prisma.batch.findMany({
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

  static async getTrainerLiveClasses(trainerId?: string) {
    return prisma.liveClass.findMany({
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
    const scheduledDateObj = new Date(data.scheduledDate);
    const startTimeObj = data.startTime ? new Date(data.startTime) : scheduledDateObj;
    const endTimeObj = data.endTime
      ? new Date(data.endTime)
      : new Date(scheduledDateObj.getTime() + 60 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const liveClass = await tx.liveClass.create({
        data: {
          batchId: data.batchId,
          trainerId,
          title: data.title,
          description: data.description,
          scheduledDate: scheduledDateObj,
          startTime: startTimeObj,
          endTime: endTimeObj,
          meetUrl: data.meetUrl,
          recordingUrl: data.recordingUrl || null,
          status: LiveClassStatus.SCHEDULED,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "LIVE_CLASS_CREATED",
          resource: `LiveClass:${liveClass.id}`,
          details: { title: liveClass.title, scheduledDate: liveClass.scheduledDate },
        },
      });

      return liveClass;
    });
  }

  static async markAttendance(trainerId: string, data: AttendanceMarkInput) {
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
          action: "ATTENDANCE_MARKED",
          resource: `Attendance:${att.id}`,
          details: { status: att.status },
        },
      });

      return att;
    });
  }
}
