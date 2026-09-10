import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TrainerProfileFormClient from "./TrainerProfileFormClient";

export default async function TrainerProfilePage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;

  // 1. Fetch user + profile
  const user = await prisma.user.findUnique({
    where: { id: trainerId },
    include: {
      profile: true,
      coursesCreated: {
        select: {
          id: true,
          title: true,
          level: true,
          status: true,
          _count: { select: { enrollments: true, batches: true } },
        },
      },
      trainerBatches: {
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              status: true,
              course: { select: { id: true, title: true } },
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Calculate unique student count taught across trainer's batches & created courses
  const batchIds = user.trainerBatches.map((tb) => tb.batch.id);
  const totalLearnersCount = await prisma.batchStudent.groupBy({
    by: ["userId"],
    where: { batchId: { in: batchIds } },
  });

  const serialized = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profile: user.profile
      ? {
          phone: user.profile.phone,
          designation: user.profile.designation,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
        }
      : null,
    coursesCreated: user.coursesCreated.map((c) => ({
      id: c.id,
      title: c.title,
      level: c.level,
      status: c.status,
      enrollmentCount: c._count.enrollments,
      batchCount: c._count.batches,
    })),
    trainerBatches: user.trainerBatches.map((tb) => ({
      id: tb.batch.id,
      name: tb.batch.name,
      status: tb.batch.status,
      courseTitle: tb.batch.course?.title || "Assigned Course",
      studentCount: tb.batch._count.students,
    })),
    stats: {
      totalCourses: user.coursesCreated.length,
      totalBatches: user.trainerBatches.length,
      totalLearners: totalLearnersCount.length,
    },
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
      {/* Compact Header Banner matching JVM Student Profile & Studio standard (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            Faculty Account & Credential Hub
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Trainer <span className="jvm-gradient-text">Profile & Security</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Manage your faculty identity, Cloudinary profile avatar, academic bio, and credentials.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {serialized.stats.totalCourses} {serialized.stats.totalCourses === 1 ? "Assigned Course" : "Assigned Courses"} • {serialized.stats.totalBatches} {serialized.stats.totalBatches === 1 ? "Cohort" : "Cohorts"}
          </span>
        </div>
      </div>

      <TrainerProfileFormClient initialUser={serialized as any} />
    </div>
  );
}
