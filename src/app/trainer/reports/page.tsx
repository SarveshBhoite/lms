import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BarChart3, BookOpen, Users, CheckSquare, HelpCircle, FileCheck } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerReportsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const [courses, batches, quizAttempts, assignmentSubmissions, attendances] = await Promise.all([
    prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
      include: { enrollments: true },
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
      include: { students: true, liveClasses: true },
    }),
    prisma.quizAttempt.findMany({
      where: isAdmin
        ? {}
        : {
            quiz: {
              course: {
                OR: [
                  { trainerId },
                  { batches: { some: { trainers: { some: { trainerId } } } } },
                ],
              },
            },
          },
    }),
    prisma.assignmentSubmission.findMany({
      where: isAdmin
        ? {}
        : {
            assignment: {
              course: {
                OR: [
                  { trainerId },
                  { batches: { some: { trainers: { some: { trainerId } } } } },
                ],
              },
            },
          },
      include: { feedback: true },
    }),
    prisma.attendance.findMany({
      where: isAdmin
        ? {}
        : {
            liveClass: {
              batch: {
                OR: [
                  { course: { trainerId } },
                  { trainers: { some: { trainerId } } },
                ],
              },
            },
          },
    }),
  ]);

  const totalStudents = courses.reduce((acc, c) => acc + c.enrollments.length, 0);
  const totalQuizAttempts = quizAttempts.length;
  const passedQuizAttempts = quizAttempts.filter((q) => q.isPassed).length;
  const quizPassRate = totalQuizAttempts > 0 ? (passedQuizAttempts / totalQuizAttempts) * 100 : 0;

  const totalSubmissions = assignmentSubmissions.length;
  const gradedSubmissions = assignmentSubmissions.filter((s) => s.status === "EVALUATED").length;

  const totalAttendanceRecords = attendances.length;
  const presentRecords = attendances.filter((a) => a.status === "PRESENT").length;
  const overallAttendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Faculty Academic Analytics & Reports</h1>
        <p className="text-slate-600 text-sm mt-1">
          Performance metrics for assigned courses, student quiz pass rates, assignment evaluation completion, and attendance rates.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Active Enrolled Students
          </div>
          <div className="text-3xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-indigo-700 font-mono">Across {courses.length} Courses</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 font-mono flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-600" /> Quiz Pass Rate
          </div>
          <div className="text-3xl font-black text-purple-600">{quizPassRate.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 font-mono">{passedQuizAttempts} of {totalQuizAttempts} attempts passed</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 font-mono flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-rose-600" /> Assignment Evaluated Rate
          </div>
          <div className="text-3xl font-black text-rose-600">
            {totalSubmissions > 0 ? ((gradedSubmissions / totalSubmissions) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">{gradedSubmissions} of {totalSubmissions} submissions graded</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500 font-mono flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" /> Attendance Rate
          </div>
          <div className="text-3xl font-black text-emerald-600">{overallAttendanceRate.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 font-mono">{presentRecords} present entries recorded</div>
        </div>
      </div>

      {/* Course Performance Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" /> Course Scope Breakdown
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
              <tr>
                <th className="p-4">Course Title</th>
                <th className="p-4">Active Students</th>
                <th className="p-4">Batches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {courses.map((c) => {
                const courseBatches = batches.filter((b) => b.courseId === c.id);

                return (
                  <tr key={c.id}>
                    <td className="p-4 font-bold text-slate-900">{c.title}</td>
                    <td className="p-4 font-mono text-indigo-700 font-bold">{c.enrollments.length}</td>
                    <td className="p-4 font-mono text-cyan-700 font-bold">{courseBatches.length} Cohorts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
