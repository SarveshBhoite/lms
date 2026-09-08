import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import StudentProfileClient from "./StudentProfileClient";

export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
      enrollments: {
        include: {
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, name: true } },
        },
      },
      studentBatches: {
        include: { batch: { select: { id: true, name: true } } },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const serialized = {
    id: student.id,
    name: student.name,
    email: student.email,
    role: student.role,
    isActive: student.isActive,
    profile: student.profile
      ? {
          phone: student.profile.phone,
          bio: student.profile.bio,
          designation: student.profile.designation,
          avatarUrl: student.profile.avatarUrl,
        }
      : null,
    enrollments: student.enrollments.map((en) => ({
      course: { id: en.course.id, title: en.course.title },
      batch: en.batch ? { id: en.batch.id, name: en.batch.name } : null,
    })),
    studentBatches: student.studentBatches.map((sb) => ({
      batch: { id: sb.batch.id, name: sb.batch.name },
    })),
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            Account Management
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Student <span className="jvm-gradient-text">Profile & Security</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Manage your personal student details, profile photo, and password credentials.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {serialized.enrollments.length} {serialized.enrollments.length === 1 ? "Active Course" : "Active Courses"}
          </span>
        </div>
      </div>

      <StudentProfileClient initialStudent={serialized as any} currentUserId={session.userId} />
    </div>
  );
}

