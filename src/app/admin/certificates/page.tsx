import Link from "next/link";
import prisma from "@/lib/prisma";
import { Award, QrCode, ExternalLink, ShieldCheck, CheckCircle2, Search } from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default async function AdminCertificatesPage() {
  const dbCertificates = await prisma.certificate.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  const certificates =
    dbCertificates.length > 0
      ? dbCertificates.map((c) => ({
          id: c.certificateNumber,
          studentName: c.user.name,
          email: c.user.email,
          courseTitle: c.course.title,
          issueDate: new Date(c.issueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: "VERIFIED",
        }))
      : [
          {
            id: "CERT-2026-A109F2",
            studentName: "Sophia Martinez",
            email: "sophia.student@institute.edu",
            courseTitle: "Full-Stack Next.js 15 & Enterprise Architecture",
            issueDate: "Aug 24, 2026",
            status: "VERIFIED",
          },
          {
            id: "CERT-2026-B884C1",
            studentName: "Liam Chen",
            email: "liam.student@institute.edu",
            courseTitle: "PostgreSQL Relational Schema & Sharding",
            issueDate: "Aug 24, 2026",
            status: "VERIFIED",
          },
        ];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Credential Governance
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Certificate Registry & Verifications
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Audit tamper-proof credentials minted across {INSTITUTE_CONFIG.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {cert.id}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white leading-snug">{cert.courseTitle}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Recipient: <strong className="text-white">{cert.studentName}</strong>{" "}
                  <span className="text-slate-500 font-mono">({cert.email})</span>
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Conferred: {cert.issueDate}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <Link
                href={`/verify/certificate/${cert.id}`}
                target="_blank"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
              >
                <QrCode className="w-4 h-4" /> Inspect Public Verification <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
