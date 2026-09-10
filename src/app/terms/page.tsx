import Link from "next/link";
import { FileText, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | JVM LMS",
  description: "Terms and conditions governing the use of JVM LMS platform and applications.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col selection:bg-[#7C248C] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-10 w-auto object-contain" />
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-50 border border-purple-200 text-[#7C248C]">
              LMS Portal
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Banner */}
        <div className="p-8 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/30 shadow-xs space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" /> Legal & Terms
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Effective Date: March 1, 2026 • Last Updated: March 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the <strong>JVM Institute Learning Management System (LMS)</strong>, web portal, or mobile applications, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not access or use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> 2. User Accounts & Responsibilities
            </h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>You must maintain the confidentiality of your account password and security credentials.</li>
              <li>You are responsible for all activities that occur under your user profile.</li>
              <li>Accounts are issued for individual academic use only and may not be shared, transferred, or sold to third parties.</li>
              <li>JVM Institute reserves the right to suspend or terminate accounts that violate academic integrity standards or platform security rules.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> 3. Intellectual Property Rights
            </h2>
            <p>
              All course materials, video lessons, quizzes, documentation, diagrams, logos, and software code provided on the JVM Institute LMS are the proprietary intellectual property of JVM Institute or licensed content providers. You are granted a limited, non-exclusive license to view and complete courses for personal education. Unauthorized reproduction, distribution, recording, or public broadcast is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> 4. Live Classes & Code of Conduct
            </h2>
            <p>
              During live virtual classes and interactive cohort sessions:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>Students and instructors must maintain professional, respectful, and harassment-free conduct.</li>
              <li>Disruptive behavior or unapproved recording of fellow students is strictly prohibited.</li>
              <li>Attendance verification and excuse requests are subject to faculty verification.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> 5. Certificates & Academic Verification
            </h2>
            <p>
              Certificates of completion are issued upon successful fulfillment of course criteria, minimum required attendance turnout, passing grades on quizzes, and approved assignment evaluations. JVM Institute reserves the right to revoke credentials obtained through fraudulent means.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> 6. Limitation of Liability & Contact
            </h2>
            <p>
              Our services are provided on an "as is" and "as available" basis. For any inquiries regarding these terms:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <div><strong>Organization:</strong> JVM Institute</div>
              <div><strong>Contact Email:</strong> jmgrouponline@gmail.com</div>
              <div><strong>Platform:</strong> JVM Institute Learning Management System (LMS)</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-500 space-y-2">
          <p>© 2026 JVM Institute. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-slate-600 font-medium">
            <Link href="/" className="hover:text-[#7C248C]">Home</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#7C248C]">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="text-[#7C248C] font-bold">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
