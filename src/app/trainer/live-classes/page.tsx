import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Video, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerLiveClassesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const liveClasses = await prisma.liveClass.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { trainerId },
            { batch: { trainers: { some: { trainerId } } } },
            { batch: { course: { trainerId } } },
          ],
        },
    include: {
      batch: { select: { id: true, name: true, course: { select: { title: true } } } },
      trainer: { select: { id: true, name: true, email: true } },
      attendances: { select: { id: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Live Classes & Google Meet Sessions</h1>
          <p className="text-slate-600 text-sm mt-1">
            Schedule live interactive classes for your assigned cohorts, manage Meet links, recordings, and attendance.
          </p>
        </div>
      </div>

      {liveClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveClasses.map((lc) => (
            <div key={lc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      lc.status === "LIVE"
                        ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                        : lc.status === "COMPLETED"
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {lc.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(lc.scheduledDate).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{lc.title}</h3>
                <p className="text-xs text-slate-600">
                  Batch: <span className="text-cyan-700 font-bold">{lc.batch.name}</span> ({lc.batch.course.title})
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700 font-mono">
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <strong className="text-slate-900">
                      {new Date(lc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(lc.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Instructor:</span>
                    <strong className="text-cyan-700">{lc.trainer.name}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <a
                  href={lc.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Video className="w-4 h-4" /> Launch Google Meet <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  href={`/trainer/batches/${lc.batch.id}`}
                  className="block text-center w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Manage Batch & Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Video className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No live classes scheduled across your assigned batches yet.</p>
        </div>
      )}
    </div>
  );
}
