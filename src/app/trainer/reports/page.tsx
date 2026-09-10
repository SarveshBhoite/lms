import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportsClient from "@/app/components/reports/ReportsClient";
import {
  FileSpreadsheet,
  Sparkles,
  BookOpen,
  Layers,
  Users,
  Award,
  CheckSquare,
} from "lucide-react";

export default async function TrainerReportsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const [courses, batches, totalStudents, completedLiveClasses, liveClassAttendances] = await Promise.all([
    prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { trainers: { some: { trainerId } } },
            ],
          },
      select: { id: true, name: true, students: { select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        ...(isAdmin
          ? {}
          : {
              OR: [
                { enrollments: { some: { course: { trainerId } } } },
                { enrollments: { some: { batch: { trainers: { some: { trainerId } } } } } },
                { studentBatches: { some: { batch: { trainers: { some: { trainerId } } } } } },
                { studentBatches: { some: { batch: { course: { trainerId } } } } },
              ],
            }),
      },
    }),
    prisma.liveClass.count({
      where: {
        status: "COMPLETED",
        ...(isAdmin
          ? {}
          : {
              OR: [
                { trainerId },
                { course: { trainerId } },
                { batch: { trainers: { some: { trainerId } } } },
              ],
            }),
      },
    }),
    prisma.attendance.findMany({
      where: {
        liveClass: {
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { trainerId },
                  { course: { trainerId } },
                  { batch: { trainers: { some: { trainerId } } } },
                ],
              }),
        },
      },
      select: { status: true },
    }),
  ]);

  // Overall attendance rate across trainer classes
  const totalAttended = liveClassAttendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
  ).length;
  const overallTurnoutPct =
    liveClassAttendances.length > 0
      ? Math.round((totalAttended / liveClassAttendances.length) * 100)
      : 0;

  const serializedBatches = batches.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. COMPACT STUDIO BANNER (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <FileSpreadsheet className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Intelligence & Audit Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                Ready for Export
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports & Academic Data Exports
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Generate auditable registries, session participation logs, and evaluation metrics in clean Excel (.xlsx) & CSV formats.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 text-[#7C248C] shadow-2xs">
            {courses.length} Courses
          </span>
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            {batches.length} Batches
          </span>
        </div>
      </div>

      {/* 2. 5 HIGH-IMPACT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E2B88]" /> Assigned Courses
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1E2B88]">{courses.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Programs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" /> Active Batches
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{batches.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Cohorts</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Enrolled Students
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{totalStudents}</span>
            <span className="text-[11px] font-mono text-slate-400">Learners</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" /> Avg Attendance %
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {overallTurnoutPct > 0 ? `${overallTurnoutPct}%` : "—"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Turnout</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#7C248C]" /> Completed Meets
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{completedLiveClasses}</span>
            <span className="text-[11px] font-mono text-slate-400">Sessions</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE REPORTS CLIENT COMPONENT */}
      <ReportsClient
        role={isAdmin ? "ADMIN" : "TRAINER"}
        courses={courses}
        batches={serializedBatches}
      />
    </div>
  );
}


