import Link from "next/link";
import prisma from "@/lib/prisma";
import { Users, Mail, BookOpen, CheckCircle2 } from "lucide-react";

export default async function TrainerStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      profile: true,
      enrollments: { include: { course: { select: { title: true } } } },
      courseProgresses: true,
    },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Student Roster & Performance</h1>
        <p className="text-slate-400 text-sm mt-1">Track individual student learning milestones, assignments, and active enrollments.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Email</th>
                <th className="p-4">Active Course</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {students.map((st) => {
                const activeEnroll = st.enrollments[0];
                const prog = st.courseProgresses[0]?.progressPercent || 0;

                return (
                  <tr key={st.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-semibold text-white">{st.name}</td>
                    <td className="p-4 font-mono text-slate-400">{st.email}</td>
                    <td className="p-4">{activeEnroll?.course.title || "Unassigned"}</td>
                    <td className="p-4 font-semibold text-indigo-400">{prog}%</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        Active
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
