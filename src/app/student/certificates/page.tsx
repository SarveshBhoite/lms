import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import StudentCertificatesClient from "./StudentCertificatesClient";

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const certificates = await prisma.certificate.findMany({
    where: { userId: studentId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          durationHours: true,
          trainer: { select: { name: true } },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const formattedCertificates = certificates.map((cert) => ({
    ...cert,
    metadata: (cert.metadata as any) || undefined,
  }));

  return (
    <StudentCertificatesClient
      initialCertificates={formattedCertificates}
      studentName={session.name}
    />
  );
}
