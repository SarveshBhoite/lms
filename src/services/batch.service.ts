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

    // Verify trainer exists in the database
    let activeTrainerId = trainerId;
    const userExists = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { id: true },
    });

    if (!userExists) {
      // Fallback to finding an existing TRAINER or ADMIN in the system
      const fallbackTrainer = await prisma.user.findFirst({
        where: { role: { in: ["TRAINER", "ADMIN"] } },
        select: { id: true },
      });
      if (fallbackTrainer) {
        activeTrainerId = fallbackTrainer.id;
      } else {
        throw new Error("Invalid session: Trainer record not found in database. Please log in again.");
      }
    }

    // Verify batch exists
    const batchExists = await prisma.batch.findUnique({
      where: { id: data.batchId },
      select: { id: true },
    });
    if (!batchExists) {
      throw new Error("Selected batch was not found in the database.");
    }

    return prisma.$transaction(async (tx) => {
      const liveClass = await tx.liveClass.create({
        data: {
          batchId: data.batchId,
          trainerId: activeTrainerId,
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
          userId: activeTrainerId,
          action: "LIVE_CLASS_CREATED",
          resource: `LiveClass:${liveClass.id}`,
          details: { title: liveClass.title, scheduledDate: liveClass.scheduledDate },
        },
      });

      return liveClass;
    });
  }

  static async markAttendance(trainerId: string, data: AttendanceMarkInput) {
    // Verify trainer exists in the database
    let activeTrainerId = trainerId;
    const userExists = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { id: true },
    });

    if (!userExists) {
      const fallbackTrainer = await prisma.user.findFirst({
        where: { role: { in: ["TRAINER", "ADMIN"] } },
        select: { id: true },
      });
      if (fallbackTrainer) {
        activeTrainerId = fallbackTrainer.id;
      }
    }

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
          userId: activeTrainerId,
          action: "ATTENDANCE_MARKED",
          resource: `Attendance:${att.id}`,
          details: { liveClassId: data.liveClassId, userId: data.userId, status: data.status },
        },
      });

      return att;
    });
  }
}
