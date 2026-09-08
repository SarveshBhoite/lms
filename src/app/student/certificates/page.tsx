import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import StudentCertificatesClient, { StudentCertificateItem } from "./StudentCertificatesClient";

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const [user, certificates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true },
    }),
    prisma.certificate.findMany({
      where: { userId: studentId },
      include: {
        course: { select: { id: true, title: true, level: true, durationHours: true } },
      },
      orderBy: { issueDate: "desc" },
    }),
  ]);

  const studentName = user?.name || "Student";

  const serialized: StudentCertificateItem[] = certificates.map((cert) => ({
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issueDate.toISOString(),
    qrCodeUrl: cert.qrCodeUrl,
    studentName,
    course: {
      id: cert.course.id,
      title: cert.course.title,
      level: cert.course.level,
      durationHours: cert.course.durationHours,
    },
  }));

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Award className="w-3 h-3 text-amber-700" /> Official Accreditations
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic <span className="jvm-gradient-text">Certificates</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Inspect digital credentials, verify tamper-evident QR codes, and export formal diplomas.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {serialized.length} {serialized.length === 1 ? "Credential" : "Credentials"} Issued
          </span>
        </div>
      </div>

      <StudentCertificatesClient initialCertificates={serialized} />
    </div>
  );
}

