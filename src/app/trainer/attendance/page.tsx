import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CheckSquare,
  Sparkles,
  Users,
  Video,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Clock,
  ArrowRight,
} from "lucide-react";
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

  // Overall Global KPI Analytics for Trainer
  const totalBatches = batches.length;
  const totalStudentsAcrossBatches = batches.reduce((sum, b) => sum + b.students.length, 0);
  const totalSessionsConducted = batches.reduce((sum, b) => sum + b.liveClasses.length, 0);

  // Calculate overall average attendance % across all batches
  const batchesWithSessions = batches.filter((b) => b.liveClasses.length > 0 && b.students.length > 0);
  let overallAvgAttendancePct = 0;
  if (batchesWithSessions.length > 0) {
    const totalBatchPcts = batchesWithSessions.reduce((sum, b) => {
      const totalPossible = b.liveClasses.length * b.students.length;
      const totalAttended = b.liveClasses.reduce(
        (acc, lc) =>
          acc +
          lc.attendances.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
          ).length,
        0
      );
      return sum + (totalAttended / (totalPossible || 1)) * 100;
    }, 0);
    overallAvgAttendancePct = Math.round(totalBatchPcts / batchesWithSessions.length);
  }

  const verifiedAttendanceCount = batches.reduce(
    (sum, b) =>
      sum +
      b.liveClasses.reduce(
        (acc, lc) => acc + lc.attendances.filter((a) => a.isApproved).length,
        0
      ),
    0
  );

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. COMPACT STUDIO BANNER (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <CheckSquare className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Cohort Roll Call & Attendance Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                Active Cohorts
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Attendance Tracking & Verification
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Audit live session attendance records, evaluate student check-ins, and inspect cohort turnout percentages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Link
            href="/trainer/live-classes"
            className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Video className="w-4 h-4" /> Live Interactive Studio
          </Link>
        </div>
      </div>

      {/* 2. 5 HIGH-IMPACT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#1E2B88]" /> Cohort Batches
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalBatches}</span>
            <span className="text-[11px] font-mono text-slate-400">Batches</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Total Learners
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{totalStudentsAcrossBatches}</span>
            <span className="text-[11px] font-mono text-slate-400">Enrolled</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-purple-600" /> Total Sessions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{totalSessionsConducted}</span>
            <span className="text-[11px] font-mono text-slate-400">Conducted</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" /> Avg Attendance %
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {overallAvgAttendancePct > 0 ? `${overallAvgAttendancePct}%` : "—"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Across Cohorts</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#7C248C]" /> Verified Checks
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{verifiedAttendanceCount}</span>
            <span className="text-[11px] font-mono text-slate-400">Signed Off</span>
          </div>
        </div>
      </div>

      {/* 3. BATCHES ROSTER CARDS */}
      {batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b) => {
            const totalClasses = b.liveClasses.length;
            const enrolledCount = b.students.length || 0;
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

            return (
              <div
                key={b.id}
                className="glass-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-xs space-y-5 flex flex-col justify-between hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                      {b.course.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">{enrolledCount} Learners</span>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg tracking-tight">{b.name}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Sessions</span>
                      <strong className="text-slate-900 text-sm font-black">{totalClasses} Classes</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 block font-bold uppercase">Attendance %</span>
                      <strong className="text-emerald-900 text-sm font-black">
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
                    Open Attendance Roster <ArrowRight className="w-3.5 h-3.5" />
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
