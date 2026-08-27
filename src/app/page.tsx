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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] ambient-glow-indigo blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] ambient-glow-cyan blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-12 w-auto object-contain" />
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-100 text-[#7C248C]">
              LMS Portal
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 transition px-3 sm:px-4 py-2"
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
        <section className="relative overflow-hidden pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              State of the Art Academic Architecture
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
              Where Academic Mastery Meets{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300">
                Precision Intelligence
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
              An enterprise-grade LMS engineered with Next.js, Prisma, Neon PostgreSQL, and cryptographic RBAC. Experience seamless course streams, live Google Meet sessions, auto-evaluating quizzes, and verifiable QR certificates.
            </p>

            {/* Hero CTAs */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/student/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all"
              >
                Start Learning Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 font-bold text-base hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md"
              >
                <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" /> Sign In with Demo Account
              </Link>
            </div>

            {/* Quick Demo Credentials Panel */}
            <div className="mt-16 max-w-3xl mx-auto p-5 rounded-3xl glass-panel text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Pre-Seeded Production Accounts
                </span>
                <span className="text-xs text-indigo-400 font-mono">
                  Default Password: <strong className="text-white">Password123!</strong> (Admin: <strong className="text-white">123</strong>)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/20">
                  <div className="text-xs font-bold text-rose-400 flex items-center justify-between">
                    <span>Super Admin</span>
                    <span className="text-[10px] font-mono text-slate-400">Pass: 12345678</span>
                  </div>
                  <div className="text-xs text-slate-200 font-mono mt-1 truncate">rajb81008@gmail.com</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/20">
                  <div className="text-xs font-bold text-amber-400">Lead Trainer</div>
                  <div className="text-xs text-slate-200 font-mono mt-1 truncate">trainer@institute.edu</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
                  <div className="text-xs font-bold text-emerald-400">Enrolled Student</div>
                  <div className="text-xs text-slate-200 font-mono mt-1 truncate">student@institute.edu</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 border-t border-slate-800/60 bg-slate-950/40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Architected for Academic Rigor
              </h2>
              <p className="mt-4 text-slate-400 text-base">
                Everything required to operate an institution-grade learning ecosystem from day one.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Hierarchical Course Tracks</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Deeply nested syllabus architecture supporting modules, streaming videos, source code files, notes, and downloadable assets.
                </p>
              </div>

              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Automated Quiz Engine</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Timed multiple-choice assessments with immediate scoring algorithms, question pools, and detailed faculty feedback.
                </p>
              </div>

              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Live Classes & Google Meet</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Schedule live webinars directly within cohorts, track real-time join logs, and aggregate batch attendance rates.
                </p>
              </div>

              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Verifiable QR Certificates</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Tamper-proof completion credentials with public cryptographic verification endpoints and instant QR scanning seals.
                </p>
              </div>

              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Cohorts & Batch Management</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Group students into academic batches, assign trainers, manage enrollment lifecycles, and export Excel reports.
                </p>
              </div>

              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Role-Based Access Control</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Cryptographically signed JWT sessions, bcrypt hashing, Next.js Edge Middleware route guards, and granular permission gates.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-[#06080F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-white">EduPulse Learning Management System</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 EduPulse Institute of Technology. Production-Ready Academic Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
