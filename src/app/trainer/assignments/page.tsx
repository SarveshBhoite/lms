import Link from "next/link";
import prisma from "@/lib/prisma";
import { FileText, Calendar, Clock, Plus } from "lucide-react";

export default async function TrainerAssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    include: {
      course: { select: { title: true } },
      submissions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Assignments & Lab Grading</h1>
        <p className="text-slate-400 text-sm mt-1">Review student project submissions, assign marks, and provide feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((asgn) => (
          <div key={asgn.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <div className="text-xs text-amber-400 font-semibold">{asgn.course.title}</div>
              <h3 className="text-base font-bold text-white mt-1">{asgn.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{asgn.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Marks:</span>
                <span className="font-semibold text-white">{asgn.totalMarks} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submissions:</span>
                <span className="text-emerald-400 font-semibold">{asgn.submissions.length} received</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deadline:</span>
                <span className="text-slate-200">{new Date(asgn.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
