import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { FileCheck, Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerAssignmentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const assignments = await prisma.assignment.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { course: { trainerId } },
            { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
          ],
        },
    include: {
      course: { select: { title: true } },
      submissions: { select: { id: true, status: true } },
    },
    orderBy: { deadline: "asc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Assignments & Submissions</h1>
          <p className="text-slate-600 text-sm mt-1">
            Create course assignments, evaluate student submissions, grant marks, and manage resubmission requests.
          </p>
        </div>

        <Link
          href="/trainer/assignments/create"
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> New Assignment
        </Link>
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asgn) => {
            const pendingCount = asgn.submissions.filter((s) => s.status === "SUBMITTED").length;

            return (
              <div key={asgn.id} className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#E01E6A] font-bold">
                      Deadline: {asgn.deadline ? new Date(asgn.deadline).toLocaleDateString() : "Flexible / None"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{asgn.totalMarks} Marks</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1">
                      {asgn.course.title}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg">{asgn.title}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Submissions</span>
                      <strong className="text-slate-900">{asgn.submissions.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Pending Grading</span>
                      <strong className="text-[#E01E6A] font-bold">{pendingCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/trainer/assignments/${asgn.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Grade & Evaluate Submissions
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No assignments created under your assigned courses yet.</p>
        </div>
      )}
    </div>
  );
}
