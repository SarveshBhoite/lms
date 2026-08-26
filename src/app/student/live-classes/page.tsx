import Link from "next/link";
import prisma from "@/lib/prisma";
import { Video, Calendar, Clock, User, ArrowRight, Sparkles, ExternalLink, ShieldCheck, PlayCircle } from "lucide-react";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentLiveClassesPage() {
  const session = await getSession();

  let liveClasses: any[] = [];

  try {
    liveClasses = await prisma.liveClass.findMany({
      include: {
        trainer: {
          include: { profile: true },
        },
        batch: { select: { name: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });
  } catch {
    liveClasses = [
      {
        id: "lc1",
        title: "Microservices Architecture & Edge Routing Workshop",
        description: "Live interactive deep-dive into distributed systems, RBAC edge proxies, and containerized deployment.",
        scheduledDate: new Date(),
        startTime: new Date(),
        meetUrl: "https://meet.google.com/jvm-arch-live",
        recordingUrl: "https://cloud.institute.edu/recordings/arch-workshop-01.mp4",
        status: "SCHEDULED",
        batch: { name: "Next.js Alpha Cohort 2026" },
        trainer: { name: "Prof. Marcus Thorne" },
      },
    ];
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <Video className="w-3.5 h-3.5" /> Interactive Cohort Sessions
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Live Classes & Workshops</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Join real-time video lectures, interactive lab reviews, and direct faculty Q&A sessions.
        </p>
      </div>

      {liveClasses.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center text-slate-500 space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-cyan-400/50" />
          <p className="text-sm font-semibold text-slate-300">No Live Classes Scheduled Currently</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your instructors will schedule upcoming live classes and broadcast notifications prior to session launch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveClasses.map((lc) => {
            const isLive = lc.status === "LIVE";
            const dateStr = new Date(lc.scheduledDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = new Date(lc.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={lc.id}
                className={`glass-panel p-6 sm:p-7 rounded-3xl border transition flex flex-col justify-between space-y-5 shadow-xl ${
                  isLive ? "border-cyan-500/50 shadow-cyan-500/10 ring-1 ring-cyan-500/30" : "border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {lc.batch.name}
                    </span>

                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold animate-pulse border border-rose-500/30">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> LIVE NOW
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {dateStr}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{lc.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {lc.description || "Interactive live session covering curriculum milestones and architecture review."}
                    </p>
                  </div>

                  {lc.recordingUrl && (
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Class Recording Available</span>
                      </div>
                      <a
                        href={lc.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 font-bold hover:underline"
                      >
                        Watch Stream
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-300 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                      {lc.trainer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{lc.trainer.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{timeStr}</div>
                    </div>
                  </div>

                  <a
                    href={lc.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                  >
                    <Video className="w-4 h-4" /> Join Session <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
