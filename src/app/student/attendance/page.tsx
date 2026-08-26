import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckSquare, Calendar } from "lucide-react";

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

  const totalClasses = attendances.length;
  const presentClasses = attendances.filter((a) => a.status === "PRESENT").length;
  const attendancePercent = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-emerald-600" /> Attendance Records
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View-only history of live interactive class attendance logged by your faculty instructors.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center font-mono">
          <span className="text-[10px] text-emerald-800 uppercase font-bold block">Overall Attendance</span>
          <strong className="text-2xl font-black text-emerald-700">{attendancePercent.toFixed(1)}%</strong>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {attendances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold font-mono">
                <tr>
                  <th className="p-4">Live Class Title</th>
                  <th className="p-4">Course & Batch</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-bold text-slate-900">{att.liveClass.title}</td>
                    <td className="p-4 font-bold text-cyan-700">
                      {att.liveClass.batch.course.title} ({att.liveClass.batch.name})
                    </td>
                    <td className="p-4 text-slate-500">{new Date(att.liveClass.scheduledDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        att.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : att.status === "ABSENT"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No attendance records logged for your account yet.
          </div>
        )}
      </div>
    </div>
  );
}
