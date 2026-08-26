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
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> New Assignment
        </Link>
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asgn) => {
            const pendingCount = asgn.submissions.filter((s) => s.status === "SUBMITTED").length;

            return (
              <div key={asgn.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-rose-600 font-bold">
                      Deadline: {new Date(asgn.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{asgn.totalMarks} Marks</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{asgn.title}</h3>
                  <p className="text-xs text-slate-600">Course: <span className="text-rose-700 font-bold">{asgn.course.title}</span></p>
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-900">{asgn.submissions.length}</div>
                      <div className="text-[10px] text-slate-500">Submissions</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-amber-600">{pendingCount}</div>
                      <div className="text-[10px] text-slate-500">Pending Grade</div>
                    </div>
                  </div>

                  <Link
                    href={`/trainer/assignments/${asgn.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    Evaluate Submissions
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
