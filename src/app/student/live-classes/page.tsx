import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Video, ExternalLink, Calendar, Clock, CheckCircle2 } from "lucide-react";

export default async function StudentLiveClassesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const liveClasses = await prisma.liveClass.findMany({
    where: {
      batch: { students: { some: { userId: studentId } } },
    },
    include: {
      batch: { select: { id: true, name: true, course: { select: { title: true } } } },
      trainer: { select: { id: true, name: true, email: true } },
      attendances: {
        where: { userId: studentId },
        select: { status: true },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Video className="w-7 h-7 text-cyan-600" /> My Batch Live Interactive Classes
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Join live Google Meet sessions scheduled by your instructor and watch session recordings.
          </p>
        </div>
      </div>

      {liveClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveClasses.map((lc) => {
            const studentAtt = lc.attendances[0];

            return (
              <div
                key={lc.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        lc.status === "LIVE"
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : lc.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-purple-50 text-[#7C248C] border-purple-200"
                      }`}
                    >
                      {lc.status}
                    </span>

                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(lc.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1">
                      {lc.batch.course.title} • {lc.batch.name}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base">{lc.title}</h3>
                    {lc.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lc.description}</p>}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <strong className="text-slate-900">
                        {new Date(lc.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <strong className="text-[#7C248C]">{lc.trainer.name}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {lc.meetUrl && lc.status !== "COMPLETED" ? (
                    <a
                      href={lc.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Video className="w-4 h-4" /> Join Google Meet
                    </a>
                  ) : lc.recordingUrl ? (
                    <a
                      href={lc.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <ExternalLink className="w-4 h-4" /> Watch Class Recording
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                    >
                      Class Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Video className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No live interactive sessions scheduled for your batch right now.</p>
        </div>
      )}
    </div>
  );
}
