import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Layers, Calendar, Users, Video, Plus, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerBatchesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const batches = await prisma.batch.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { course: { trainerId } },
            { trainers: { some: { trainerId } } },
          ],
        },
    include: {
      course: { select: { title: true, slug: true } },
      students: true,
      trainers: { include: { trainer: { select: { name: true } } } },
      liveClasses: true,
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Academic Batches</h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage assigned cohorts, create new course batches, assign enrolled students, and run live interactive classes.
          </p>
        </div>

        <Link
          href="/trainer/batches/create"
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Create New Batch
        </Link>
      </div>

      {batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                    {batch.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(batch.startDate).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1">
                    {batch.course.title}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg">{batch.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Enrolled Students</span>
                    <strong className="text-slate-900">{batch.students.length}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Live Sessions</span>
                    <strong className="text-[#7C248C]">{batch.liveClasses.length}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/trainer/batches/${batch.id}`}
                  className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Manage Batch & Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No batches mapped to your account yet.</p>
          <Link
            href="/trainer/batches/create"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-xs mt-2"
          >
            <Plus className="w-4 h-4" /> Create your first batch
          </Link>
        </div>
      )}
    </div>
  );
}
