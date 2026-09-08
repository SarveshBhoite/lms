import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const {
      reportType, // "students" | "attendance" | "courses" | "quizzes" | "assignments" | "certificates"
      format, // "xlsx" | "csv" | "json"
      startDate,
      endDate,
      courseId,
      batchId,
    } = await req.json();

    const isTrainer = session.role === "TRAINER";
    const trainerId = session.userId;

    const dateFilter = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
    };
    const hasDateFilter = startDate || endDate;

    let rows: Record<string, any>[] = [];
    let reportTitle = "Report";

    // 1. STUDENTS REGISTRY
    if (reportType === "students") {
      reportTitle = "Students_Registry";
      const students = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          ...(courseId ? { enrollments: { some: { courseId } } } : {}),
          ...(batchId ? { studentBatches: { some: { batchId } } } : {}),
          ...(isTrainer
            ? {
                OR: [
                  { enrollments: { some: { course: { trainerId } } } },
                  { studentBatches: { some: { batch: { trainers: { some: { trainerId } } } } } },
                ],
              }
            : {}),
        },
        include: {
          profile: true,
          enrollments: {
            include: {
              course: { select: { title: true } },
              batch: { select: { name: true } },
            },
          },
          courseProgresses: true,
        },
        orderBy: { createdAt: "desc" },
      });

      rows = students.map((s) => {
        const coursesList = s.enrollments.map((e) => e.course.title).join(", ") || "None";
        const batchesList = s.enrollments.map((e) => e.batch?.name).filter(Boolean).join(", ") || "None";
        const avgProgress =
          s.courseProgresses.length > 0
            ? (s.courseProgresses.reduce((acc, p) => acc + p.progressPercent, 0) / s.courseProgresses.length).toFixed(1) + "%"
            : "0%";

        return {
          "Student ID": s.id,
          "Full Name": s.name,
          Email: s.email,
          Phone: s.profile?.phone || "N/A",
          Status: s.isActive ? "ACTIVE" : "INACTIVE",
          "Joined Date": new Date(s.createdAt).toLocaleDateString(),
          "Enrolled Courses": coursesList,
          "Assigned Batches": batchesList,
          "Average Progress": avgProgress,
        };
      });
    }

    // 2. ATTENDANCE & LIVE SESSIONS
    else if (reportType === "attendance") {
      reportTitle = "Attendance_Registry";
      const attendances = await prisma.attendance.findMany({
        where: {
          ...(hasDateFilter ? { recordedAt: dateFilter } : {}),
          liveClass: {
            ...(courseId ? { courseId } : {}),
            ...(batchId ? { OR: [{ batchId }, { batchIds: { has: batchId } }] } : {}),
            ...(isTrainer ? { trainerId } : {}),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          liveClass: {
            include: {
              course: { select: { title: true } },
              batch: { select: { name: true } },
              trainer: { select: { name: true } },
            },
          },
        },
        orderBy: { recordedAt: "desc" },
      });

      rows = attendances.map((a) => ({
        "Attendance ID": a.id,
        "Student Name": a.user.name,
        "Student Email": a.user.email,
        "Session Title": a.liveClass.title,
        "Course Title": a.liveClass.course?.title || "General Cohort Session",
        "Batch Name": a.liveClass.batch.name,
        Trainer: a.liveClass.trainer.name,
        "Scheduled Date": new Date(a.liveClass.scheduledDate).toLocaleDateString(),
        Status: a.status,
        "Verified by Trainer": a.isApproved ? "VERIFIED" : "PENDING",
        "Join Timestamp": a.joinClickTime ? new Date(a.joinClickTime).toLocaleTimeString() : "N/A",
        "Excuse Remark": a.excuseReason || "None",
      }));
    }

    // 3. COURSES & MILESTONE AUDIT
    else if (reportType === "courses") {
      reportTitle = "Course_Milestone_Audit";
      const courses = await prisma.course.findMany({
        where: {
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          ...(courseId ? { id: courseId } : {}),
          ...(isTrainer ? { trainerId } : {}),
        },
        include: {
          trainer: { select: { name: true, email: true } },
          modules: { include: { lessons: true } },
          enrollments: true,
          courseProgress: true,
          certificates: true,
        },
        orderBy: { createdAt: "desc" },
      });

      rows = courses.map((c) => {
        const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        const completedEnrollments = c.courseProgress.filter((p) => p.isCompleted).length;
        const completionRate =
          c.enrollments.length > 0 ? ((completedEnrollments / c.enrollments.length) * 100).toFixed(1) + "%" : "0%";

        return {
          "Course ID": c.id,
          Title: c.title,
          Level: c.level,
          Status: c.status,
          Trainer: c.trainer.name,
          "Total Modules": c.modules.length,
          "Total Lessons": totalLessons,
          "Enrolled Students": c.enrollments.length,
          "Completed Learners": completedEnrollments,
          "Completion Rate": completionRate,
          "Certificates Issued": c.certificates.length,
          "Created Date": new Date(c.createdAt).toLocaleDateString(),
        };
      });
    }

    // 4. QUIZZES & ASSESSMENTS
    else if (reportType === "quizzes") {
      reportTitle = "Quiz_Assessment_Results";
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          ...(hasDateFilter ? { startedAt: dateFilter } : {}),
          quiz: {
            ...(courseId ? { courseId } : {}),
            ...(isTrainer ? { course: { trainerId } } : {}),
          },
        },
        include: {
          user: { select: { name: true, email: true } },
          quiz: {
            include: {
              course: { select: { title: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });

      rows = quizAttempts.map((qa) => ({
        "Attempt ID": qa.id,
        "Student Name": qa.user.name,
        "Student Email": qa.user.email,
        "Quiz Title": qa.quiz.title,
        "Course Title": qa.quiz.course.title,
        "Score (%)": qa.score.toFixed(1) + "%",
        "Pass Criteria (%)": qa.quiz.passingMarks + "%",
        Result: qa.isPassed ? "PASSED" : "FAILED",
        "Attempt Date": new Date(qa.startedAt).toLocaleDateString(),
      }));
    }

    // 5. ASSIGNMENTS & TASKS
    else if (reportType === "assignments") {
      reportTitle = "Assignment_Submissions";
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          ...(hasDateFilter ? { submittedAt: dateFilter } : {}),
          assignment: {
            ...(courseId ? { courseId } : {}),
            ...(isTrainer ? { course: { trainerId } } : {}),
          },
        },
        include: {
          user: { select: { name: true, email: true } },
          assignment: {
            include: {
              course: { select: { title: true } },
            },
          },
          feedback: {
            include: {
              trainer: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      });

      rows = submissions.map((sub) => ({
        "Submission ID": sub.id,
        "Student Name": sub.user.name,
        "Student Email": sub.user.email,
        "Assignment Title": sub.assignment.title,
        "Course Title": sub.assignment.course.title,
        Status: sub.status,
        "Submitted Date": new Date(sub.submittedAt).toLocaleDateString(),
        "Solution Link": sub.fileUrl,
        "Marks Awarded": sub.feedback ? `${sub.feedback.marksAwarded} / ${sub.assignment.totalMarks}` : "Ungraded",
        "Graded By": sub.feedback?.trainer.name || "N/A",
        "Feedback Remark": sub.feedback?.feedbackText || "None",
      }));
    }

    // 6. CERTIFICATES ISSUED REGISTRY
    else if (reportType === "certificates") {
      reportTitle = "Certificates_Issued_Registry";
      const certificates = await prisma.certificate.findMany({
        where: {
          ...(hasDateFilter ? { issueDate: dateFilter } : {}),
          ...(courseId ? { courseId } : {}),
          ...(isTrainer ? { course: { trainerId } } : {}),
        },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true, level: true } },
        },
        orderBy: { issueDate: "desc" },
      });

      rows = certificates.map((c) => ({
        "Certificate ID": c.certificateNumber,
        "Recipient Name": c.user.name,
        "Recipient Email": c.user.email,
        "Course Title": c.course.title,
        "Course Level": c.course.level,
        "Issue Date": new Date(c.issueDate).toLocaleDateString(),
        Status: "VERIFIED",
      }));
    }

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No records found matching the specified filters and date range.",
      });
    }

    // FORMAT EXPORT: XLSX (Excel) or CSV
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportTitle.substring(0, 31));

    if (format === "csv") {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${reportTitle}_${Date.now()}.csv"`,
        },
      });
    }

    // Default: XLSX
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${reportTitle}_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
