"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Layers,
  BookOpen,
  Calendar,
  Award,
  FileCheck,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  Search,
  CheckCircle2,
  TrendingUp,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  Loader2,
  Video,
  FileSpreadsheet,
  Check,
  X,
  Sparkles,
  Info,
} from "lucide-react";

interface ReportSummary {
  totalStudents: number;
  totalBatches: number;
  totalCourses: number;
  avgCourseProgress: number;
  avgAttendance: number;
  avgQuizScore: number;
  avgAssignmentScore: number;
  atRiskStudentsCount: number;
  pendingEvaluationsCount: number;
}

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  batchName: string;
  batchId: string | null;
  courseTitle: string;
  courseId: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  avgQuizScore: number;
  avgAssignmentScore: number;
  attendancePercent: number;
  lastActive: string;
  daysInactive: number;
  status: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskReason: string;
  certificateEligible: boolean;
}

interface QuizRecord {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  totalStudentsEnrolled: number;
  totalAttempts: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  failRate: number;
  passingMarks: number;
  questionsCount: number;
}

interface AssignmentRecord {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  deadline: string;
  totalStudents: number;
  submittedCount: number;
  pendingSubmissionCount: number;
  evaluatedCount: number;
  pendingEvalCount: number;
  avgMarks: number;
  maxMarks: number;
  minMarks: number;
  totalMarks: number;
}

interface LiveClassRecord {
  id: string;
  title: string;
  batchName: string;
  scheduledDate: string;
  scheduledTime: string;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendancePercent: number;
  recordingAvailable: boolean;
}

interface BatchRecord {
  id: string;
  name: string;
  courseTitle: string;
  totalStudents: number;
  avgProgress: number;
  avgAttendance: number;
  avgQuiz: number;
  avgAssignment: number;
  overallPerformance: number;
  completionRate: number;
}

type TabType =
  | "OVERVIEW"
  | "STUDENT_PROGRESS"
  | "ATTENDANCE"
  | "QUIZZES"
  | "ASSIGNMENTS"
  | "BATCHES"
  | "AT_RISK"
  | "LIVE_CLASSES"
  | "ENGAGEMENT"
  | "CERTIFICATES"
  | "EXPORTS";

