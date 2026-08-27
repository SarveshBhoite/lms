import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminAttendanceClient from "./AdminAttendanceClient";

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const [attendances, batches] = await Promise.all([
    prisma.attendance.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        liveClass: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            trainer: { select: { name: true } },
            batch: { select: { id: true, name: true, course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalRecords = attendances.length;
  const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a) => a.status === "LATE").length;
  const excusedCount = attendances.filter((a) => a.status === "EXCUSED").length;

  const overallRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

  const initialData = {
    attendances: attendances as any,
    stats: {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      overallRate,
    },
  };

  return <AdminAttendanceClient initialData={initialData} batches={batches} />;
}
