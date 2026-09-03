import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedComprehensiveCombinations() {
  console.log("🌱 Fetching your course and modules...");

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      batches: true,
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (courses.length === 0) {
    console.log("No courses found.");
    return;
  }

  const targetCourse = courses.find((c) => c.batches.length > 0 || c.modules.length > 0) || courses[0];
  console.log(`🎯 Course: "${targetCourse.title}" (ID: ${targetCourse.id})`);

  const batchIds = targetCourse.batches.map((b) => b.id);
  console.log(`📦 Batches: ${targetCourse.batches.map((b) => b.name).join(", ") || "None"}`);

  // 1. Standalone Quiz
  const existingStandaloneQuiz = await prisma.quiz.findFirst({
    where: { courseId: targetCourse.id, lessonId: null },
  });

  if (!existingStandaloneQuiz) {
    await prisma.quiz.create({
      data: {
        courseId: targetCourse.id,
        lessonId: null,
        batchIds: batchIds,
        title: "Standalone Mid-Term Evaluation Quiz",
        description: "Course-level general assessment across all batches. Not linked to any single lesson.",
        passingMarks: 60,
        timeLimitMinutes: 20,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              question: "What is the primary advantage of relational indexing (B-Tree)?",
              type: "MCQ",
              difficulty: "MEDIUM",
              marks: 10,
              orderIndex: 0,
              explanation: "B-Trees reduce disk I/O by allowing O(log N) lookup times.",
              options: {
                create: [
                  { text: "Reduces search time from O(N) to O(log N)", isCorrect: true, orderIndex: 0 },
                  { text: "Encrypts all stored table rows", isCorrect: false, orderIndex: 1 },
                  { text: "Removes foreign key constraints automatically", isCorrect: false, orderIndex: 2 },
                  { text: "Bypasses all connection pool limits", isCorrect: false, orderIndex: 3 },
                ],
              },
            },
            {
              question: "Fill in the blank: The principle in ACID that guarantees transactions either fully complete or roll back completely is called ________.",
              type: "FILL_IN_BLANK",
              difficulty: "EASY",
              marks: 10,
              orderIndex: 1,
              correctAnswerText: "Atomicity",
              explanation: "Atomicity ensures 'all or nothing' execution.",
            },
          ],
        },
      },
    });
    console.log("✅ Flow 1 Created: Standalone Course/Batch Quiz");
  }

  // 2. Standalone Assignment
  const existingStandaloneAsgn = await prisma.assignment.findFirst({
    where: { courseId: targetCourse.id, lessonId: null },
  });

  if (!existingStandaloneAsgn) {
    await prisma.assignment.create({
      data: {
        courseId: targetCourse.id,
        lessonId: null,
        batchIds: batchIds,
        title: "Standalone Course Capstone Project",
        description: "Full-scale project submission for your batch. Submit your live deployment link and GitHub repository.",
        instructions: "Host the repository with documentation and paste the URL below.",
        totalMarks: 100,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("✅ Flow 2 Created: Standalone Course/Batch Task");
  }

  // Ensure Module 1 & Module 2 exist
  let module1 = targetCourse.modules[0];
  if (!module1) {
    module1 = await prisma.courseModule.create({
      data: {
        courseId: targetCourse.id,
        title: "Module 1: Foundations & Single-Requirement Flow",
        description: "Testing lessons with only content, only quiz, and only assignment.",
        orderIndex: 0,
      },
      include: { lessons: true },
    });
    console.log("Created Module 1");
  }

  let module2 = targetCourse.modules.find((m) => m.id !== module1.id);
  if (!module2) {
    module2 = await prisma.courseModule.create({
      data: {
        courseId: targetCourse.id,
        title: "Module 2: Advanced & Multi-Requirement Flow",
        description: "Testing lessons with both Quiz AND Assignment attached, plus final milestone.",
        orderIndex: 1,
      },
      include: { lessons: true },
    });
    console.log("Created Module 2");
  }

  // Lesson A: Content Only
  const combATitle = "Lesson A: Pure Reading & Code Notes (No Quiz/Task)";
  let lessonA = await prisma.lesson.findFirst({
    where: { moduleId: module1.id, title: combATitle },
  });

  if (!lessonA) {
    lessonA = await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        title: combATitle,
        description: "Testing pure content: The student reads notes and can directly click 'Mark Complete' to unlock next.",
        contentType: "TEXT",
        durationMinutes: 15,
        orderIndex: 0,
        textContent: `<h2>Pure Reading & Documentation Lesson</h2>
<p>This lesson demonstrates a standard tutorial where no quiz or assignment is required. The student can read through and directly proceed.</p>
<div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 12px; margin: 16px 0;">
  <strong>💡 Direct Progression:</strong>
  <p style="margin: 4px 0 0 0; color: #166534;">Click 'Mark Complete & Next' at the top or bottom to unlock Lesson B!</p>
</div>`,
      },
    });
    console.log("✅ Combination A Created: Pure Content Lesson");
  }

  // Lesson B: Content + Quiz
  const combBTitle = "Lesson B: Knowledge Checkpoint (Quiz Required)";
  let lessonB = await prisma.lesson.findFirst({
    where: { moduleId: module1.id, title: combBTitle },
  });

  if (!lessonB) {
    lessonB = await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        title: combBTitle,
        description: "Testing quiz gate: The student cannot mark complete until achieving >= 60% on this quiz.",
        contentType: "TEXT",
        durationMinutes: 20,
        orderIndex: 1,
        textContent: `<h2>Lesson B: Interactive Quiz Evaluation</h2>
<p>In this lesson, reading the notes is not enough — you must answer the checkpoint quiz below and achieve at least 60% to unlock the next lesson.</p>`,
      },
    });

    await prisma.quiz.create({
      data: {
        courseId: targetCourse.id,
        lessonId: lessonB.id,
        title: "Lesson B Auto-Graded Quiz",
        description: "Includes MCQ, Multiple-Answer, True/False, and case-insensitive Fill-in-the-Blank.",
        passingMarks: 60,
        timeLimitMinutes: 10,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              question: "JavaScript executes code single-threaded on an event loop.",
              type: "TRUE_FALSE",
              difficulty: "EASY",
              marks: 5,
              orderIndex: 0,
              options: {
                create: [
                  { text: "True", isCorrect: true, orderIndex: 0 },
                  { text: "False", isCorrect: false, orderIndex: 1 },
                ],
              },
            },
            {
              question: "Which of the following data types are primitive in JavaScript? (Select all that apply)",
              type: "MULTIPLE_ANSWER",
              difficulty: "MEDIUM",
              marks: 5,
              orderIndex: 1,
              options: {
                create: [
                  { text: "string", isCorrect: true, orderIndex: 0 },
                  { text: "number", isCorrect: true, orderIndex: 1 },
                  { text: "boolean", isCorrect: true, orderIndex: 2 },
                  { text: "HTMLCollection", isCorrect: false, orderIndex: 3 },
                ],
              },
            },
            {
              question: "Type the exact HTTP method used to retrieve resources from a server:",
              type: "FILL_IN_BLANK",
              difficulty: "EASY",
              marks: 5,
              orderIndex: 2,
              correctAnswerText: "GET",
              explanation: "GET retrieves representations of resources.",
            },
            {
              question: "Which status code indicates 'Not Found'?",
              type: "MCQ",
              difficulty: "EASY",
              marks: 5,
              orderIndex: 3,
              options: {
                create: [
                  { text: "404", isCorrect: true, orderIndex: 0 },
                  { text: "500", isCorrect: false, orderIndex: 1 },
                  { text: "200", isCorrect: false, orderIndex: 2 },
                  { text: "301", isCorrect: false, orderIndex: 3 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log("✅ Combination B Created: Lesson with attached 4-type Quiz");
  }

  // Lesson C: Content + Assignment
  const combCTitle = "Lesson C: Practical Lab Task (Assignment Submission Required)";
  let lessonC = await prisma.lesson.findFirst({
    where: { moduleId: module1.id, title: combCTitle },
  });

  if (!lessonC) {
    lessonC = await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        title: combCTitle,
        description: "Testing assignment gate: The student must submit their project link/URL to unlock progression.",
        contentType: "TEXT",
        durationMinutes: 30,
        orderIndex: 2,
        textContent: `<h2>Lesson C: Lab Exercise</h2>
<p>Please implement the hands-on exercise and submit your solution link in the project submitter below. Submitting immediately satisfies the progression lock!</p>`,
      },
    });

    await prisma.assignment.create({
      data: {
        courseId: targetCourse.id,
        lessonId: lessonC.id,
        title: "Lab Task: Build a REST endpoint with Input Validation",
        description: "Create a POST endpoint that validates user payload and handles duplicate email errors.",
        instructions: "Paste your GitHub URL or Drive link below.",
        totalMarks: 50,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("✅ Combination C Created: Lesson with attached Assignment");
  }

  // Lesson D in Module 2: Both Quiz AND Assignment Attached
  const combDTitle = "Lesson D: Capstone Challenge (Both Quiz AND Assignment Required)";
  let lessonD = await prisma.lesson.findFirst({
    where: { moduleId: module2.id, title: combDTitle },
  });

  if (!lessonD) {
    lessonD = await prisma.lesson.create({
      data: {
        moduleId: module2.id,
        title: combDTitle,
        description: "Testing dual requirements: Both the quiz must be passed AND the project must be submitted to unlock course completion.",
        contentType: "TEXT",
        durationMinutes: 45,
        orderIndex: 0,
        textContent: `<h2>Lesson D: Dual-Requirement Milestone</h2>
<p>This lesson tests the full workflow: you must pass the assessment quiz AND submit your project solution below. Once both are completed, you can mark the final lesson complete!</p>`,
      },
    });

    await prisma.quiz.create({
      data: {
        courseId: targetCourse.id,
        lessonId: lessonD.id,
        title: "Milestone Technical Quiz",
        description: "Comprehensive quiz covering architecture and schema modeling.",
        passingMarks: 70,
        timeLimitMinutes: 10,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              question: "Indexes increase read query speed but can add slight overhead to INSERT/UPDATE operations.",
              type: "TRUE_FALSE",
              difficulty: "EASY",
              marks: 5,
              orderIndex: 0,
              options: {
                create: [
                  { text: "True", isCorrect: true, orderIndex: 0 },
                  { text: "False", isCorrect: false, orderIndex: 1 },
                ],
              },
            },
            {
              question: "Type the SQL command used to combine rows from two or more tables based on a related column:",
              type: "FILL_IN_BLANK",
              difficulty: "EASY",
              marks: 5,
              orderIndex: 1,
              correctAnswerText: "JOIN",
              explanation: "JOIN clauses combine rows from multiple tables.",
            },
          ],
        },
      },
    });

    await prisma.assignment.create({
      data: {
        courseId: targetCourse.id,
        lessonId: lessonD.id,
        title: "Full Capstone Architecture Implementation",
        description: "Submit your full project solution repository or cloud deployment URL.",
        instructions: "Paste public repository URL.",
        totalMarks: 100,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("✅ Combination D Created: Lesson in Module 2 with BOTH Quiz and Assignment");
  }

  // Lesson E in Module 2: Pure Final Video & Wrap-up
  const combETitle = "Lesson E: Production Deployment & Wrap-Up";
  let lessonE = await prisma.lesson.findFirst({
    where: { moduleId: module2.id, title: combETitle },
  });

  if (!lessonE) {
    lessonE = await prisma.lesson.create({
      data: {
        moduleId: module2.id,
        title: combETitle,
        description: "Course conclusion, certificate eligibility, and next steps.",
        contentType: "TEXT",
        durationMinutes: 15,
        orderIndex: 1,
        textContent: `<h2>Course Wrap-Up & Certificate Award</h2>
<p>Congratulations on completing the curriculum! You have mastered data modeling, API validation, quizzes, and hands-on lab submissions.</p>`,
      },
    });
    console.log("✅ Combination E Created: Final Wrap-up Lesson in Module 2");
  }

  console.log("\n🎉 ALL COMBINATIONS IN MODULE 1 AND MODULE 2 SEEDED SUCCESSFULLY!");
}

seedComprehensiveCombinations()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
