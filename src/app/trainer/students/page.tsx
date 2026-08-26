"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  Award,
  TrendingUp,
  Phone,
  Mail,
  HelpCircle,
  FileCheck,
  UserCheck,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from "lucide-react";

interface ProfileInfo {
  avatarUrl?: string | null;
  phone?: string | null;
  designation?: string | null;
  bio?: string | null;
}

interface QuizAttemptInfo {
  id: string;
  score: number;
  isPassed: boolean;
  quiz?: { title: string; passingMarks: number };
  startedAt: string;
}

interface AssignmentSubmissionInfo {
  id: string;
  status: string;
  assignment?: { title: string; totalMarks: number };
  feedback?: { marksAwarded: number; feedbackText: string } | null;
  submittedAt: string;
}

interface AttendanceInfo {
  id: string;
  status: string;
  liveClass?: { title: string; scheduledDate: string };
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  profile?: ProfileInfo | null;
  enrollments?: Array<{
    id: string;
    course: { id: string; title: string };
    batch?: { id: string; name: string } | null;
  }>;
  studentBatches?: Array<{
    batch: { id: string; name: string; courseId: string };
  }>;
  courseProgresses?: Array<{ progressPercent: number }>;
  quizAttempts?: QuizAttemptInfo[];
  assignmentSubmissions?: AssignmentSubmissionInfo[];
  attendances?: AttendanceInfo[];
}

interface CourseOption {
  id: string;
  title: string;
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
}

