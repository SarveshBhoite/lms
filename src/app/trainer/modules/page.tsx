import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Layers } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerModulesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const modules = await prisma.courseModule.findMany({
    where: isAdmin
      ? {}
      : {
          course: {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
        },
    include: {
      course: { select: { title: true } },
      lessons: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Modules & Curriculum Architecture</h1>
        <p className="text-slate-400 text-sm mt-1">Organize syllabus chapters, track lesson counts, and sequence milestones for assigned courses.</p>
      </div>

      {modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <div key={mod.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="text-xs text-amber-400 font-semibold">{mod.course.title}</div>
                <h3 className="font-bold text-base text-white">Module {idx + 1}: {mod.title}</h3>
                <p className="text-xs text-slate-400">{mod.description || "Core syllabus track"}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                  {mod.lessons.length} Lessons
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm">No curriculum modules found in your assigned scope.</p>
        </div>
      )}
    </div>
  );
}
