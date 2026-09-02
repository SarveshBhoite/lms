import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminCertificatesClient from "./AdminCertificatesClient";

export default async function AdminCertificatesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const certificates = await prisma.certificate.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { phone: true, avatarUrl: true } },
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          durationHours: true,
          trainer: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const courses = await prisma.course.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const batches = await prisma.batch.findMany({
    select: { id: true, name: true, courseId: true },
    orderBy: { name: "asc" },
  });

  const formattedCertificates = certificates.map((cert) => ({
    ...cert,
    metadata: (cert.metadata as any) || undefined,
  }));

  return (
    <AdminCertificatesClient
      initialCertificates={formattedCertificates}
      courses={courses}
      batches={batches}
    />
  );
}
