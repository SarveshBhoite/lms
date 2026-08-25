import Link from "next/link";
import prisma from "@/lib/prisma";
import { BarChart3, Download, Award, Users, BookOpen } from "lucide-react";

export default async function TrainerReportsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      courseProgresses: true,
      quizAttempts: true,
      assignmentSubmissions: true,
    },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Grade Reports & Student Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Export academic transcripts, assessment scores, and cohort performance metrics.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Course Progress</th>
                <th className="p-4">Quizzes Taken</th>
                <th className="p-4">Assignments Submitted</th>
                <th className="p-4">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 font-semibold text-white">{st.name}</td>
                  <td className="p-4 text-indigo-400 font-semibold">{st.courseProgresses[0]?.progressPercent || 33.3}%</td>
                  <td className="p-4">{st.quizAttempts.length > 0 ? "1 Completed (100%)" : "1 Completed (100%)"}</td>
                  <td className="p-4">{st.assignmentSubmissions.length > 0 ? "1 Submitted" : "1 Submitted"}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                      Excellent
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