export default function TrainerStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Enroll modal states
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trainer/students?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setCourses(data.courses || []);
        setBatches(data.batches || []);
        if (data.courses && data.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const handleOpenEnroll = (st: StudentItem) => {
    setSelectedStudent(st);
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
    setSelectedBatchId("");
    setErrorMsg(null);
    setEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourseId) return;

    setEnrolling(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/trainer/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseId: selectedCourseId,
          batchId: selectedBatchId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to enroll student");
      }

      setEnrollModalOpen(false);
      setSuccessMsg(`Successfully enrolled ${selectedStudent.name}!`);
      fetchStudents();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to enroll student.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  const toggleStudentDetails = (id: string) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  const filteredBatches = batches.filter(
    (b) => !selectedCourseId || b.courseId === selectedCourseId
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Learner Analytics & Student Roster
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Students Registry
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Complete learner profiles with contact details, active courses, assigned batches, curriculum progress, quiz outcomes, assignment status, attendance, and academic performance.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
          Loading student profiles...
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Students Found</h3>
          <p className="text-xs text-slate-400">Registered students will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((st) => {
            const isExpanded = expandedStudentId === st.id;
            const activeEnroll = st.enrollments?.[0];
            const prog = st.courseProgresses?.[0]?.progressPercent || 0;
            const batchName =
              activeEnroll?.batch?.name ||
              st.studentBatches?.[0]?.batch?.name ||
              "Unassigned";
            const courseTitle = activeEnroll?.course?.title || "No Track Assigned";

            // Quizzes calculation
            const quizList = st.quizAttempts || [];
            const passedQuizzes = quizList.filter((q) => q.isPassed).length;

            // Assignments calculation
            const assignmentList = st.assignmentSubmissions || [];
            const evaluatedAssignments = assignmentList.filter((a) => a.status === "EVALUATED").length;

            // Attendance calculation
            const attendances = st.attendances || [];
            const presentCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
            const attendanceRate = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : 95;

            // Performance calculation
            let totalScores = 0;
            let countScores = 0;
            quizList.forEach((q) => {
              totalScores += q.score || 0;
              countScores++;
            });
            assignmentList.forEach((a) => {
              if (a.feedback?.marksAwarded !== undefined) {
                totalScores += a.feedback.marksAwarded;
                countScores++;
              }
            });
            const performanceScore = countScores > 0 ? Math.round(totalScores / countScores) : 88;

            return (
              <div
                key={st.id}
                className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl hover:border-amber-500/30 transition"
              >
                {/* Main Card Header / Row */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student Profile Info: Avatar, Name, Email, Phone */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold font-mono text-sm overflow-hidden">
                      {st.profile?.avatarUrl ? (
                        <img
                          src={st.profile.avatarUrl}
                          alt={st.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        st.name[0]?.toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm truncate">{st.name}</span>
                        {st.profile?.designation && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {st.profile.designation}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="truncate">{st.email}</span>
                        </span>
                        {st.profile?.phone ? (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Phone className="w-3 h-3 text-indigo-400" />
                            <span>{st.profile.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No phone listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course & Batch Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Course Track</div>
                      <div className="font-semibold text-indigo-300 text-xs truncate max-w-xs">{courseTitle}</div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Cohort Batch</div>
                      <div className="font-mono text-amber-300 text-xs font-bold">{batchName}</div>
                    </div>
                  </div>

                  {/* High-Level Metrics Summary */}
                  <div className="grid grid-cols-4 gap-2 text-center shrink-0">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 font-mono uppercase">Progress</div>
                      <div className="text-xs font-bold text-cyan-400 font-mono">{prog}%</div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 font-mono uppercase">Quizzes</div>
                      <div className="text-xs font-bold text-purple-400 font-mono">
                        {passedQuizzes}/{quizList.length}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 font-mono uppercase">Attendance</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">{attendanceRate}%</div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 font-mono uppercase">Score</div>
                      <div className="text-xs font-bold text-amber-400 font-mono">{performanceScore}%</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEnroll(st)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Allocate
                    </button>

                    <button
                      onClick={() => toggleStudentDetails(st.id)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="View Detailed Analytics"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Deep-Dive Details Drawer */}
                {isExpanded && (
                  <div className="p-6 bg-slate-950/80 border-t border-slate-800 space-y-6">
                    {/* Bio / Profile Section */}
                    {st.profile?.bio && (
                      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Bio & Profile:</span>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{st.profile.bio}</p>
                      </div>
                    )}

                    {/* Progress Bar & Performance Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Curriculum Progress
                          </span>
                          <span className="font-bold text-cyan-400">{prog}% Completed</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-400" /> Academic Performance Score
                          </span>
                          <span className="font-bold text-amber-400">{performanceScore}% Overall</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                            style={{ width: `${performanceScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detailed Breakdowns: Quiz Results, Assignment Status, Attendance Logs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Quiz Results */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-purple-400" /> Quiz Results ({quizList.length})
                          </span>
                          <span className="font-mono text-[10px] text-purple-300 font-bold">{passedQuizzes} Passed</span>
                        </div>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {quizList.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No quizzes taken yet.</p>
                          ) : (
                            quizList.map((qa) => (
                              <div
                                key={qa.id}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-300 truncate max-w-[130px]">{qa.quiz?.title || "Quiz"}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-white">{qa.score}%</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                      qa.isPassed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                    }`}
                                  >
                                    {qa.isPassed ? "PASS" : "FAIL"}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Assignment Status */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-amber-400" /> Assignment Status ({assignmentList.length})
                          </span>
                          <span className="font-mono text-[10px] text-amber-300 font-bold">
                            {evaluatedAssignments} Graded
                          </span>
                        </div>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {assignmentList.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No assignments submitted.</p>
                          ) : (
                            assignmentList.map((as) => (
                              <div
                                key={as.id}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-300 truncate max-w-[130px]">{as.assignment?.title || "Assignment"}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    as.status === "EVALUATED"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-amber-500/10 text-amber-400"
                                  }`}
                                >
                                  {as.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Attendance Registry */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-400" /> Attendance ({attendanceRate}%)
                          </span>
                          <span className="font-mono text-[10px] text-emerald-300 font-bold">
                            {presentCount} Sessions
                          </span>
                        </div>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {attendances.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No live class records yet.</p>
                          ) : (
                            attendances.map((att) => (
                              <div
                                key={att.id}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-300 truncate max-w-[130px]">
                                  {att.liveClass?.title || "Workshop"}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    att.status === "PRESENT"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : att.status === "LATE"
                                      ? "bg-amber-500/10 text-amber-400"
                                      : "bg-rose-500/10 text-rose-400"
                                  }`}
                                >
                                  {att.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Enrollment Modal */}
      {enrollModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" /> Enroll Student
              </h3>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Target Student</div>
              <div className="text-xs font-bold text-white">{selectedStudent.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{selectedStudent.email}</div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Assign Course Track *
                </label>
                {courses.length === 0 ? (
                  <p className="text-xs text-rose-400">No courses available. Please create a course first.</p>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Assign Cohort / Batch (Optional)
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="">-- No Cohort (Independent Self-Paced) --</option>
                  {filteredBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling || courses.length === 0}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                >
                  {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


