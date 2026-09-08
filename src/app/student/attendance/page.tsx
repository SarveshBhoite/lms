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
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
            Academic Participation Log
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Class <span className="jvm-gradient-text">Attendance</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Monitor real-time interactive session participation, verification statuses, and attendance eligibility.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-right">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Overall Compliance</span>
            <span className={`text-base sm:text-lg font-black font-mono ${
              attendancePercent >= 80 ? "text-emerald-600" : attendancePercent >= 60 ? "text-amber-600" : "text-rose-600"
            }`}>
              {attendancePercent.toFixed(1)}%
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl bg-purple-50 border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {serialized.length} {serialized.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>
      </div>

      <StudentAttendanceClient
        initialAttendances={serialized as any}
        attendancePercent={attendancePercent}
      />
    </div>
  );
}


