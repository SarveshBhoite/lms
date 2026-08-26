import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import StudentAssignmentClient from "./StudentAssignmentClient";

export default async function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id: assignmentId } = await params;
  const studentId = session.userId;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: { select: { id: true, title: true } },
      submissions: {
        where: { userId: studentId },
        include: {
          feedback: { include: { trainer: { select: { name: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  return <StudentAssignmentClient initialAssignment={assignment as any} currentUserId={session.userId} />;
}
