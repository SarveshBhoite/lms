import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChevronLeft, BookOpen, Layers, CheckSquare, HelpCircle, FileCheck, Award, Lock } from "lucide-react";
import { redirect, notFound } from "next/navigation";

export default async function TrainerStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const student = await prisma.user.findUnique({
    where: { id, role: "STUDENT" },
    include: {
      profile: true,
      enrollments: {
        include: {
          course: { select: { title: true } },
          batch: { select: { name: true } },
        },
      },
      courseProgresses: {
        include: { course: { select: { title: true } } },
      },
      quizAttempts: {
        include: { quiz: { select: { title: true, passingMarks: true } } },
        orderBy: { startedAt: "desc" },
      },
      assignmentSubmissions: {
        include: {
          assignment: { select: { title: true, totalMarks: true } },
          feedback: true,
        },
        orderBy: { submittedAt: "desc" },
      },
      attendances: {
        include: { liveClass: { select: { title: true, scheduledDate: true } } },
        orderBy: { recordedAt: "desc" },
      },
      certificates: {
        include: { course: { select: { title: true } } },
      },
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Navigation Top */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Students
        </Link>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-amber-600" /> Read-Only Academic Record
        </span>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-2xl flex items-center justify-center">
            {student.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{student.name}</h1>
            <p className="text-xs text-slate-500 font-mono">{student.email}</p>
            {student.profile?.phone && <p className="text-xs text-slate-600 font-mono">Phone: {student.profile.phone}</p>}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-right font-mono text-xs">
          <div className="text-slate-600">Account Role: <span className="text-indigo-700 font-bold">{student.role}</span></div>
          <div className="text-slate-600">Account Status: <span className="text-emerald-700 font-bold">{student.isActive ? "ACTIVE" : "INACTIVE"}</span></div>
        </div>
      </div>

      {/* Grid of Student Academic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" /> Course Progress
          </h2>

          {student.courseProgresses.length > 0 ? (
            <div className="space-y-3">
              {student.courseProgresses.map((cp) => (
                <div key={cp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{cp.course.title}</span>
                    <span className="text-amber-700 font-bold font-mono">{cp.progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(cp.progressPercent, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No active progress recorded yet.</div>
          )}
        </div>

        {/* Attendance Record */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" /> Attendance History
          </h2>

          {student.attendances.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {student.attendances.map((att) => (
                <div key={att.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{att.liveClass.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{new Date(att.liveClass.scheduledDate).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    att.status === "PRESENT" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {att.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No attendance marked yet.</div>
          )}
        </div>

        {/* Quizzes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" /> Quiz Attempts
          </h2>

          {student.quizAttempts.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {student.quizAttempts.map((qa) => (
                <div key={qa.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{qa.quiz.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Score: {qa.score}%</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    qa.isPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {qa.isPassed ? "PASSED" : "FAILED"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No quiz attempts submitted.</div>
          )}
        </div>

        {/* Assignments */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-rose-600" /> Assignment Submissions
          </h2>

          {student.assignmentSubmissions.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {student.assignmentSubmissions.map((sub) => (
                <div key={sub.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{sub.assignment.title}</span>
                    <span className="text-[10px] font-mono text-rose-700 font-bold">{sub.status}</span>
                  </div>
                  {sub.feedback && (
                    <div className="text-[11px] text-amber-700 font-mono pt-1">
                      Marks: {sub.feedback.marksAwarded} / {sub.assignment.totalMarks} — Feedback: "{sub.feedback.feedbackText}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No assignments submitted.</div>
          )}
        </div>
      </div>
    </div>
  );
}
