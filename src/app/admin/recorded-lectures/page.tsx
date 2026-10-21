import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminRecordedLecturesClient, {
  AdminRecordedLecture,
} from "./AdminRecordedLecturesClient";

export default async function AdminRecordedLecturesPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const [courses, batches, trainers, liveRecordings, videoResources, googleAccount, googleDriveAccount] =
    await Promise.all([
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          trainerId: true,
          batches: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { title: "asc" },
      }),
      prisma.batch.findMany({
        select: {
          id: true,
          name: true,
          courseId: true,
          course: { select: { id: true, title: true } },
          status: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { role: { in: ["TRAINER", "ADMIN"] }, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: { select: { avatarUrl: true, designation: true } },
        },
        orderBy: { name: "asc" },
      }),
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
              profile: { select: { avatarUrl: true, designation: true } },
            },
          },
        },
        orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.resource.findMany({
        where: {
          OR: [
            { fileType: "VIDEO" },
            { fileUrl: { contains: ".mp4" } },
            { fileUrl: { contains: "cloudinary" } },
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
                  profile: { select: { avatarUrl: true, designation: true } },
                },
              },
            },
          },
          batch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.trainerGoogleAccount.findUnique({
        where: { userId: session.userId },
        select: { email: true },
      }),
      prisma.adminGoogleDriveAccount.findUnique({
        where: { userId: session.userId },
        select: { email: true, rootFolderId: true, rootFolderName: true },
      }),
    ]);

  const formattedLiveRecordings: AdminRecordedLecture[] = liveRecordings.map(
    (lc) => ({
      id: lc.id,
      sourceType: "LIVE_CLASS",
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
        designation: lc.trainer.profile?.designation,
      },
      createdAt: lc.createdAt.toISOString(),
    })
  );

  const formattedVideoResources: AdminRecordedLecture[] = videoResources.map(
    (res) => ({
      id: res.id,
      sourceType: "RESOURCE",
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
            designation: res.course.trainer.profile?.designation,
          }
        : null,
      createdAt: res.createdAt.toISOString(),
    })
  );

  const seenUrls = new Set<string>();
  const combinedRecordings = [
    ...formattedLiveRecordings,
    ...formattedVideoResources,
  ].filter((item) => {
    if (seenUrls.has(item.videoUrl)) return false;
    seenUrls.add(item.videoUrl);
    return true;
  });

  return (
    <AdminRecordedLecturesClient
      initialRecordings={combinedRecordings}
      courses={courses}
      batches={batches}
      trainers={trainers}
      currentUserId={session.userId}
      initialGoogleStatus={{
        isConnected: Boolean(googleAccount),
        email: googleAccount?.email || null,
      }}
      initialDriveStatus={{
        isConnected: Boolean(googleDriveAccount),
        email: googleDriveAccount?.email || null,
        rootFolderId: googleDriveAccount?.rootFolderId || null,
        rootFolderName: googleDriveAccount?.rootFolderName || null,
      }}
    />
  );
}
