import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentLiveClassesClient from "./StudentLiveClassesClient";

export default async function StudentLiveClassesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  // Find all batches the student is enrolled in
  const batchStudents = await prisma.batchStudent.findMany({
    where: { userId: studentId },
    select: { batchId: true },
  });
  const studentBatchIds = batchStudents.map((b) => b.batchId);

  // Fetch live classes assigned to the student's batches
  const liveClasses = await prisma.liveClass.findMany({
    where: {
      batchId: { in: studentBatchIds },
    },
    include: {
      course: { select: { id: true, title: true } },
      batch: { select: { id: true, name: true, course: { select: { title: true } } } },
      trainer: { select: { id: true, name: true, email: true } },
      attendances: {
        where: { userId: studentId },
        select: {
          id: true,
          status: true,
          isApproved: true,
          joinClickTime: true,
          excuseReason: true,
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const serialized = liveClasses.map((lc) => ({
    ...lc,
    scheduledDate: lc.scheduledDate.toISOString(),
    startTime: lc.startTime.toISOString(),
    endTime: lc.endTime.toISOString(),
    attendances: lc.attendances.map((a) => ({
      ...a,
      joinClickTime: a.joinClickTime ? a.joinClickTime.toISOString() : null,
    })),
  }));

  return <StudentLiveClassesClient initialClasses={serialized as any} />;
}
