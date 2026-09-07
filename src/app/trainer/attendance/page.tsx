import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CheckSquare } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerAttendancePage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const rawBatches = await prisma.batch.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { course: { trainerId } },
            { trainers: { some: { trainerId } } },
          ],
        },
    include: {
      course: { select: { title: true } },
      students: true,
    },
    orderBy: { startDate: "desc" },
  });

  // Fetch live classes with attendances for each batch
  const batches = await Promise.all(
    rawBatches.map(async (b) => {
      const liveClasses = await prisma.liveClass.findMany({
        where: {
          OR: [
            { batchId: b.id },
            { batchIds: { has: b.id } },
          ],
        },
        include: {
          attendances: true,
        },
      });

      return {
        ...b,
        liveClasses,
      };
    })
  );

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Attendance Tracking Studio</h1>
          <p className="text-slate-600 text-sm mt-1">
            Select an assigned batch and live class session to record attendance and monitor attendance metrics.
          </p>
        </div>
      </div>

      {batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b) => {
            const totalClasses = b.liveClasses.length;
            const enrolledCount = b.students.length || 0;
            // PRESENT, LATE, and EXCUSED count as attended
            const totalAttended = b.liveClasses.reduce(
              (acc, lc) =>
                acc +
                lc.attendances.filter(
                  (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
                ).length,
              0
            );
            const totalPossible = totalClasses * (enrolledCount || 1);
            const avgAttendancePct = totalClasses > 0 && enrolledCount > 0 ? (totalAttended / totalPossible) * 100 : 0;
            const avgPresentPerSession = totalClasses > 0 ? (totalAttended / totalClasses).toFixed(1) : "0";

            return (
              <div key={b.id} className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                      {b.course.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{enrolledCount} Learners</span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg">{b.name}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Sessions</span>
                      <strong className="text-slate-900">{totalClasses} Classes</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 block font-bold uppercase">Avg Attendance</span>
                      <strong className="text-emerald-900">
                        {avgAttendancePct.toFixed(0)}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/trainer/attendance/${b.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Open Attendance Roster
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <CheckSquare className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No active batches available for attendance tracking.</p>
        </div>
      )}
    </div>
  );
}
