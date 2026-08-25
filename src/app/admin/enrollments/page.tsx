import Link from "next/link";
import prisma from "@/lib/prisma";
import { Users, BookOpen, Calendar, CheckCircle2 } from "lucide-react";

export default async function AdminEnrollmentsPage() {
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: true,
      course: true,
      batch: true,
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Enrollment Registry</h1>
        <p className="text-slate-400 text-sm mt-1">Audit all student course enrollments, cohort assignments, and progress statuses.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Course</th>
                <th className="p-4">Cohort / Batch</th>
                <th className="p-4">Enrolled Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {enrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 font-semibold text-white">{enr.user.name}</td>
                  <td className="p-4">{enr.course.title}</td>
                  <td className="p-4">{enr.batch?.name || "Self-Paced"}</td>
                  <td className="p-4 text-slate-400">{new Date(enr.enrolledAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
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
