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

  const batches = await prisma.batch.findMany({
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
      liveClasses: {
        include: {
          attendances: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

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
            const totalPresent = b.liveClasses.reduce(
              (acc, lc) => acc + lc.attendances.filter((a) => a.status === "PRESENT").length,
              0
            );
            const totalPossible = totalClasses * (b.students.length || 1);
            const avgAttendancePct = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

            return (
              <div key={b.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {b.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Course: {b.course.title}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{b.name}</h3>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Enrolled:</span>
                      <strong className="text-slate-900">{b.students.length} Students</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Live Sessions:</span>
                      <strong className="text-cyan-700">{b.liveClasses.length} Classes</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Attendance:</span>
                      <strong className="text-emerald-700">{avgAttendancePct.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/trainer/batches/${b.id}?tab=attendance`}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <CheckSquare className="w-4 h-4" /> Open Attendance Roster
                </Link>
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
