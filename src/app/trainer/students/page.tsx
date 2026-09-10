import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerStudentsClient, { StudentListItem, FilterOption } from "./TrainerStudentsClient";

export default async function TrainerStudentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

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
      orderBy: { title: "asc" },
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
      orderBy: { name: "asc" },
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

  const rawStudents = await prisma.user.findMany({
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
        select: {
          course: { select: { title: true } },
          batch: { select: { name: true } },
          status: true,
        },
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
        select: {
          feedback: { select: { marksAwarded: true } },
          assignment: { select: { totalMarks: true } },
        },
      },
      attendances: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const students: StudentListItem[] = rawStudents.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  const courseOptions: FilterOption[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  const batchOptions: FilterOption[] = batches.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  return (
    <TrainerStudentsClient
      initialStudents={students}
      courses={courseOptions}
      batches={batchOptions}
    />
  );
}
