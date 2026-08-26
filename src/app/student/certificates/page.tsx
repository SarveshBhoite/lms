import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Award, ExternalLink, Download, CheckCircle2 } from "lucide-react";

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const certificates = await prisma.certificate.findMany({
    where: { userId: studentId },
    include: {
      course: { select: { id: true, title: true, level: true, durationHours: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-600" /> Academic Certificates
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View and download your official course completion certificates and digital credentials.
          </p>
        </div>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {cert.certificateNumber}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-xl">{cert.course.title}</h3>
                <p className="text-xs text-slate-500 font-mono">Level: {cert.course.level} • Duration: {cert.course.durationHours} Hours</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Credential
                </span>

                <a
                  href={`/api/student/certificates/${cert.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> View Certificate
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Award className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No course completion certificates issued yet. Complete all lessons to earn certificates!</p>
        </div>
      )}
    </div>
  );
}
