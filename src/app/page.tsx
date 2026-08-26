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
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] ambient-glow-indigo blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] ambient-glow-cyan blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#06080F]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
                {INSTITUTE_CONFIG.shortName}
              </div>
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest font-mono">
                {INSTITUTE_CONFIG.portals.student.badge}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition px-3 sm:px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/student/courses"
              className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Catalog
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 sm:pt-20 pb-24 sm:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 sm:mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {INSTITUTE_CONFIG.tagline}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1] sm:leading-[1.08]">
              Where Academic Mastery Meets{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300">
                Precision Intelligence
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
              {INSTITUTE_CONFIG.description}
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
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

            {/* Quick Multi-Role Pre-Seeded Accounts Panel */}
            <div className="mt-14 sm:mt-16 max-w-4xl mx-auto p-5 sm:p-6 rounded-3xl glass-panel text-left space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" /> Multi-Role Demo Access Credentials
                </span>
                <span className="text-xs text-indigo-300 font-mono">
                  Default Password: <strong className="text-white">Password123!</strong> (Admin: <strong className="text-white">123</strong>)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/login"
                  className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 hover:border-rose-500/50 transition group"
                >
                  <div className="text-xs font-bold text-rose-400 flex items-center justify-between">
                    <span>Super Admin</span>
                    <span className="text-[10px] font-mono text-slate-400">Pass: 123</span>
                  </div>
                  <div className="text-xs text-slate-200 font-mono mt-1 truncate">sulagadleaishwarya@gmail.com</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    Control Center <ArrowRight className="w-3 h-3 text-rose-400" />
                  </div>
                </Link>

                <Link
                  href="/login"
                  className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20 hover:border-amber-500/50 transition group"
                >
                  <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                    <span>Faculty Trainer</span>
                    <span className="text-[10px] font-mono text-slate-400">Pass: Password123!</span>
                  </div>
                  <div className="text-xs text-slate-200 font-mono mt-1 truncate">trainer@institute.edu</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    Faculty Studio <ArrowRight className="w-3 h-3 text-amber-400" />
                  </div>
                </Link>

                <Link
                  href="/login"
                  className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 hover:border-emerald-500/50 transition group"
                >
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span>Enrolled Student</span>
                    <span className="text-[10px] font-mono text-slate-400">Pass: Password123!</span>
                  </div>
                  <div className="text-xs text-slate-200 font-mono mt-1 truncate">sophia.student@institute.edu</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    Student Space <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 sm:py-24 border-t border-slate-800/60 bg-slate-950/40 relative">
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
            <span className="font-bold text-white">{INSTITUTE_CONFIG.name}</span>
          </div>
          <p className="text-xs text-slate-400 text-center sm:text-right">
            © {INSTITUTE_CONFIG.establishedYear} {INSTITUTE_CONFIG.shortName}. {INSTITUTE_CONFIG.accreditation}.
          </p>
        </div>
      </footer>
    </div>
  );
}

