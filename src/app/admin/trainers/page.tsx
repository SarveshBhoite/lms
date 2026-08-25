import Link from "next/link";
import prisma from "@/lib/prisma";
import { GraduationCap, Mail, Phone, BookOpen, Plus } from "lucide-react";

export default async function AdminTrainersPage() {
  const trainers = await prisma.user.findMany({
    where: { role: "TRAINER" },
    include: {
      profile: true,
      coursesCreated: true,
      trainerBatches: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Faculty & Trainers Registry</h1>
        <p className="text-slate-400 text-sm mt-1">Manage instructor appointments, assigned curricula, and teaching loads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((tr) => (
          <div key={tr.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                {tr.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{tr.name}</h3>
                <p className="text-xs text-amber-400">{tr.profile?.designation || "Lead Instructor"}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 line-clamp-2">{tr.profile?.bio || "Expert faculty trainer."}</p>

            <div className="pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-300">{tr.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Courses:</span>
                <span className="font-semibold text-white">{tr.coursesCreated.length} Courses</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
