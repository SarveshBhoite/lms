import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminCertificatesClient from "./AdminCertificatesClient";

export default async function AdminCertificatesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const [certificates, courses] = await Promise.all([
    prisma.certificate.findMany({
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
            slug: true,
            level: true,
            durationHours: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true, level: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const formatted = certificates.map((c) => ({
    id: c.id,
    certificateNumber: c.certificateNumber,
    issueDate: c.issueDate.toISOString(),
    qrCodeUrl: c.qrCodeUrl,
    user: c.user,
    course: c.course,
  }));

  return (
    <AdminCertificatesClient
      initialCertificates={formatted as any}
      courses={courses}
    />
  );
}

