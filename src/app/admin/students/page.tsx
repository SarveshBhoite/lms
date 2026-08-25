import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentsClient from "./StudentsClient";

export default async function AdminStudentsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const [students, courses, batches] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
          orderBy: { enrolledAt: "desc" },
        },
        studentBatches: {
          include: {
            batch: { select: { id: true, name: true } },
          },
        },
        courseProgresses: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, courseId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates for Client Component props
  const serializedStudents = students.map((st) => ({
    ...st,
    createdAt: st.createdAt.toISOString(),
    updatedAt: st.updatedAt.toISOString(),
    lastLoginAt: st.lastLoginAt ? st.lastLoginAt.toISOString() : null,
    profile: st.profile
      ? {
          ...st.profile,
          createdAt: st.profile.createdAt.toISOString(),
          updatedAt: st.profile.updatedAt.toISOString(),
        }
      : null,
    enrollments: st.enrollments.map((e) => ({
      ...e,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    })),
    studentBatches: st.studentBatches.map((sb) => ({
      ...sb,
      joinedAt: sb.joinedAt.toISOString(),
    })),
    courseProgresses: st.courseProgresses.map((cp) => ({
      ...cp,
      completedAt: cp.completedAt ? cp.completedAt.toISOString() : null,
      updatedAt: cp.updatedAt.toISOString(),
    })),
  }));

  return (
    <StudentsClient
      initialStudents={serializedStudents as any}
      courses={courses}
      batches={batches}
    />
  );
}
