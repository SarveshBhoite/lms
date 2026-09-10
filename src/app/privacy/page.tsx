import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | JVM LMS",
  description: "Official Privacy Policy for JVM LMS platform and mobile applications.",
};

export default function PrivacyPolicyPage() {
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
        <div className="p-8 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 shadow-xs space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Legal & Privacy
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Effective Date: March 1, 2026 • Last Updated: March 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> 1. Introduction
            </h2>
            <p>
              Welcome to <strong>JVM Institute Learning Management System (LMS)</strong> ("we", "our", or "us"). We provide an educational technology platform and related mobile applications (the "App") operated by JVM Institute. We are committed to protecting the privacy of students, faculty trainers, and administrators who use our services.
            </p>
            <p>
              This Privacy Policy explains what personal data we collect, why we collect it, how it is used and secured, and your rights regarding your data when using the JVM Institute web portal or mobile applications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> 2. Information We Collect
            </h2>
            <p>We collect information necessary to deliver educational courses, facilitate live classes, grade assignments, and verify certificates:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Account Credentials:</strong> Full Name, institutional or personal email address, and encrypted password hash.</li>
              <li><strong>Profile Information:</strong> Contact phone number, profile photograph / avatar, designation, and biography.</li>
              <li><strong>Academic Data:</strong> Course enrollments, cohort batch assignments, lesson progress, attendance records, assignment file submissions, and quiz performance metrics.</li>
              <li><strong>Third-Party OAuth Services:</strong> When you connect via Google OAuth (e.g. for Google Meet integration or sign-in), we receive your basic profile identifiers and authorized scopes strictly for scheduling and managing academic video sessions. We do not access, sell, or disclose personal Google Drive or email content.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> 3. How We Use Your Information
            </h2>
            <p>Your data is processed strictly for legitimate academic and administrative purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>To create and authenticate user accounts with role-based access control (Student, Trainer, Admin).</li>
              <li>To facilitate live interactive classes, record attendance percentages, and issue verified completion certificates.</li>
              <li>To enable trainers to evaluate student assignments, grade quizzes, and deliver academic feedback.</li>
              <li>To send essential institutional notifications regarding class schedules, deadlines, and security alerts.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> 4. Data Sharing & Third Parties
            </h2>
            <p>
              We do <strong>not</strong> sell, rent, or monetize your personal data. Data is shared strictly with authorized infrastructure providers necessary to operate the application:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Cloud Storage:</strong> Cloudinary for hosting user profile avatars and course content assets securely over SSL.</li>
              <li><strong>Database Hosting:</strong> Managed PostgreSQL infrastructure configured with encrypted-at-rest data storage.</li>
              <li><strong>Google API Services:</strong> Used strictly for user authentication and Google Meet scheduling in compliance with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-[#7C248C] underline font-medium">Google API Services User Data Policy</a>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> 5. Data Security & Retention
            </h2>
            <p>
              We employ industry-standard security safeguards including <strong>bcrypt password hashing</strong>, HTTPS/SSL transport layer security, cryptographically signed JSON Web Tokens (JWT), and Next.js Edge route guards.
            </p>
            <p>
              We retain your educational records as long as your account is active or as required by institutional credential accreditation guidelines. Users may request account deactivation or data removal by contacting our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C248C]" /> 6. Contact & Support Information
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our dedicated privacy and support team:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <div><strong>Organization:</strong> JVM Institute</div>
              <div><strong>Support & Consent Email:</strong> jmgrouponline@gmail.com</div>
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
            <Link href="/privacy" className="text-[#7C248C] font-bold">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#7C248C]">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
