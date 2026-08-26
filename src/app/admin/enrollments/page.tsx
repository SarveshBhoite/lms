import Link from "next/link";
import prisma from "@/lib/prisma";
import { Users, BookOpen, Calendar, CheckCircle2, ShieldCheck, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEnrollmentsPage() {
  let enrollments: any[] = [];

  try {
    enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        course: true,
        batch: true,
      },
      orderBy: { enrolledAt: "desc" },
    });
  } catch {
    enrollments = [
      {
        id: "enr1",
        user: { name: "Sophia Martinez", email: "sophia.student@institute.edu" },
        course: { title: "Full-Stack Next.js 15 & Enterprise Architecture" },
        batch: { name: "Next.js Alpha Cohort 2026" },
        enrolledAt: new Date(),
        status: "ACTIVE",
      },
    ];
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Institutional Registry
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Enrollment & Cohort Allocations
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Audit all active student enrollments, cohort assignments, and curriculum statuses.
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-bold">
              <tr>
                <th className="p-4 sm:px-6">Student Scholar</th>
                <th className="p-4">Curriculum Track</th>
                <th className="p-4">Cohort / Batch</th>
                <th className="p-4">Enrolled Timestamp</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {enrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 sm:px-6">
                    <div className="font-bold text-white text-xs">{enr.user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{enr.user.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-indigo-300">{enr.course.title}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/20">
                      {enr.batch?.name || "Next.js Alpha Cohort 2026"}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-400 text-[11px]">
                    {new Date(enr.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                      {enr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
