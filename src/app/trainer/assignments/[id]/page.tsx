import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { ChevronLeft, FileCheck, ExternalLink, Award } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import TrainerAssignmentEvaluateClient from "./TrainerAssignmentEvaluateClient";

export default async function TrainerAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      submissions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          feedback: true,
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  const hasAccess = await verifyTrainerCourseAccess(session.userId, assignment.courseId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/trainer/assignments"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-rose-400 font-mono">
            Deadline: {new Date(assignment.deadline).toLocaleDateString()}
          </span>
          <span className="text-xs text-slate-400 font-mono">{assignment.totalMarks} Total Marks</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{assignment.title}</h1>
        <p className="text-slate-400 text-xs">{assignment.description}</p>
      </div>

      <TrainerAssignmentEvaluateClient initialAssignment={assignment as any} />
    </div>
  );
}
