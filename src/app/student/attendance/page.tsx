import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentAttendanceClient from "./StudentAttendanceClient";

export default async function StudentAttendancePage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const attendances = await prisma.attendance.findMany({
    where: { userId: studentId },
    include: {
      liveClass: {
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          startTime: true,
          batch: { select: { name: true, course: { select: { title: true } } } },
        },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  const validEvaluated = attendances.filter((a) => a.status !== "EXCUSED");
  const totalEvaluated = validEvaluated.length;
  const presentCount = validEvaluated.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendancePercent = totalEvaluated > 0 ? (presentCount / totalEvaluated) * 100 : 100;

  const serialized = attendances.map((att) => ({
    id: att.id,
    status: att.status,
    isApproved: att.isApproved,
    joinClickTime: att.joinClickTime ? att.joinClickTime.toISOString() : null,
    excuseReason: att.excuseReason,
    recordedAt: att.recordedAt.toISOString(),
    liveClass: {
      id: att.liveClass.id,
      title: att.liveClass.title,
      scheduledDate: att.liveClass.scheduledDate.toISOString(),
      startTime: att.liveClass.startTime.toISOString(),
      batch: att.liveClass.batch,
    },
  }));

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <StudentAttendanceClient
        initialAttendances={serialized as any}
        attendancePercent={attendancePercent}
      />
    </div>
  );
}

