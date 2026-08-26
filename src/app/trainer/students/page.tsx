import Link from "next/link";
import prisma from "@/lib/prisma";
import { Users, Mail, BookOpen, CheckCircle2, Award, FileText, HelpCircle, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrainerStudentsPage() {
  let students: any[] = [];

  try {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: { select: { title: true } },
            batch: { select: { name: true } },
          },
        },
        courseProgresses: true,
        quizAttempts: true,
        assignmentSubmissions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    students = [
      {
        id: "st1",
        name: "Sophia Martinez",
        email: "sophia.student@institute.edu",
        enrollments: [
          {
            course: { title: "Full-Stack Next.js 15 & Enterprise Architecture" },
            batch: { name: "Next.js Alpha Cohort 2026" },
          },
        ],
        courseProgresses: [{ progressPercent: 40 }],
        quizAttempts: [{ id: "qa1" }],
        assignmentSubmissions: [{ id: "as1" }],
      },
    ];
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5" /> Learner Analytics
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Roster & Cohort Performance
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Monitor student learning curves, batch assignments, quiz scores, and lab submissions.
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-bold">
              <tr>
                <th className="p-4 sm:px-6">Student</th>
                <th className="p-4">Cohort / Batch</th>
                <th className="p-4">Active Course Track</th>
                <th className="p-4">Curriculum Progress</th>
                <th className="p-4">Quizzes</th>
                <th className="p-4">Assignments</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {students.map((st) => {
                const activeEnroll = st.enrollments?.[0];
                const prog = st.courseProgresses?.[0]?.progressPercent || 0;
                const batchName = activeEnroll?.batch?.name || "Alpha Cohort 2026";

                return (
                  <tr key={st.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 sm:px-6">
                      <div className="font-bold text-white text-xs">{st.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{st.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/20">
                        {batchName}
                      </span>
                    </td>
                    <td className="p-4 text-indigo-300 font-semibold">{activeEnroll?.course?.title || "Full-Stack Next.js 15"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white text-xs">{prog}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      <span className="text-emerald-400 font-bold">{st.quizAttempts?.length || 0} Completed</span>
                    </td>
                    <td className="p-4 font-mono">
                      <span className="text-amber-400 font-bold">{st.assignmentSubmissions?.length || 0} Submitted</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                        Active Learner
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
