import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminAttendanceClient from "./AdminAttendanceClient";

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const [students, courses, batches, attendances] = await Promise.all([
    // All Students with their profiles, enrollments, batch associations, and full attendance logs
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: {
          select: {
            avatarUrl: true,
            phone: true,
            designation: true,
          },
        },
        studentBatches: {
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
        attendances: {
          orderBy: { recordedAt: "desc" },
          include: {
            liveClass: {
              select: {
                id: true,
                title: true,
                scheduledDate: true,
                startTime: true,
                endTime: true,
                trainer: { select: { id: true, name: true } },
                batch: {
                  select: {
                    id: true,
                    name: true,
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, courseId: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  // Platform-wide Attendance Stats
  const totalAuditedChecks = attendances.length;
  const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a) => a.status === "LATE").length;
  const excusedCount = attendances.filter((a) => a.status === "EXCUSED").length;
  const platformRate = totalAuditedChecks > 0 ? ((presentCount + lateCount) / totalAuditedChecks) * 100 : 0;

  // Serialize students and date fields for Client Component
  const serializedStudents = students.map((st) => {
    const totalStudentSessions = st.attendances.length;
    const studentPresent = st.attendances.filter((a) => a.status === "PRESENT").length;
    const studentLate = st.attendances.filter((a) => a.status === "LATE").length;
    const studentAbsent = st.attendances.filter((a) => a.status === "ABSENT").length;
    const studentExcused = st.attendances.filter((a) => a.status === "EXCUSED").length;
    const studentRate = totalStudentSessions > 0 ? Math.round(((studentPresent + studentLate) / totalStudentSessions) * 100) : 0;

    return {
      id: st.id,
      name: st.name,
      email: st.email,
      isActive: st.isActive,
      profile: st.profile,
      studentBatches: st.studentBatches.map((sb) => ({
        batchId: sb.batch.id,
        batchName: sb.batch.name,
        courseTitle: sb.batch.course.title,
      })),
      enrollments: st.enrollments.map((e) => ({
        courseId: e.course.id,
        courseTitle: e.course.title,
        batchName: e.batch?.name || null,
      })),
      attendances: st.attendances.map((att) => ({
        id: att.id,
        status: att.status,
        recordedAt: att.recordedAt.toISOString(),
        joinClickTime: att.joinClickTime ? att.joinClickTime.toISOString() : null,
        leftTime: att.leftTime ? att.leftTime.toISOString() : null,
        excuseReason: att.excuseReason,
        liveClass: {
          id: att.liveClass.id,
          title: att.liveClass.title,
          scheduledDate: att.liveClass.scheduledDate.toISOString(),
          startTime: att.liveClass.startTime.toISOString(),
          endTime: att.liveClass.endTime.toISOString(),
          trainerName: att.liveClass.trainer.name,
          batchName: att.liveClass.batch.name,
          courseTitle: att.liveClass.batch.course.title,
        },
      })),
      stats: {
        totalSessions: totalStudentSessions,
        presentCount: studentPresent,
        lateCount: studentLate,
        absentCount: studentAbsent,
        excusedCount: studentExcused,
        rate: studentRate,
      },
    };
  });

  return (
    <AdminAttendanceClient
      initialStudents={serializedStudents as any}
      courses={courses}
      batches={batches}
      platformStats={{
        totalStudents: students.length,
        totalAuditedChecks,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        platformRate,
      }}
    />
  );
}
