import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CertificateViewClient from "./CertificateViewClient";

export default async function CertificateVerificationPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;

  // Search by either unique certificateNumber or DB id
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { certificateNumber: certificateId },
        { id: certificateId },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          level: true,
        },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  return (
    <CertificateViewClient
      certificate={{
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        issueDate: certificate.issueDate.toISOString(),
        qrCodeUrl: certificate.qrCodeUrl,
        user: {
          name: certificate.user.name,
          email: certificate.user.email,
        },
        course: {
          title: certificate.course.title,
          level: certificate.course.level,
        },
      }}
    />
  );
}

