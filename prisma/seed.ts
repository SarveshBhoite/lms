import { PrismaClient, Role, CourseStatus, CourseLevel, ContentType, QuestionType, QuestionDifficulty, BatchStatus, LiveClassStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting LMS database seed...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash("123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "sulagadleaishwarya@gmail.com" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    create: {
      name: "Aishwarya Sulagadle (Super Admin)",
      email: "sulagadleaishwarya@gmail.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+1-555-0199",
          bio: "Director of Academics & Chief LMS Administrator",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          designation: "Academic Dean & Super Admin",
        },
      },
    },
  });
  console.log("✅ Seeded Admin:", admin.email);

  // 2. Seed Trainer
  const trainer = await prisma.user.upsert({
    where: { email: "trainer@institute.edu" },
    update: {},
    create: {
      name: "Prof. Marcus Thorne",
      email: "trainer@institute.edu",
      passwordHash,
      role: Role.TRAINER,
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+1-555-0248",
          bio: "Senior Cloud Architect & Full-Stack Lead Trainer with 12+ years experience.",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          designation: "Lead Technical Trainer",
        },
      },
    },
  });
  console.log("✅ Seeded Trainer:", trainer.email);

  // 3. Seed Students
  const studentsData = [
    {
      name: "Sophia Martinez",
      email: "sophia.student@institute.edu",
      bio: "Aspiring Full Stack Engineer passionate about TypeScript & Next.js",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Liam Chen",
      email: "liam.student@institute.edu",
      bio: "Software Engineering student aiming for DevOps & Cloud specialties",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Amina Yusuf",
      email: "amina.student@institute.edu",
      bio: "Data enthusiast transitioning to Full-Stack Web Development",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: Role.STUDENT,
        isEmailVerified: true,
        profile: {
          create: {
            bio: s.bio,
            avatarUrl: s.avatar,
          },
        },
      },
    });
    students.push(student);
  }
  console.log(`✅ Seeded ${students.length} Students.`);

  // 4. Seed Courses
  const course1 = await prisma.course.upsert({
    where: { slug: "full-stack-nextjs-mastery" },
    update: {},
    create: {
      title: "Full-Stack Next.js 15 & TypeScript Mastery",
      slug: "full-stack-nextjs-mastery",
      description: "Master modern full-stack web development using Next.js App Router, TypeScript, Prisma, Server Actions, and Tailwind CSS.",
      thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
      objectives: [
        "Build full-stack production-ready applications with Next.js App Router",
        "Implement secure RBAC authentication with JWT sessions",
        "Design scalable relational databases with PostgreSQL & Prisma",
        "Deploy and monitor enterprise Next.js applications",
      ],
      durationHours: 45,
      level: CourseLevel.INTERMEDIATE,
      prerequisites: ["Solid HTML, CSS & JavaScript fundamentals", "Basic familiarity with React"],
      trainerId: trainer.id,
      status: CourseStatus.PUBLISHED,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { slug: "postgresql-neon-database-engineering" },
    update: {},
    create: {
      title: "PostgreSQL & Neon Database Engineering",
      slug: "postgresql-neon-database-engineering",
      description: "Deep dive into relational schema design, query optimization, transactions, connection pooling, and serverless databases.",
      thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
      objectives: [
        "Design 3NF normalized relational schemas",
        "Optimize complex SQL queries with indexing strategies",
        "Manage connection pooling and serverless Neon branching",
      ],
      durationHours: 30,
      level: CourseLevel.ADVANCED,
      prerequisites: ["Basic SQL queries knowledge"],
      trainerId: trainer.id,
      status: CourseStatus.PUBLISHED,
    },
  });
  console.log("✅ Seeded Courses: Full-Stack Next.js & PostgreSQL Engineering");

  // 5. Seed Modules & Lessons for Course 1
  const module1 = await prisma.courseModule.create({
    data: {
      courseId: course1.id,
      title: "Module 1: Architecture & Modern Next.js Foundation",
      description: "Understanding server components, client boundaries, routing, and project anatomy.",
      orderIndex: 1,
      lessons: {
        create: [
          {
            title: "Lesson 1: Introduction to Next.js App Router Architecture",
            description: "Deep dive into App Router, Server Components vs Client Components, and performance characteristics.",
            contentType: ContentType.VIDEO,
            contentUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            durationMinutes: 18,
            orderIndex: 1,
            isFreePreview: true,
          },
          {
            title: "Lesson 2: Server Actions & Data Mutation Patterns",
            description: "Secure data mutations directly from the server without exposing external endpoints.",
            contentType: ContentType.VIDEO,
            contentUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            durationMinutes: 24,
            orderIndex: 2,
            isFreePreview: false,
          },
        ],
      },
    },
  });

  const module2 = await prisma.courseModule.create({
    data: {
      courseId: course1.id,
      title: "Module 2: Secure Authentication & Role-Based Access Control",
      description: "Implementing JWT sessions, bcrypt hashing, and multi-tenant role guards.",
      orderIndex: 2,
      lessons: {
        create: [
          {
            title: "Lesson 3: JWT Sessions and Secure Cookie Management",
            description: "Step-by-step implementation of stateless secure session tokens.",
            contentType: ContentType.VIDEO,
            contentUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            durationMinutes: 30,
            orderIndex: 1,
            isFreePreview: false,
          },
        ],
      },
    },
  });
  console.log("✅ Seeded Course Modules and Lessons.");

  // 6. Seed Quiz for Course 1
  const quiz = await prisma.quiz.create({
    data: {
      courseId: course1.id,
      title: "Next.js Core Concepts & RBAC Assessment",
      description: "Test your knowledge on Server Components, Server Actions, and Role-Based Authorization.",
      timeLimitMinutes: 20,
      passingMarks: 70,
      maxAttempts: 3,
      status: CourseStatus.PUBLISHED,
      questions: {
        create: [
          {
            question: "By default, in the Next.js App Router, components in the app directory are:",
            type: QuestionType.MCQ,
            difficulty: QuestionDifficulty.EASY,
            marks: 10,
            explanation: "In Next.js App Router, all components inside the app directory are React Server Components (RSC) by default unless marked with 'use client'.",
            orderIndex: 1,
            options: {
              create: [
                { text: "React Server Components (RSC)", isCorrect: true, orderIndex: 1 },
                { text: "Client Components", isCorrect: false, orderIndex: 2 },
                { text: "Static HTML Templates", isCorrect: false, orderIndex: 3 },
                { text: "Web Components", isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            question: "Which HTTP header is standard for protecting session cookies against cross-site scripting (XSS)?",
            type: QuestionType.MCQ,
            difficulty: QuestionDifficulty.MEDIUM,
            marks: 10,
            explanation: "HttpOnly flags prevent client-side JavaScript from reading the cookie.",
            orderIndex: 2,
            options: {
              create: [
                { text: "HttpOnly", isCorrect: true, orderIndex: 1 },
                { text: "SameSite=Strict only", isCorrect: false, orderIndex: 2 },
                { text: "X-Frame-Options", isCorrect: false, orderIndex: 3 },
                { text: "Secure-Only", isCorrect: false, orderIndex: 4 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Seeded Quiz and Questions:", quiz.title);

  // 7. Seed Assignment for Course 1
  const assignment = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      title: "Capstone Milestone 1: Secure Auth & RBAC Architecture",
      description: "Implement a full authentication module with student/trainer/admin roles and submission verification.",
      instructions: "Submit your GitHub repository link and a zipped export of your architectural diagram with tests.",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      totalMarks: 100,
      allowedFileTypes: ["pdf", "zip", "docx"],
      maxFileSizeMb: 20,
    },
  });
  console.log("✅ Seeded Assignment:", assignment.title);

  // 8. Seed Batches
  const batch1 = await prisma.batch.create({
    data: {
      name: "Next.js Cohort Alpha (Spring 2026)",
      courseId: course1.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: BatchStatus.ONGOING,
      trainers: {
        create: [{ trainerId: trainer.id }],
      },
      students: {
        create: [
          { userId: students[0].id },
          { userId: students[1].id },
        ],
      },
    },
  });
  console.log("✅ Seeded Batch:", batch1.name);

  // 9. Enroll Students in Course 1
  for (let i = 0; i < 2; i++) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: students[i].id,
          courseId: course1.id,
        },
      },
      update: { batchId: batch1.id },
      create: {
        userId: students[i].id,
        courseId: course1.id,
        batchId: batch1.id,
      },
    });

    await prisma.courseProgress.upsert({
      where: {
        userId_courseId: {
          userId: students[i].id,
          courseId: course1.id,
        },
      },
      update: {},
      create: {
        userId: students[i].id,
        courseId: course1.id,
        completedLessonsCount: 1,
        totalLessonsCount: 3,
        progressPercent: 33.33,
      },
    });
  }

  // 10. Seed Live Class (clean up old ones if present)
  await prisma.liveClass.deleteMany({
    where: { batchId: batch1.id },
  });
  await prisma.liveClass.create({
    data: {
      batchId: batch1.id,
      trainerId: trainer.id,
      title: "Live Q&A & Code Review: Server Actions & Prisma Optimization",
      description: "Interactive session addressing student questions on transactional queries and Next.js mutations.",
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3600000),
      meetUrl: "https://meet.google.com/abc-defg-hij",
      status: LiveClassStatus.SCHEDULED,
    },
  });
  console.log("✅ Seeded Live Class.");

  console.log("\n🎉 LMS Database Seeding Completed Successfully!");
  console.log("--------------------------------------------------");
  console.log("Default Credentials for testing:");
  console.log("Admin:   sulagadleaishwarya@gmail.com | 123");
  console.log("Trainer: trainer@institute.edu        | Password123!");
  console.log("Student: sophia.student@institute.edu | Password123!");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
