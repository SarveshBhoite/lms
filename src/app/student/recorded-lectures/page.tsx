import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentRecordedLecturesClient, {
  StudentRecordedLecture,
} from "./StudentRecordedLecturesClient";

export default async function StudentRecordedLecturesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  // Retrieve student's enrolled courses and batches
  const [batchStudents, enrollments] = await Promise.all([
    prisma.batchStudent.findMany({
      where: { userId: studentId },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            courseId: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  const enrolledBatchIds = Array.from(
    new Set([
      ...batchStudents.map((b) => b.batchId),
      ...enrollments.map((e) => e.batchId).filter(Boolean) as string[],
    ])
  );

  // If student has no enrollments yet, render empty state cleanly
  if (enrolledCourseIds.length === 0 && enrolledBatchIds.length === 0) {
    return (
      <StudentRecordedLecturesClient
        initialRecordings={[]}
        courses={[]}
        batches={[]}
      />
    );
  }

  // Fetch recorded lectures attached to these batches or courses
  const [liveRecordings, videoResources] = await Promise.all([
    prisma.liveClass.findMany({
      where: {
        AND: [
          { recordingUrl: { not: null } },
          { NOT: { recordingUrl: "" } },
          {
            OR: [
              ...(enrolledBatchIds.length > 0
                ? [
                    { batchId: { in: enrolledBatchIds } },
                    { batchIds: { hasSome: enrolledBatchIds } },
                  ]
                : []),
              ...(enrolledCourseIds.length > 0
                ? [{ courseId: { in: enrolledCourseIds } }]
                : []),
            ],
          },
        ],
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
        AND: [
          {
            OR: [
              { fileType: "VIDEO" },
              { fileUrl: { contains: ".mp4" } },
              { fileUrl: { contains: "cloudinary" } },
            ],
          },
          {
            OR: [
              ...(enrolledBatchIds.length > 0
                ? [{ batchId: { in: enrolledBatchIds } }]
                : []),
              ...(enrolledCourseIds.length > 0
                ? [{ courseId: { in: enrolledCourseIds } }]
                : []),
            ],
          },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
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
  ]);

  const serializedLiveRecordings: StudentRecordedLecture[] = liveRecordings.map(
    (lc) => ({
      id: lc.id,
      sourceType: "LIVE_CLASS",
      title: lc.title,
      description: lc.description,
      videoUrl: lc.recordingUrl!,
      recordedDate: lc.scheduledDate.toISOString(),
      durationMinutes: Math.round(
        (new Date(lc.endTime).getTime() - new Date(lc.startTime).getTime()) /
          60000
      ) || 60,
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

  const serializedVideoResources: StudentRecordedLecture[] = videoResources.map(
    (res) => ({
      id: res.id,
      sourceType: "RESOURCE",
      title: res.title,
      description: null,
      videoUrl: res.fileUrl,
      recordedDate: res.createdAt.toISOString(),
      durationMinutes: null,
      course: res.course
        ? { id: res.course.id, title: res.course.title, slug: res.course.slug }
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

  // Merge and deduplicate by videoUrl
  const seenUrls = new Set<string>();
  const combinedRecordings = [
    ...serializedLiveRecordings,
    ...serializedVideoResources,
  ].filter((item) => {
    if (seenUrls.has(item.videoUrl)) return false;
    seenUrls.add(item.videoUrl);
    return true;
  });

  const availableCourses = enrollments.map((e) => ({
    id: e.course.id,
    title: e.course.title,
  }));

  const availableBatches = batchStudents
    .filter((b) => b.batch)
    .map((b) => ({
      id: b.batch.id,
      name: b.batch.name,
    }));

  return (
    <StudentRecordedLecturesClient
      initialRecordings={combinedRecordings}
      courses={availableCourses}
      batches={availableBatches}
    />
  );
}
