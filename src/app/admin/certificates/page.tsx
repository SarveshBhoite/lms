import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminCertificatesClient from "./AdminCertificatesClient";

export default async function AdminCertificatesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const certificates = await prisma.certificate.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true, level: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  const formatted = certificates.map((c) => ({
    id: c.id,
    certificateNumber: c.certificateNumber,
    issueDate: c.issueDate.toISOString(),
    user: c.user,
    course: c.course,
  }));

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Certificate Registry & Verifications</h1>
        <p className="text-slate-500 text-sm mt-1">
          Audit tamper-proof certificates, search issued credentials, and access public QR verification endpoints.
        </p>
      </div>

      <AdminCertificatesClient initialCertificates={formatted} />
    </div>
  );
}

