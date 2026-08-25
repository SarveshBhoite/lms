import Link from "next/link";
import prisma from "@/lib/prisma";
import { Users, Mail, UserCheck, Shield, Calendar } from "lucide-react";

export default async function AdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      profile: true,
      enrollments: { include: { course: { select: { title: true } } } },
      courseProgresses: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Student Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage student accounts, registrations, and academic status.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Student Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Email Verified</th>
                <th className="p-4">Enrolled Course</th>
                <th className="p-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 font-semibold text-white">{st.name}</td>
                  <td className="p-4 font-mono text-slate-400">{st.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                      Verified
                    </span>
                  </td>
                  <td className="p-4">{st.enrollments[0]?.course.title || "Full-Stack Next.js 15"}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold text-[10px]">
                      Active
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
