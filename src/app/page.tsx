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
  Calendar,
  FileCheck,
  Database,
  Cpu,
  Brain,
  Bot,
  Clock,
} from "lucide-react";

import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#10162F] flex flex-col selection:bg-[#7C3AED] selection:text-white relative font-sans">
      {/* Ambient background glows with pastel lavender & pink tint */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[550px] bg-gradient-to-b from-[#F8F5FF] via-[#FDF2F8]/50 to-transparent blur-[80px] pointer-events-none -z-10" />
      <div className="absolute top-10 left-1/4 w-[600px] h-[350px] bg-[#4338CA]/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-1/4 w-[500px] h-[350px] bg-[#D41472]/5 blur-[120px] pointer-events-none -z-10" />

      {/* Modern JVM LMS Navbar */}
      <Navbar />

      {/* Hero Section with bg.jpg Background & 2-Column Responsive Layout */}
      <main className="flex-1">
        <section
          className="relative overflow-hidden pt-6 sm:pt-8 lg:pt-10 pb-6 min-h-[calc(100vh-78px)] lg:h-[calc(100vh-78px)] bg-cover bg-center lg:bg-[center_right] bg-no-repeat flex items-start"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        >

          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column - Text Content (Max 650px width) */}
              <div className="lg:col-span-7 xl:col-span-6 max-w-[650px] text-left space-y-4 lg:space-y-5">
                {/* 1. Small Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8F5FF] border border-[#4338CA]/20 text-[#4338CA] text-xs font-extrabold uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#D41472]" />
                  <span>JVM LMS • NEXT-GENERATION LEARNING MANAGEMENT SYSTEM</span>
                </div>

                {/* 2. Main Heading */}
                <h1 className="text-3xl sm:text-4xl lg:text-[48px] xl:text-[54px] font-extrabold tracking-tight text-[#10162F] leading-[1.05]">
                  Empowering Excellence{" "}
                  <span className="block mt-1 bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] bg-clip-text text-transparent">
                    Through JVM LMS
                  </span>
                </h1>

                {/* 3. Description below heading */}
                <p className="text-sm sm:text-base text-[#10162F]/85 leading-relaxed font-normal max-w-[600px]">
                  <strong className="text-[#10162F] font-semibold">JVM LMS</strong> is the official, enterprise-grade educational ecosystem built for learners, faculty, and administrators. Experience immersive HTML lessons, live Google Meet sessions, interactive quizzes, student cohort batches, and verifiable QR-coded certificates.
                </p>

                {/* 4 & 5. Primary and Secondary CTAs */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[12px] bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] text-white font-bold text-sm shadow-[0_8px_20px_-4px_rgba(67,56,202,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(212,20,114,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    <span>Access JVM LMS Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[12px] bg-white/90 border border-slate-200/90 text-[#10162F] font-bold text-sm hover:bg-white hover:border-[#4338CA]/30 hover:text-[#4338CA] transition-all shadow-xs backdrop-blur-sm active:scale-98"
                  >
                    <Play className="w-4 h-4 text-[#4338CA] fill-[#4338CA]" />
                    <span>Explore with Demo Login</span>
                  </Link>
                </div>

                {/* 6. Compact Statistics Row */}
                <div className="pt-10 ">
                  <div className="grid grid-cols-2 sm:flex sm:items-center sm:divide-x sm:divide-slate-200/80 gap-3 sm:gap-0">
                    <div className="sm:pr-5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F8F5FF] text-[#4338CA] flex items-center justify-center border border-[#4338CA]/10">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-base lg:text-lg font-extrabold text-[#10162F] leading-tight">10K+</div>
                        <div className="text-[11px] text-slate-500 font-medium">Active Learners</div>
                      </div>
                    </div>

                    <div className="sm:px-5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F8F5FF] text-[#4338CA] flex items-center justify-center border border-[#4338CA]/10">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-base lg:text-lg font-extrabold text-[#10162F] leading-tight">500+</div>
                        <div className="text-[11px] text-slate-500 font-medium">Courses</div>
                      </div>
                    </div>

                    <div className="sm:px-5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F8F5FF] text-[#4338CA] flex items-center justify-center border border-[#4338CA]/10">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-base lg:text-lg font-extrabold text-[#10162F] leading-tight">100+</div>
                        <div className="text-[11px] text-slate-500 font-medium">Expert Faculty</div>
                      </div>
                    </div>

                    <div className="sm:pl-5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F8F5FF] text-[#D41472] flex items-center justify-center border border-[#D41472]/10">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-base lg:text-lg font-extrabold text-[#10162F] leading-tight">95%</div>
                        <div className="text-[11px] text-slate-500 font-medium">Completion Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Spacer to keep girl & laptop artwork uncovered */}
              <div className="hidden lg:block lg:col-span-5 xl:col-span-6 pointer-events-none" />
            </div>

          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 border-t border-slate-200/80 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-purple-50 text-[#7C248C] border border-purple-200">
                JVM LMS Platform Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                Engineered for High-Performance Academic Excellence
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base">
                Discover why educators and students thrive using the JVM LMS ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white hover:border-purple-300 transition shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C248C]">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">HTML & Rich Media Tracks</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Interactive curriculum structuring with styled HTML code blocks, downloadable files, PDF presentations, and full-screen video players.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white hover:border-pink-300 transition shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#E01E6A]">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Automated Quiz Engine</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Timed assessments with auto-scoring, randomized question banks, passing thresholds, instant results, and faculty evaluation reviews.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white hover:border-blue-300 transition shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E2B88]">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Live Classes & Google Meet</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  One-click Google Meet integration for scheduling live cohort webinars, automatic join tracking, and attendance turnout logging.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white hover:border-emerald-300 transition shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Verifiable QR Certificates</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Tamper-proof completion credentials with public cryptographic verification URLs and instant QR scanning seals for student validation.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white hover:border-amber-300 transition shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cohorts & Batch Management</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Organize students into dedicated cohort batches, assign specialized trainers, supervise rosters, and export complete performance reports.
                </p>
              </div>

              <div className="glass-card p-7 rounded-3xl space-y-3 bg-white hover:border-purple-300 transition shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C248C]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Role-Based Access Control</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Cryptographically signed JWT sessions, bcrypt hashing, Next.js Edge Middleware route guards, and strict multi-role permission gating.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How JVM LMS Works */}
        <section className="py-20 bg-[#F8F5FF] relative border-t border-purple-100/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#4338CA]/20 text-[#4338CA] text-xs font-extrabold uppercase tracking-widest shadow-xs mb-3">
                <Zap className="w-3.5 h-3.5 text-[#D41472]" />
                <span>Seamless Learning Workflow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#10162F] tracking-tight">
                How <span className="bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] bg-clip-text text-transparent">JVM LMS</span> Works
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
                A simple journey from enrollment to certification.
              </p>
            </div>

            {/* Connected Timeline Container */}
            <div className="relative">
              {/* Desktop Horizontal Connecting Line (Purple -> Magenta Gradient) */}
              <div className="hidden lg:block absolute top-[32px] left-[calc(10%+24px)] right-[calc(10%+24px)] h-1 bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] rounded-full -z-0 opacity-80" />

              {/* Mobile Vertical Connecting Line */}
              <div className="block lg:hidden absolute top-8 bottom-8 left-[31px] w-1 bg-gradient-to-b from-[#4338CA] via-[#7C3AED] to-[#D41472] rounded-full -z-0 opacity-80" />

              {/* 5 Connected Steps Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
                {/* STEP 01 */}
                <div className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center">
                  <div className="relative shrink-0 mr-4 lg:mr-0 lg:mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#4338CA]/30 shadow-xs flex items-center justify-center text-[#4338CA] relative z-10">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="pt-1 lg:pt-0">
                    <h3 className="text-lg font-extrabold text-[#10162F]">
                      Enroll
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                      Choose your course and join your cohort.
                    </p>
                  </div>
                </div>

                {/* STEP 02 */}
                <div className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center">
                  <div className="relative shrink-0 mr-4 lg:mr-0 lg:mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#5B37D2]/30 shadow-xs flex items-center justify-center text-[#5B37D2] relative z-10">
                      <BookOpen className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="pt-1 lg:pt-0">
                    <h3 className="text-lg font-extrabold text-[#10162F]">
                      Learn
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                      Complete structured lessons and learning materials.
                    </p>
                  </div>
                </div>

                {/* STEP 03 */}
                <div className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center">
                  <div className="relative shrink-0 mr-4 lg:mr-0 lg:mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#7C3AED]/30 shadow-xs flex items-center justify-center text-[#7C3AED] relative z-10">
                      <Video className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="pt-1 lg:pt-0">
                    <h3 className="text-lg font-extrabold text-[#10162F]">
                      Live Classes
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                      Attend instructor-led Google Meet sessions.
                    </p>
                  </div>
                </div>

                {/* STEP 04 - VISUALLY PROMINENT */}
                <div className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center">
                  <div className="relative shrink-0 mr-4 lg:mr-0 lg:mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#D41472] border-2 border-purple-300 shadow-md flex items-center justify-center text-white relative z-10">
                      <FileCheck className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="pt-1 lg:pt-0 w-full">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] text-[10px] font-black uppercase tracking-wider mb-1">
                      Interactive Gateway
                    </div>
                    <h3 className="text-lg font-extrabold text-[#10162F]">
                      Quiz & Unlock
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal">
                      Complete quizzes and pass to unlock the next chapter.
                    </p>
                    
                    
                  </div>
                </div>

                {/* STEP 05 */}
                <div className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center">
                  <div className="relative shrink-0 mr-4 lg:mr-0 lg:mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#D41472]/30 shadow-xs flex items-center justify-center text-[#D41472] relative z-10">
                      <Award className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="pt-1 lg:pt-0">
                    <h3 className="text-lg font-extrabold text-[#10162F]">
                      Certificate
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                      Complete the course and earn a QR-verifiable certificate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Featured Courses */}
        <section className="py-16 sm:py-20 bg-white relative border-t border-slate-200/80">
          <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20">
                Industry-Aligned Learning Tracks
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#10162F] tracking-tight mt-3">
                Explore Our <span className="bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] bg-clip-text text-transparent">Featured Courses</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
                Learn in-demand technology skills through structured, practical, industry-focused programs.
              </p>
            </div>

            {/* All 6 Course Cards in 1 Line Without Scrolling (6 Columns Desktop, Compact Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              
              {/* Course 1: Data Engineering Course */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-[#4338CA]/30 transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4338CA] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Database className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 truncate">
                      Flagship
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#10162F] group-hover:text-[#4338CA] transition-colors leading-snug truncate" title="Data Engineering Course">
                    Data Engineering
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 truncate">
                    <Clock className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span>6 Months • Both</span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-600 leading-snug line-clamp-2">
                    Master end-to-end data pipelines, PySpark & cloud warehousing.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {["SQL", "Python", "PySpark", "AWS", "ETL"].map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#10162F] text-white text-[10px] font-bold hover:bg-[#4338CA] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-2 py-1.5 rounded-lg bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                  >
                    Enroll
                  </Link>
                </div>
              </div>

              {/* Course 2: Data Engineering with Gen AI */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-[#4338CA]/30 transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#D41472] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 truncate">
                      Flagship
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#10162F] group-hover:text-[#4338CA] transition-colors leading-snug truncate" title="Data Engineering with Gen AI">
                    DE with Gen AI
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 truncate">
                    <Clock className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span>6 Months • Both</span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-600 leading-snug line-clamp-2">
                    Combine modern data pipelines with generative AI & LLMs.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {["DE+GenAI", "LLMs", "RAG", "Agents"].map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#10162F] text-white text-[10px] font-bold hover:bg-[#4338CA] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-2 py-1.5 rounded-lg bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                  >
                    Enroll
                  </Link>
                </div>
              </div>

              {/* Course 3: Basic AI & Machine Learning */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-[#4338CA]/30 transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4338CA] to-[#5B37D2] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 truncate">
                      Beginner
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#10162F] group-hover:text-[#4338CA] transition-colors leading-snug truncate" title="Basic AI & Machine Learning">
                    Basic AI & ML
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 truncate">
                    <Clock className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span>1 Month • Beginner</span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-600 leading-snug line-clamp-2">
                    Build strong foundation in Python, stats & ML algorithms.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {["Python", "Pandas", "Stats", "EDA", "ML"].map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#10162F] text-white text-[10px] font-bold hover:bg-[#4338CA] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-2 py-1.5 rounded-lg bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                  >
                    Enroll
                  </Link>
                </div>
              </div>

              {/* Course 4: Advanced AI & Machine Learning */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-[#4338CA]/30 transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A82BB1] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 truncate">
                      Advanced
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#10162F] group-hover:text-[#4338CA] transition-colors leading-snug truncate" title="Advanced AI & Machine Learning">
                    Advanced AI & ML
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 truncate">
                    <Clock className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span>1 Month • Advanced</span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-600 leading-snug line-clamp-2">
                    Deep neural nets, PyTorch, vision, NLP & production MLOps.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {["Deep Learning", "PyTorch", "Vision", "NLP", "MLOps"].map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#10162F] text-white text-[10px] font-bold hover:bg-[#4338CA] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-2 py-1.5 rounded-lg bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                  >
                    Enroll
                  </Link>
                </div>
              </div>

              {/* Course 5: Claude AI */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-[#4338CA]/30 transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D41472] to-[#C21568] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 truncate">
                      Specialized
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#10162F] group-hover:text-[#4338CA] transition-colors leading-snug truncate" title="Claude AI">
                    Claude AI
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 truncate">
                    <Clock className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span>1 Month • Both</span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-600 leading-snug line-clamp-2">
                    Master Claude ecosystem, MCP protocol & AI agents.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {["Prompt Eng", "AI Agents", "MCP", "Claude API"].map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#10162F] text-white text-[10px] font-bold hover:bg-[#4338CA] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-2 py-1.5 rounded-lg bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                  >
                    Enroll
                  </Link>
                </div>
              </div>

              {/* Course 6: Gen AI */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-[#4338CA]/30 transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B37D2] to-[#D41472] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 truncate">
                      Popular
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#10162F] group-hover:text-[#4338CA] transition-colors leading-snug truncate" title="Gen AI">
                    Gen AI
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 truncate">
                    <Clock className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span>1 Month • Both</span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-600 leading-snug line-clamp-2">
                    ChatGPT, OpenAI APIs, CrewAI & RAG architectures.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {["ChatGPT", "LangChain", "CrewAI", "RAG"].map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex-1 inline-flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#10162F] text-white text-[10px] font-bold hover:bg-[#4338CA] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-2 py-1.5 rounded-lg bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                  >
                    Enroll
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/jvm_logo-bg.png" alt="JVM LMS Logo" className="h-8 w-auto object-contain" />
            <span className="font-black text-slate-900 text-sm">
              JVM <span className="jvm-gradient-text">LMS</span>
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-[#7C248C] transition font-medium">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-[#7C248C] transition font-medium">
                Terms of Service
              </Link>
            </div>
            <span>•</span>
            <p>© 2026 JVM LMS. All rights reserved. Built for Academic Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
