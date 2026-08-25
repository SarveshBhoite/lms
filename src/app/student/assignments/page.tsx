import Link from "next/link";
import prisma from "@/lib/prisma";
import { FileText, Clock, Award, ArrowRight } from "lucide-react";

export default async function StudentAssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    include: {
      course: { select: { title: true } },
    },
    orderBy: { deadline: "asc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Course Assignments</h1>
        <p className="text-slate-400 text-sm mt-1">Submit your milestones, projects, and lab repositories for faculty evaluation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((asgn) => (
          <div key={asgn.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-indigo-400 font-semibold">{asgn.course.title}</div>
              <h3 className="text-lg font-bold text-white">{asgn.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3">{asgn.description}</p>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Marks:</span>
                  <span className="font-semibold text-white">{asgn.totalMarks} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deadline:</span>
                  <span className="text-amber-400 font-medium">{new Date(asgn.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Allowed Types:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{asgn.allowedFileTypes.join(", ")}</span>
                </div>
              </div>

              <Link
                href={`/student/assignments/${asgn.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                Submit Project <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
