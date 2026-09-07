import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckSquare } from "lucide-react";

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

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
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

      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        {attendances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px] font-bold">
                <tr>
                  <th className="p-4">Live Class Title</th>
                  <th className="p-4">Course & Batch</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4">Status & Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{att.liveClass.title}</div>
                      {att.excuseReason && (
                        <span className="text-[11px] text-blue-600 font-mono block mt-0.5">
                          Note: {att.excuseReason}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {att.liveClass.batch.course.title} ({att.liveClass.batch.name})
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(att.liveClass.scheduledDate).toLocaleDateString()}{" "}
                      <span className="text-slate-400 text-[11px]">
                        ({new Date(att.liveClass.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-700">
                      {att.joinClickTime ? (
                        new Date(att.joinClickTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                            att.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : att.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : att.status === "EXCUSED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {att.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {att.isApproved ? "✓ Verified" : "⏳ Pending"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">No attendance records logged yet.</div>
        )}
      </div>
    </div>
  );
}
