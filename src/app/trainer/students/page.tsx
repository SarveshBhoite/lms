import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Users, Search, BookOpen, ArrowRight, ShieldAlert, CheckSquare, HelpCircle, FileCheck } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; courseId?: string; batchId?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { q, courseId, batchId } = await searchParams;
  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const [courses, batches] = await Promise.all([
    prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
      select: { id: true, title: true },
    }),
    prisma.batch.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { trainers: { some: { trainerId } } },
            ],
          },
      select: { id: true, name: true, courseId: true },
    }),
  ]);

  const assignedCourseIds = courses.map((c) => c.id);
  const assignedBatchIds = batches.map((b) => b.id);

  const whereFilter: any = {
    role: "STUDENT",
    OR: [
      { enrollments: { some: { courseId: { in: assignedCourseIds } } } },
      { studentBatches: { some: { batchId: { in: assignedBatchIds } } } },
    ],
  };

  if (q) {
    whereFilter.AND = [
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { profile: { phone: { contains: q, mode: "insensitive" } } },
        ],
      },
    ];
  }

  if (courseId) {
    whereFilter.enrollments = { some: { courseId } };
  }

  if (batchId) {
    whereFilter.studentBatches = { some: { batchId } };
  }

  const students = await prisma.user.findMany({
    where: whereFilter,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      profile: { select: { avatarUrl: true, phone: true, designation: true } },
      enrollments: {
        where: isAdmin ? {} : { courseId: { in: assignedCourseIds } },
        select: { course: { select: { title: true } }, status: true },
      },
      studentBatches: {
        where: isAdmin ? {} : { batchId: { in: assignedBatchIds } },
        select: { batch: { select: { name: true } } },
      },
      courseProgresses: {
        where: isAdmin ? {} : { courseId: { in: assignedCourseIds } },
        select: { progressPercent: true },
      },
      quizAttempts: { select: { score: true } },
      assignmentSubmissions: {
        select: { feedback: { select: { marksAwarded: true } }, assignment: { select: { totalMarks: true } } },
      },
      attendances: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Faculty Student Scope</h1>
          <p className="text-slate-600 text-sm mt-1">
            Track student progress, attendance, quiz scores, assignment grading, and private academic notes for your assigned cohorts.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Account Controls Admin-Only
        </div>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search student by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        <select
          name="courseId"
          defaultValue={courseId || ""}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
        >
          <option value="">All Assigned Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            name="batchId"
            defaultValue={batchId || ""}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
          >
            <option value="">All Cohorts / Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shrink-0 shadow-xs"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Students Grid */}
      {students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => {
            const prog = student.courseProgresses[0];
            const progressPercent = prog ? prog.progressPercent : 0;

            const totalAtt = student.attendances.length;
            const presentAtt = student.attendances.filter((a) => a.status === "PRESENT").length;
            const attendancePercent = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0;

            const quizAvg =
              student.quizAttempts.length > 0
                ? student.quizAttempts.reduce((acc, q) => acc + q.score, 0) / student.quizAttempts.length
                : 0;

            const evaluatedSubs = student.assignmentSubmissions.filter((sub) => sub.feedback);
            const assignmentAvg =
              evaluatedSubs.length > 0
                ? evaluatedSubs.reduce(
                    (acc, sub) =>
                      acc +
                      ((sub.feedback?.marksAwarded || 0) / (sub.assignment.totalMarks || 100)) * 100,
                    0
                  ) / evaluatedSubs.length
                : 0;

            return (
              <div
                key={student.id}
                className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 text-[#7C248C] font-extrabold flex items-center justify-center text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 text-base truncate">{student.name}</h3>
                      <p className="text-xs text-slate-500 font-mono truncate">{student.email}</p>
                      {student.profile?.phone && (
                        <p className="text-[11px] text-slate-400 font-mono">{student.profile.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100 font-mono">
                    <div className="text-[11px] text-slate-500 truncate">
                      Course:{" "}
                      <span className="text-slate-900 font-semibold">
                        {student.enrollments.map((e) => e.course.title).join(", ") || "None"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Batch:{" "}
                      <span className="text-[#7C248C] font-semibold">
                        {student.studentBatches.map((b) => b.batch.name).join(", ") || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* 4 Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">PROGRESS</span>
                      <strong className="text-slate-900 font-bold">{progressPercent.toFixed(1)}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">ATTENDANCE</span>
                      <strong className="text-emerald-700 font-bold">{attendancePercent.toFixed(1)}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">QUIZ AVG</span>
                      <strong className="text-[#7C248C] font-bold">{quizAvg.toFixed(1)}%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">ASSIGNMENT AVG</span>
                      <strong className="text-[#E01E6A] font-bold">{assignmentAvg.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Link
                    href={`/trainer/students/${student.id}`}
                    className="w-full py-2.5 px-3 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Academic Profile & Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No students matching criteria found in your faculty scope.</p>
        </div>
      )}
    </div>
  );
}
