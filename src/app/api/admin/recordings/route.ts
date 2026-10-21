import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { createBulkUserNotifications } from "@/lib/notifications";

export async function GET() {
  try {
    await requireTrainerOrAdmin();

    const [liveRecordings, videoResources] = await Promise.all([
      prisma.liveClass.findMany({
        where: {
          recordingUrl: { not: null },
          NOT: { recordingUrl: "" },
        },
        include: {
          course: { select: { id: true, title: true, slug: true } },
          batch: { select: { id: true, name: true } },
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
        orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.resource.findMany({
        where: {
          OR: [
            { fileType: "VIDEO" },
            { fileType: { contains: "video" } },
            { fileUrl: { contains: ".mp4" } },
            { fileUrl: { contains: ".mkv" } },
            { fileUrl: { contains: ".webm" } },
            { fileUrl: { contains: "/video/upload/" } },
          ],
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              trainer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: { select: { avatarUrl: true } },
                },
              },
            },
          },
          batch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedLiveRecordings = liveRecordings.map((lc) => ({
      id: lc.id,
      sourceType: "LIVE_CLASS" as const,
      title: lc.title,
      description: lc.description,
      videoUrl: lc.recordingUrl!,
      recordedDate: lc.scheduledDate.toISOString(),
      course: lc.course,
      batch: lc.batch,
      trainer: {
        id: lc.trainer.id,
        name: lc.trainer.name,
        email: lc.trainer.email,
        avatarUrl: lc.trainer.profile?.avatarUrl,
      },
      createdAt: lc.createdAt.toISOString(),
    }));

    const formattedVideoResources = videoResources.map((res) => ({
      id: res.id,
      sourceType: "RESOURCE" as const,
      title: res.title,
      description: null,
      videoUrl: res.fileUrl,
      recordedDate: res.createdAt.toISOString(),
      course: res.course
        ? { id: res.course.id, title: res.course.title, slug: res.course.id }
        : null,
      batch: res.batch,
      trainer: res.course?.trainer
        ? {
            id: res.course.trainer.id,
            name: res.course.trainer.name,
            email: res.course.trainer.email,
            avatarUrl: res.course.trainer.profile?.avatarUrl,
          }
        : null,
      createdAt: res.createdAt.toISOString(),
    }));

    // Merge and deduplicate by videoUrl
    const seenUrls = new Set<string>();
    const combined = [...formattedLiveRecordings, ...formattedVideoResources].filter((item) => {
      if (seenUrls.has(item.videoUrl)) return false;
      seenUrls.add(item.videoUrl);
      return true;
    });

    return NextResponse.json({ success: true, data: combined });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();

    const {
      title,
      description,
      videoUrl,
      courseId,
      batchId,
      trainerId,
      recordedDate,
      durationMinutes = 60,
      notifyStudents = true,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Lecture title must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (!videoUrl || typeof videoUrl !== "string" || videoUrl.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Valid video file URL or stream link is required" },
        { status: 400 }
      );
    }

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "Please select an assigned batch cohort" },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Selected cohort batch does not exist" },
        { status: 404 }
      );
    }

    // Resolve assigned trainer
    let resolvedTrainerId = trainerId;
    if (!resolvedTrainerId) {
      resolvedTrainerId = batch.course?.trainerId || session.userId;
    }

    // Verify trainer exists
    const trainerUser = await prisma.user.findUnique({
      where: { id: resolvedTrainerId },
      select: { id: true, name: true, email: true },
    });

    if (!trainerUser) {
      resolvedTrainerId = session.userId;
    }

    const lectureDate = recordedDate ? new Date(recordedDate) : new Date();
    const endLectureTime = new Date(lectureDate.getTime() + (durationMinutes || 60) * 60000);

    const newRecord = await prisma.liveClass.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        batchId: batch.id,
        courseId: courseId || batch.courseId,
        trainerId: resolvedTrainerId,
        scheduledDate: lectureDate,
        startTime: lectureDate,
        endTime: endLectureTime,
        meetUrl: videoUrl.trim(),
        recordingUrl: videoUrl.trim(),
        status: "COMPLETED",
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        batch: { select: { id: true, name: true } },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    // Notify enrolled students in this batch
    if (notifyStudents) {
      const batchStudents = await prisma.batchStudent.findMany({
        where: { batchId: batch.id },
        select: { userId: true },
      });

      const userIds = batchStudents.map((bs) => bs.userId);
      if (userIds.length > 0) {
        await createBulkUserNotifications({
          userIds,
          title: `New Recorded Lecture: ${newRecord.title}`,
          message: `Faculty uploaded a recorded lecture for ${batch.name}. Watch now on your Recorded Lectures portal.`,
          type: "COURSE_ANNOUNCEMENT",
          actionUrl: "/student/recorded-lectures",
        });
      }
    }

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "RECORDED_LECTURE_UPLOADED",
        resource: `LiveClass:${newRecord.id}`,
        details: {
          title: newRecord.title,
          batchId: batch.id,
          batchName: batch.name,
          courseId: newRecord.courseId,
          recordingUrl: newRecord.recordingUrl,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Recorded lecture published successfully",
        data: {
          id: newRecord.id,
          sourceType: "LIVE_CLASS" as const,
          title: newRecord.title,
          description: newRecord.description,
          videoUrl: newRecord.recordingUrl!,
          recordedDate: newRecord.scheduledDate.toISOString(),
          course: newRecord.course,
          batch: newRecord.batch,
          trainer: {
            id: newRecord.trainer.id,
            name: newRecord.trainer.name,
            email: newRecord.trainer.email,
            avatarUrl: newRecord.trainer.profile?.avatarUrl,
          },
          createdAt: newRecord.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
