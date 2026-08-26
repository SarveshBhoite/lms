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

  return <StudentProfileClient initialStudent={student as any} currentUserId={session.userId} />;
}