export default function TrainerReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  // Filter States
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("THIS_MONTH");

  // Data States
  const [summary, setSummary] = useState<ReportSummary>({
    totalStudents: 0,
    totalBatches: 0,
    totalCourses: 0,
    avgCourseProgress: 0,
    avgAttendance: 0,
    avgQuizScore: 0,
    avgAssignmentScore: 0,
    atRiskStudentsCount: 0,
    pendingEvaluationsCount: 0,
  });
  const [coursesList, setCoursesList] = useState<{ id: string; title: string }[]>([]);
  const [batchesList, setBatchesList] = useState<{ id: string; name: string }[]>([]);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [atRiskList, setAtRiskList] = useState<StudentRecord[]>([]);

  const [exporting, setExporting] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = `/api/trainer/reports?courseId=${selectedCourse}&batchId=${selectedBatch}&dateRange=${dateRange}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setCoursesList(data.filters.courses || []);
        setBatchesList(data.filters.batches || []);
        setStudents(data.reports.students || []);
        setQuizzes(data.reports.quizzes || []);
        setAssignments(data.reports.assignments || []);
        setLiveClasses(data.reports.liveClasses || []);
        setBatches(data.reports.batches || []);
        setAtRiskList(data.reports.atRisk || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCourse, selectedBatch, dateRange]);

  // Client-side student filtering with search
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Export CSV Helper
  const handleExportCSV = (reportType: string, filename: string) => {
    setExporting(reportType);

    let csvContent = "";

    if (reportType === "STUDENT_PROGRESS") {
      csvContent =
        "Name,Email,Course,Batch,Progress %,Completed Lessons,Quiz Avg,Assignment Avg,Attendance %,Status\n" +
        filteredStudents
          .map(
            (s) =>
              `"${s.name}","${s.email}","${s.courseTitle}","${s.batchName}",${s.progressPercent}%,${s.completedLessons}/${s.totalLessons},${s.avgQuizScore}%,${s.avgAssignmentScore}%,${s.attendancePercent}%,"${s.status}"`
          )
          .join("\n");
    } else if (reportType === "ATTENDANCE") {
      csvContent =
        "Student Name,Email,Batch,Attendance %,Status,Last Active\n" +
        filteredStudents
          .map(
            (s) =>
              `"${s.name}","${s.email}","${s.batchName}",${s.attendancePercent}%,"${s.attendancePercent >= 85 ? "Good" : s.attendancePercent >= 75 ? "Warning" : "At Risk"}","${s.lastActive}"`
          )
          .join("\n");
    } else if (reportType === "QUIZZES") {
      csvContent =
        "Quiz Title,Course,Total Attempts,Average Score %,Max Score %,Pass Rate %,Passing Marks\n" +
        quizzes
          .map(
            (q) =>
              `"${q.title}","${q.courseTitle}",${q.totalAttempts},${q.avgScore}%,${q.maxScore}%,${q.passRate}%,${q.passingMarks}`
          )
          .join("\n");
    } else if (reportType === "ASSIGNMENTS") {
      csvContent =
        "Assignment Title,Course,Deadline,Submitted,Evaluated,Pending Eval,Average Marks,Total Marks\n" +
        assignments
          .map(
            (a) =>
              `"${a.title}","${a.courseTitle}","${a.deadline}",${a.submittedCount},${a.evaluatedCount},${a.pendingEvalCount},${a.avgMarks},${a.totalMarks}`
          )
          .join("\n");
    } else if (reportType === "BATCHES") {
      csvContent =
        "Batch Name,Course,Enrolled Students,Avg Progress %,Avg Attendance %,Avg Quiz %,Avg Assignment %,Overall Performance\n" +
        batches
          .map(
            (b) =>
              `"${b.name}","${b.courseTitle}",${b.totalStudents},${b.avgProgress}%,${b.avgAttendance}%,${b.avgQuiz}%,${b.avgAssignment}%,${b.overallPerformance}%`
          )
          .join("\n");
    } else if (reportType === "AT_RISK") {
      csvContent =
        "Student Name,Email,Course,Batch,Risk Level,Progress %,Attendance %,Quiz Avg,Risk Diagnostics\n" +
        atRiskList
          .map(
            (s) =>
              `"${s.name}","${s.email}","${s.courseTitle}","${s.batchName}","${s.riskLevel}",${s.progressPercent}%,${s.attendancePercent}%,${s.avgQuizScore}%,"${s.riskReason}"`
          )
          .join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setExporting(null), 1000);
  };

  const navItems: { id: TabType; label: string; icon: any }[] = [
    { id: "OVERVIEW", label: "Overview", icon: BarChart3 },
    { id: "STUDENT_PROGRESS", label: "Student Progress", icon: Users },
    { id: "ATTENDANCE", label: "Attendance", icon: Calendar },
    { id: "QUIZZES", label: "Quiz Performance", icon: Award },
    { id: "ASSIGNMENTS", label: "Assignment Performance", icon: FileCheck },
    { id: "BATCHES", label: "Batch Performance", icon: Layers },
    { id: "AT_RISK", label: "At-Risk Students", icon: AlertTriangle },
    { id: "LIVE_CLASSES", label: "Live Class Reports", icon: Video },
    { id: "ENGAGEMENT", label: "Student Engagement", icon: TrendingUp },
    { id: "CERTIFICATES", label: "Certificate Eligibility", icon: GraduationCap },
    { id: "EXPORTS", label: "Export Reports", icon: FileSpreadsheet },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> Faculty Academic Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reports & Learning Analytics
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time performance analytics, participation matrices, quiz diagnostics, and cohort progress metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <button
            onClick={() => handleExportCSV("STUDENT_PROGRESS", "trainer_academic_progress")}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Quick CSV Export
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono font-bold uppercase text-[11px]">
          <Filter className="w-4 h-4 text-amber-400" /> Filters:
        </div>

        {/* Course Filter */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans"
          >
            <option value="ALL">All Assigned Courses</option>
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Filter */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans"
          >
            <option value="ALL">All Cohort Batches</option>
            {batchesList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="w-40">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans font-mono"
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or course..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-sans"
          />
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-mono flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
          Aggregating real-time academic intelligence...
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-8">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" /> Assigned Students
                  </div>
                  <div className="text-2xl font-black text-white font-mono">{summary.totalStudents}</div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Avg Progress
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{summary.avgCourseProgress}%</div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Avg Attendance
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{summary.avgAttendance}%</div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-400" /> Avg Quiz Score
                  </div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{summary.avgQuizScore}%</div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> At-Risk Scholars
                  </div>
                  <div className="text-2xl font-black text-rose-400 font-mono">{summary.atRiskStudentsCount}</div>
                </div>
              </div>

              {/* Visual Performance Charts & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Completion Distribution */}
                <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Course Progress Breakdown
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Total {students.length} Learners</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { label: "Completed (100%)", count: students.filter((s) => s.progressPercent === 100).length, color: "bg-emerald-500" },
                      { label: "On Track (70% - 99%)", count: students.filter((s) => s.progressPercent >= 70 && s.progressPercent < 100).length, color: "bg-cyan-500" },
                      { label: "Moderate (40% - 69%)", count: students.filter((s) => s.progressPercent >= 40 && s.progressPercent < 70).length, color: "bg-amber-500" },
                      { label: "Needs Attention (< 40%)", count: students.filter((s) => s.progressPercent < 40).length, color: "bg-rose-500" },
                    ].map((item, idx) => {
                      const percent = students.length > 0 ? Math.round((item.count / students.length) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="text-slate-400">
                              {item.count} students ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cohort Attendance Distribution */}
                <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" /> Attendance Compliance Matrix
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400">{summary.avgAttendance}% Cohort Avg</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { label: "Green Zone (85%+)", count: students.filter((s) => s.attendancePercent >= 85).length, color: "bg-emerald-500" },
                      { label: "Warning Zone (75% - 84%)", count: students.filter((s) => s.attendancePercent >= 75 && s.attendancePercent < 85).length, color: "bg-amber-500" },
                      { label: "At Risk Zone (< 75%)", count: students.filter((s) => s.attendancePercent < 75).length, color: "bg-rose-500" },
                    ].map((item, idx) => {
                      const percent = students.length > 0 ? Math.round((item.count / students.length) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="text-slate-400">
                              {item.count} scholars ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Batch Comparison Preview */}
              <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> Assigned Batches Performance Comparison
                  </h3>
                  <button
                    onClick={() => setActiveTab("BATCHES")}
                    className="text-xs text-amber-400 hover:text-white font-mono flex items-center gap-1"
                  >
                    View All Batches <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {batches.map((b) => (
                    <div key={b.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="font-bold text-white text-sm truncate">{b.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{b.courseTitle}</div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Progress:</span>
                          <span className="text-white font-bold">{b.avgProgress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Attendance:</span>
                          <span className="text-amber-400 font-bold">{b.avgAttendance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Quiz Avg:</span>
                          <span className="text-purple-400 font-bold">{b.avgQuiz}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT PROGRESS REPORT */}
          {activeTab === "STUDENT_PROGRESS" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Student Academic Progress Ledger</h3>
                  <p className="text-xs text-slate-400">Individual completion rates, quiz averages, and milestone scores.</p>
                </div>
                <button
                  onClick={() => handleExportCSV("STUDENT_PROGRESS", "student_progress_ledger")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Ledger
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Batch / Course</th>
                      <th className="p-3.5">Overall Progress</th>
                      <th className="p-3.5">Lessons Completed</th>
                      <th className="p-3.5">Quiz Avg</th>
                      <th className="p-3.5">Assignment Avg</th>
                      <th className="p-3.5">Attendance</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id || `${s.email}-${s.batchName}-${idx}`} className="hover:bg-slate-900/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-white font-semibold">{s.batchName}</div>
                          <div className="text-[11px] text-amber-400/80 font-mono">{s.courseTitle}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white">{s.progressPercent}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.progressPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {s.completedLessons} / {s.totalLessons}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-purple-300">{s.avgQuizScore}%</td>
                        <td className="p-3.5 font-mono font-bold text-indigo-300">{s.avgAssignmentScore}%</td>
                        <td className="p-3.5 font-mono font-bold text-amber-300">{s.attendancePercent}%</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                              s.status === "Completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : s.status === "At Risk"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : s.status === "Needs Attention"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE REPORT */}
          {activeTab === "ATTENDANCE" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Live Attendance & Compliance Register</h3>
                  <p className="text-xs text-slate-400">Class presence, late arrivals, and absence thresholds.</p>
                </div>
                <button
                  onClick={() => handleExportCSV("ATTENDANCE", "attendance_register")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Attendance
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Cohort Batch</th>
                      <th className="p-3.5">Attendance Compliance</th>
                      <th className="p-3.5">Last Attended Date</th>
                      <th className="p-3.5">Status Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{s.batchName}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white">{s.attendancePercent}%</span>
                            <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.attendancePercent >= 85
                                    ? "bg-emerald-500"
                                    : s.attendancePercent >= 75
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${s.attendancePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{s.lastActive}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                              s.attendancePercent >= 85
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : s.attendancePercent >= 75
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {s.attendancePercent >= 85 ? "Green (85%+)" : s.attendancePercent >= 75 ? "Warning (75-84%)" : "At Risk (<75%)"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUIZ PERFORMANCE REPORT */}
          {activeTab === "QUIZZES" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Quiz & Assessment Performance</h3>
                  <p className="text-xs text-slate-400">Pass rates, average scores, and question difficulty breakdown.</p>
                </div>
                <button
                  onClick={() => handleExportCSV("QUIZZES", "quiz_performance_report")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Quiz Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((q) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{q.title}</h4>
                        <span className="text-[11px] text-amber-400 font-mono">Course: {q.courseTitle}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[10px] font-bold">
                        {q.questionsCount} Questions
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Avg Score</span>
                        <strong className="text-purple-400 text-sm">{q.avgScore}%</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Pass Rate</span>
                        <strong className="text-emerald-400 text-sm">{q.passRate}%</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Attempts</span>
                        <strong className="text-white text-sm">{q.totalAttempts}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGNMENT PERFORMANCE REPORT */}
          {activeTab === "ASSIGNMENTS" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Assignment & Milestone Performance</h3>
                  <p className="text-xs text-slate-400">Deliverable submissions, pending grading evaluations, and average score distributions.</p>
                </div>
                <button
                  onClick={() => handleExportCSV("ASSIGNMENTS", "assignment_performance_report")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Assignment Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{a.title}</h4>
                        <span className="text-[11px] text-indigo-400 font-mono">Course: {a.courseTitle}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">Deadline: {a.deadline}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Submitted</span>
                        <strong className="text-white text-xs">{a.submittedCount}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Evaluated</span>
                        <strong className="text-emerald-400 text-xs">{a.evaluatedCount}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Pending</span>
                        <strong className="text-amber-400 text-xs">{a.pendingEvalCount}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Avg Marks</span>
                        <strong className="text-indigo-400 text-xs">{a.avgMarks}/{a.totalMarks}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: BATCH PERFORMANCE REPORT */}
          {activeTab === "BATCHES" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Cohort Batch Analytics</h3>
                  <p className="text-xs text-slate-400">Cohort completion rates and aggregate learning metrics.</p>
                </div>
                <button
                  onClick={() => handleExportCSV("BATCHES", "batch_performance_report")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Batch Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {batches.map((b) => (
                  <div key={b.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="font-extrabold text-base text-white">{b.name}</h4>
                    <p className="text-xs text-amber-400 font-mono">{b.courseTitle}</p>

                    <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Scholars:</span>
                        <span className="text-white font-bold">{b.totalStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Course Progress:</span>
                        <span className="text-emerald-400 font-bold">{b.avgProgress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Attendance Rate:</span>
                        <span className="text-amber-400 font-bold">{b.avgAttendance}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Overall Score:</span>
                        <span className="text-cyan-400 font-bold">{b.overallPerformance}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AT-RISK STUDENTS REPORT */}
          {activeTab === "AT_RISK" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" /> At-Risk Scholars Early-Warning Radar
                  </h3>
                  <p className="text-xs text-slate-400">
                    Scholars identified based on low attendance, falling behind lesson schedules, low assessment scores, or long inactivity.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCSV("AT_RISK", "at_risk_students_report")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export At-Risk Data
                </button>
              </div>

              {atRiskList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">All Scholars On Track</h4>
                  <p className="text-xs text-slate-500">No students are currently triggering at-risk intervention thresholds.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {atRiskList.map((s) => (
                    <div
                      key={s.id}
                      className={`p-5 rounded-2xl border space-y-3 ${
                        s.riskLevel === "HIGH"
                          ? "bg-rose-500/10 border-rose-500/30"
                          : "bg-amber-500/10 border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-white text-sm">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.email}</div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                            s.riskLevel === "HIGH"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {s.riskLevel} RISK
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                        <div className="text-slate-400 font-mono text-[10px] uppercase font-bold">Diagnostic Reasons:</div>
                        <p className="text-rose-300 font-semibold">{s.riskReason}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center text-xs">
                        <div className="p-1.5 rounded-lg bg-slate-900">
                          <span className="text-[9px] text-slate-500 block">Progress</span>
                          <strong className="text-white">{s.progressPercent}%</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-900">
                          <span className="text-[9px] text-slate-500 block">Attendance</span>
                          <strong className="text-amber-400">{s.attendancePercent}%</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-900">
                          <span className="text-[9px] text-slate-500 block">Quiz Avg</span>
                          <strong className="text-purple-400">{s.avgQuizScore}%</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: LIVE CLASS REPORT */}
          {activeTab === "LIVE_CLASSES" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Live Workshop & Mentoring Reports</h3>
                  <p className="text-xs text-slate-400">Class attendance rates, recording availability, and participant turnouts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveClasses.map((lc) => (
                  <div key={lc.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{lc.title}</h4>
                        <span className="text-[11px] text-cyan-400 font-mono">Cohort: {lc.batchName}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {lc.scheduledDate} • {lc.scheduledTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <strong className="text-white text-xs">{lc.totalStudents}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Present</span>
                        <strong className="text-emerald-400 text-xs">{lc.presentCount}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Late</span>
                        <strong className="text-amber-400 text-xs">{lc.lateCount}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60">
                        <span className="text-[10px] text-slate-500 block">Attendance</span>
                        <strong className="text-cyan-400 text-xs">{lc.attendancePercent}%</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: STUDENT ENGAGEMENT */}
          {activeTab === "ENGAGEMENT" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="font-extrabold text-lg text-white">Student Platform Engagement & Activity Matrix</h3>
                <p className="text-xs text-slate-400">Logins, activity recency, and course participation scores.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Active:</span>
                        <span className="text-white">{s.lastActive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inactivity:</span>
                        <span className={s.daysInactive > 7 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                          {s.daysInactive === 0 ? "Active Today" : `${s.daysInactive} days ago`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: CERTIFICATE ELIGIBILITY */}
          {activeTab === "CERTIFICATES" && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" /> Certificate Graduation Eligibility Roster
                </h3>
                <p className="text-xs text-slate-400">
                  Scholars meeting graduation criteria (≥80% Course Progress, ≥75% Attendance, ≥60% Quiz Average).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Scholar</th>
                      <th className="p-3.5">Course</th>
                      <th className="p-3.5">Progress (≥80%)</th>
                      <th className="p-3.5">Attendance (≥75%)</th>
                      <th className="p-3.5">Quiz Avg (≥60%)</th>
                      <th className="p-3.5">Graduation Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                        </td>
                        <td className="p-3.5 font-mono text-amber-400">{s.courseTitle}</td>
                        <td className="p-3.5 font-mono font-bold">{s.progressPercent}%</td>
                        <td className="p-3.5 font-mono font-bold">{s.attendancePercent}%</td>
                        <td className="p-3.5 font-mono font-bold">{s.avgQuizScore}%</td>
                        <td className="p-3.5">
                          <span
                            className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold border ${
                              s.certificateEligible
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {s.certificateEligible ? "✓ Eligible for Certificate" : "Pending Requirements"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: EXPORTS CENTER */}
          {activeTab === "EXPORTS" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-2">
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" /> Standardized Report Export Center
                </h3>
                <p className="text-xs text-slate-400">
                  Export structured CSV spreadsheets filtered according to your active course and batch selections.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    id: "STUDENT_PROGRESS",
                    title: "Student Progress & Completion Ledger",
                    desc: "Full roster of enrolled learners, progress percentages, lessons completed, and status.",
                    filename: "student_progress_ledger",
                  },
                  {
                    id: "ATTENDANCE",
                    title: "Attendance & Compliance Registry",
                    desc: "Class presence stats, absence flags, and attendance status compliance.",
                    filename: "attendance_compliance_report",
                  },
                  {
                    id: "QUIZZES",
                    title: "Quiz & Assessment Diagnostics",
                    desc: "Assessment attempts, pass/fail percentages, and score distributions.",
                    filename: "quiz_assessment_diagnostics",
                  },
                  {
                    id: "ASSIGNMENTS",
                    title: "Assignment Milestone Evaluation Report",
                    desc: "Submission links, grading evaluations, and score summaries.",
                    filename: "assignment_evaluations",
                  },
                  {
                    id: "BATCHES",
                    title: "Cohort Batch Performance Summary",
                    desc: "Cohort completion metrics and comparative performance stats.",
                    filename: "batch_performance_summary",
                  },
                  {
                    id: "AT_RISK",
                    title: "At-Risk Early Warning Diagnostics",
                    desc: "Detailed diagnostic reasons for scholars requiring intervention.",
                    filename: "at_risk_scholars_report",
                  },
                ].map((rep) => (
                  <div key={rep.id} className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-sm">{rep.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{rep.desc}</p>
                    </div>

                    <button
                      onClick={() => handleExportCSV(rep.id, rep.filename)}
                      disabled={exporting === rep.id}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-white text-xs font-bold font-mono flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      {exporting === rep.id ? "Exporting CSV..." : "Download CSV"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
