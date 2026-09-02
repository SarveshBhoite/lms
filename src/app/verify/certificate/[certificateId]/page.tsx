import Link from "next/link";
import prisma from "@/lib/prisma";
import { Award, ShieldCheck, CheckCircle2, XCircle, Home, ExternalLink } from "lucide-react";
import CertificateView from "@/components/certificates/CertificateView";

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;

  // Search by certificateNumber or cuid id
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [{ certificateNumber: certificateId }, { id: certificateId }],
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
          durationHours: true,
          trainer: { select: { name: true } },
        },
      },
    },
  });

  const isVerified = Boolean(certificate);
  const metadata: any = certificate?.metadata || {};

  const studentName = metadata.studentName || certificate?.user.name || "Student Recipient";
  const courseTitle = metadata.courseTitle || certificate?.course.title || "Course Program";
  const batchName = metadata.batchName || "Data Engineering Batch A";
  const trainerName = metadata.trainerName || certificate?.course.trainer?.name || "JVM Institute Faculty";
  const issueDateFormatted = metadata.issueDate
    ? metadata.issueDate
    : certificate
    ? new Date(certificate.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const formattedCert = certificate
    ? {
        ...certificate,
        metadata: metadata || undefined,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 relative selection:bg-purple-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-8 relative z-10 my-8">
        {/* Navigation back */}
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <Home className="w-4 h-4" /> Back to LMS Portal
          </Link>
          <span className="text-xs font-mono text-purple-400 font-bold bg-purple-950/60 border border-purple-800/50 px-3 py-1 rounded-full">
            JVM Institute Credentials
          </span>
        </div>

        {certificate && formattedCert ? (
          <>
            {/* Verified Status Banner */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> Official Academic Certificate Verified
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">JVM Institute Private Limited</h1>
              <p className="text-slate-400 text-xs max-w-lg mx-auto">
                This digital credential is officially issued and verified on the JVM Institute LMS registry.
              </p>
            </div>

            {/* Verification Metadata Summary */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-semibold uppercase">Certificate ID:</span>
                <span className="font-mono text-purple-400 font-bold">{formattedCert.certificateNumber}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-semibold uppercase">Student Recipient:</span>
                <span className="font-bold text-white">{studentName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-semibold uppercase">Course Program:</span>
                <span className="font-semibold text-purple-300 max-w-[200px] truncate">{courseTitle}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-semibold uppercase">Batch:</span>
                <span className="font-semibold text-slate-200">{batchName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2 sm:border-b-0">
                <span className="text-slate-400 font-semibold uppercase">Trainer:</span>
                <span className="font-semibold text-slate-200">{trainerName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold uppercase">Issue Date:</span>
                <span className="text-slate-200 font-semibold">{issueDateFormatted}</span>
              </div>
            </div>

            {/* Visual Certificate Render */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-center mb-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Official Certificate Rendering</h3>
              </div>
              <CertificateView certificate={formattedCert} showActions={true} />
            </div>
          </>
        ) : (
          /* Unverified / Invalid Certificate State */
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <XCircle className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Invalid or Unverified Certificate</h1>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              No official certificate matching record ID <span className="font-mono text-rose-400 font-bold">{certificateId}</span> was found in the JVM Institute registry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
