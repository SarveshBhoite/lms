import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Users,
  Award,
  Video,
  ShieldCheck,
  ArrowRight,
  Play,
  BarChart3,
  Layers,
  CheckCircle2,
  Lock,
  FileCode,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col selection:bg-[#7C248C] selection:text-white relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] ambient-glow-purple blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[350px] ambient-glow-blue blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-12 w-auto object-contain" />
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-50 border border-purple-200 text-[#7C248C]">
              LMS Portal
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-[#7C248C] transition px-3 sm:px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-black jvm-gradient-bg jvm-gradient-hover text-white px-5 py-2.5 rounded-xl shadow-md shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Student & Faculty Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#7C248C] text-xs font-bold uppercase tracking-wider mb-8 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#E01E6A]" />
              JVM Institute • Next-Gen Learning Management System
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.12]">
              Empowering Excellence Through{" "}
              <span className="jvm-gradient-text">
                Advanced Digital Education
              </span>
            </h1>

            <p className="mt-7 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              An enterprise-grade LMS built for JVM Institute learners and faculty. Experience rich HTML lesson tracks, interactive quizzes, live Google Meet sessions, batch cohort scheduling, and verifiable QR-coded certificates.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-900/25 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Access Portal Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm sm:text-base hover:bg-slate-50 hover:border-purple-300 hover:text-[#7C248C] transition-all shadow-xs"
              >
                <Play className="w-4 h-4 text-[#7C248C] fill-[#7C248C]" /> Explore with Demo Logins
              </Link>
            </div>

            {/* Quick Demo Credentials Panel */}
            <div className="mt-14 max-w-4xl mx-auto p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#7C248C]" />
                  <span className="text-xs uppercase font-bold text-slate-700 tracking-wider">
                    JVM Institute Demo Logins
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Default Password: <strong className="text-slate-900">Password123!</strong> (Admin: <strong className="text-slate-900">12345678</strong>)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 hover:border-purple-300 transition">
                  <div className="text-xs font-bold text-[#7C248C] flex items-center justify-between">
                    <span>👑 Super Admin</span>
                    <span className="text-[10px] font-mono text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">12345678</span>
                  </div>
                  <div className="text-xs text-slate-800 font-mono mt-2 truncate font-semibold">rajb81008@gmail.com</div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 transition">
                  <div className="text-xs font-bold text-blue-700 flex items-center justify-between">
                    <span>👨‍🏫 Lead Trainer</span>
                    <span className="text-[10px] font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">Password123!</span>
                  </div>
                  <div className="text-xs text-slate-800 font-mono mt-2 truncate font-semibold">trainer@institute.edu</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 transition">
                  <div className="text-xs font-bold text-emerald-700 flex items-center justify-between">
                    <span>👨‍🎓 Active Student</span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">Password123!</span>
                  </div>
                  <div className="text-xs text-slate-800 font-mono mt-2 truncate font-semibold">student@institute.edu</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-purple-50 text-[#7C248C] border border-purple-200">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                Engineered for Academic Rigor & Seamless Learning
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base">
                An all-in-one educational platform designed specifically for JVM Institute workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C248C]">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">HTML & Rich Media Lessons</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Interactive curriculum structuring with HTML code blocks, styled notes, downloadable source code, PDF slide decks, and video resources.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#E01E6A]">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Automated Quiz Engine</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Timed assessments with instant grading, question banks, multiple-choice scoring, pass criteria, and detailed faculty reviews.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E2B88]">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Live Classes & Google Meet</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Schedule live webinars directly within cohorts, track real-time join logs, and aggregate batch attendance rates seamlessly.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Verifiable QR Certificates</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Tamper-proof completion credentials with public cryptographic verification endpoints and instant QR scanning seals.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cohorts & Batch Management</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Group students into academic batches, assign trainers, manage enrollment lifecycles, and export student progress reports.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C248C]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Role-Based Access Control</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Cryptographically signed JWT sessions, bcrypt hashing, Next.js Edge Middleware route guards, and strict permission gating.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-slate-800 text-sm">JVM Institute Learning Management System</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 JVM Institute. All rights reserved. Built for Academic Excellence.
          </p>
        </div>
      </footer>
    </div>
  );
}

