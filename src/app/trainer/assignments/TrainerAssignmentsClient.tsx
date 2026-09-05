"use client";

import { useState } from "react";
import Link from "next/link";
import { FileCheck, Plus, BookOpen, Layers, Filter } from "lucide-react";

interface AssignmentWithMeta {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  totalMarks: number;
  lessonId: string | null;
  lesson?: { id: string; title: string; module: { title: string } } | null;
  course: { id: string; title: string };
  submissions: { id: string; status: string }[];
}

export default function TrainerAssignmentsClient({
  initialAssignments,
}: {
  initialAssignments: AssignmentWithMeta[];
}) {
  const [filterType, setFilterType] = useState<"ALL" | "LESSON" | "STANDALONE">("ALL");
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");

  // Distinct courses
  const courses = Array.from(
    new Map(initialAssignments.map((a) => [a.course.id, a.course.title])).entries()
  );

  const filteredAssignments = initialAssignments.filter((asgn) => {
    if (filterType === "LESSON" && !asgn.lessonId) return false;
    if (filterType === "STANDALONE" && asgn.lessonId) return false;
    if (selectedCourse !== "ALL" && asgn.course.id !== selectedCourse) return false;
    return true;
  });

  const lessonCount = initialAssignments.filter((a) => Boolean(a.lessonId)).length;
  const standaloneCount = initialAssignments.filter((a) => !a.lessonId).length;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Assignments & Submissions</h1>
          <p className="text-slate-600 text-sm mt-1">
            Evaluate student project work from both attached lesson tasks and standalone course/batch assignments.
          </p>
        </div>

        <Link
          href="/trainer/assignments/create"
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> New Standalone Assignment
        </Link>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              filterType === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Tasks ({initialAssignments.length})
          </button>
          <button
            onClick={() => setFilterType("STANDALONE")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              filterType === "STANDALONE"
                ? "bg-[#7C248C] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Standalone Tasks ({standaloneCount})
          </button>
          <button
            onClick={() => setFilterType("LESSON")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              filterType === "LESSON"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Lesson Tasks ({lessonCount})
          </button>
        </div>

        {/* Course Filter Dropdown */}
        {courses.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#7C248C] w-full sm:w-auto"
            >
              <option value="ALL">All Courses</option>
              {courses.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Assignments */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((asgn) => {
            const pendingCount = asgn.submissions.filter((s) => s.status === "SUBMITTED").length;
            const isLessonTask = Boolean(asgn.lessonId);

            return (
              <div
                key={asgn.id}
                className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isLessonTask
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-purple-50 text-[#7C248C] border-purple-200"
                      }`}
                    >
                      {isLessonTask ? <BookOpen className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                      {isLessonTask ? "Lesson Task" : "Standalone Task"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{asgn.totalMarks} Marks</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold block mb-1">
                      {asgn.course.title}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-2">{asgn.title}</h3>

                    {/* Lesson origin details */}
                    {isLessonTask && asgn.lesson && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Linked Lesson:</span>
                        <strong className="text-slate-800 line-clamp-1">{asgn.lesson.title}</strong>
                        <span className="text-slate-400 text-[10px] block">({asgn.lesson.module.title})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-[#E01E6A] font-semibold pt-1">
                    <span>Deadline:</span>
                    <span>{asgn.deadline ? new Date(asgn.deadline).toLocaleDateString() : "Flexible / None"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Submissions</span>
                      <strong className="text-slate-900">{asgn.submissions.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Pending Grading</span>
                      <strong className="text-[#E01E6A] font-bold">{pendingCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/trainer/assignments/${asgn.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Grade & Evaluate Submissions
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No assignments found matching the selected filter.</p>
        </div>
      )}
    </div>
  );
}
