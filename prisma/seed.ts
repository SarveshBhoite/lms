import { PrismaClient, Role, CourseStatus, CourseLevel, ContentType, QuestionType, QuestionDifficulty, QuizStatus, SubmissionStatus, BatchStatus, LiveClassStatus, AttendanceStatus, EnrollmentStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting LMS database cleanup and seeding process...");

  // ----------------------------------------------------
  // 1. CLEANUP (Reverse Topological Order)
  // ----------------------------------------------------
  console.log("🧹 Clearing existing test records...");
  await prisma.trainerNote.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.liveClass.deleteMany();
  await prisma.batchStudent.deleteMany();
  await prisma.batchTrainer.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.assignmentFeedback.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.course.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleanup complete.");

  // Password hashes using bcrypt (salt round 10)
  const adminPasswordHash = await bcrypt.hash("123", 10);
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // ----------------------------------------------------
  // 2. CREATE ADMIN ACCOUNT (1)
  // ----------------------------------------------------
  console.log("👤 Seeding Admin account...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Sulagadle Aishwarya",
      email: "sulagadleaishwarya@gmail.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      isActive: true,
      profile: {
        create: {
          phone: "+1 (555) 019-2831",
          bio: "Super Administrator and Chief Academic Officer for Institutional LMS.",
          avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
          designation: "System Administrator & Dean",
        },
      },
    },
  });

  // ----------------------------------------------------
  // 3. CREATE TRAINER ACCOUNTS (Exactly 5)
  // ----------------------------------------------------
  console.log("👨‍🏫 Seeding 5 Trainer accounts...");
  const trainerData = [
    {
      name: "Dr. Alexander Vance",
      email: "trainer@institute.edu", // Preset primary trainer
      designation: "Senior Web Architecture Lead",
      bio: "12+ years of experience building enterprise web systems, microservices, and React/Next.js applications.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "Dr. Eleanor Chen",
      email: "dr.chen@institute.edu",
      designation: "Data Science & AI Chair",
      bio: "Former AI Researcher at DeepMind. Specialist in Deep Learning, PyTorch, and Production Machine Learning.",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "Marcus Brody",
      email: "marcus.devops@institute.edu",
      designation: "Cloud & Infrastructure Specialist",
      bio: "Certified AWS & Kubernetes Architect focusing on GitOps, CI/CD pipelines, and zero-trust cloud security.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "Sarah Jenkins",
      email: "sarah.cyber@institute.edu",
      designation: "Ethical Hacking Lead",
      bio: "Offensive Security Certified Professional (OSCP) with expertise in network penetration testing and application auditing.",
      avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "David Miller",
      email: "david.mobile@institute.edu",
      designation: "Mobile Systems Architect",
      bio: "Cross-platform mobile developer with 30+ published iOS and Android applications using React Native and Flutter.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    },
  ];

  const trainers = [];
  for (const t of trainerData) {
    const trainer = await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        passwordHash: defaultPasswordHash,
        role: Role.TRAINER,
        isEmailVerified: true,
        isActive: true,
        profile: {
          create: {
            designation: t.designation,
            bio: t.bio,
            avatarUrl: t.avatarUrl,
            phone: `+1 (555) 012-${Math.floor(1000 + Math.random() * 9000)}`,
            githubUrl: `https://github.com/${t.email.split("@")[0]}`,
            linkedinUrl: `https://linkedin.com/in/${t.email.split("@")[0]}`,
          },
        },
      },
    });
    trainers.push(trainer);
  }

  // ----------------------------------------------------
  // 4. CREATE STUDENT ACCOUNTS (45 Students)
  // ----------------------------------------------------
  console.log("🎓 Seeding 45 Student accounts...");
  const firstNames = [
    "Sophia", "Liam", "Noah", "Olivia", "Ava", "Ethan", "Jackson", "Lucas", "Oliver", "Emma",
    "Amelia", "Mia", "Harper", "Evelyn", "James", "Benjamin", "Logan", "Alexander", "Elijah", "Charlotte",
    "Abigail", "Emily", "Ella", "Mason", "Michael", "Daniel", "Henry", "Jackson", "Sebastian", "Aria",
    "Chloe", "Grace", "Zoey", "Penelope", "Matthew", "Samuel", "David", "Joseph", "Carter", "Riley",
    "Nora", "Lily", "Hannah", "Zoe", "Stella"
  ];
  const lastNames = [
    "Martinez", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
    "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson",
    "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis",
    "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
    "Flores", "Green", "Adams", "Nelson", "Baker"
  ];

  const students = [];
  // Preset primary student: sophia.student@institute.edu
  const primaryStudent = await prisma.user.create({
    data: {
      name: "Sophia Martinez",
      email: "sophia.student@institute.edu",
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      isEmailVerified: true,
      isActive: true,
      profile: {
        create: {
          phone: "+1 (555) 987-6543",
          bio: "Senior CS Undergraduate specializing in Full-Stack Web Development & Cloud Systems.",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
          githubUrl: "https://github.com/sophiamartinez",
          linkedinUrl: "https://linkedin.com/in/sophiamartinez",
        },
      },
    },
  });
  students.push(primaryStudent);

  for (let i = 1; i < 45; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const name = `${fn} ${ln}`;
    const email = `student${i}@institute.edu`;
    const isActive = i !== 42 && i !== 43 && i !== 44; // Deactivate 3 students for status scenario

    const student = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: defaultPasswordHash,
        role: Role.STUDENT,
        isEmailVerified: true,
        isActive,
        profile: {
          create: {
            phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
            bio: `Enthusiastic computer science student passionate about technology and software development.`,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          },
        },
      },
    });
    students.push(student);
  }

  // ----------------------------------------------------
  // 5. CREATE COURSES (5 Courses)
  // ----------------------------------------------------
  console.log("📚 Seeding 5 Courses with Modules, Lessons & Resources...");
  const coursesData = [
    {
      title: "Full-Stack Web Development & Microservices",
      slug: "fullstack-web-dev",
      description: "Master modern web development from HTML/CSS to Next.js 16, React 19, TypeScript, Node.js, REST APIs, GraphQL, and PostgreSQL with Prisma ORM.",
      durationHours: 60,
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      trainerId: trainers[0].id, // Dr. Alexander Vance
      objectives: ["Build full-stack web apps with Next.js App Router", "Master Relational Databases with Prisma ORM", "Implement RBAC & Secure Auth"],
      prerequisites: ["Basic HTML/JS knowledge"],
      modules: [
        {
          title: "Module 1: Architecture & Server-Side Rendering",
          description: "Understanding App Router, Server Components vs Client Components, and Next.js 16 conventions.",
          orderIndex: 1,
          lessons: [
            {
              title: "Introduction to Next.js 16 App Router",
              contentType: ContentType.VIDEO,
              contentUrl: "https://www.youtube.com/watch?v=wm5gMKCOs2U",
              durationMinutes: 45,
              orderIndex: 1,
              isFreePreview: true,
              resources: [
                { title: "App Router Architecture Diagram", fileType: "PDF", fileSize: 2450000, fileUrl: "https://example.com/docs/app-router.pdf" },
                { title: "Starter Code Repository", fileType: "LINK", fileSize: 0, fileUrl: "https://github.com/example/nextjs-starter" },
              ],
            },
            {
              title: "Server Components vs Client Components",
              contentType: ContentType.TEXT,
              textContent: "React Server Components run exclusively on the server, producing zero client bundle size overhead. Client components are demarcated using 'use client'.",
              durationMinutes: 30,
              orderIndex: 2,
              isFreePreview: false,
              resources: [],
            },
          ],
        },
        {
          title: "Module 2: Database Modeling & Prisma ORM",
          description: "Relational database schema design, migrations, driver adapters, and high-performance querying.",
          orderIndex: 2,
          lessons: [
            {
              title: "Designing Scalable PostgreSQL Schemas with Prisma",
              contentType: ContentType.VIDEO,
              contentUrl: "https://www.youtube.com/watch?v=ReK0172h_fA",
              durationMinutes: 50,
              orderIndex: 1,
              isFreePreview: false,
              resources: [
                { title: "Prisma Cheat Sheet", fileType: "PDF", fileSize: 1800000, fileUrl: "https://example.com/docs/prisma-cheatsheet.pdf" },
              ],
            },
            {
              title: "CRUD Operations & Transactional Safety",
              contentType: ContentType.CODE,
              textContent: "import { prisma } from '@/lib/prisma';\n\nconst user = await prisma.user.findUnique({ where: { email } });",
              durationMinutes: 40,
              orderIndex: 2,
              isFreePreview: false,
              resources: [],
            },
          ],
        },
      ],
    },
    {
      title: "Data Science, Machine Learning & AI Engineering",
      slug: "datascience-ai-masterclass",
      description: "Comprehensive data science curriculum covering Python, NumPy, Pandas, Scikit-Learn, TensorFlow, PyTorch, Large Language Models (LLMs), and RAG pipeline architectures.",
      durationHours: 80,
      level: CourseLevel.ADVANCED,
      status: CourseStatus.PUBLISHED,
      trainerId: trainers[1].id, // Dr. Eleanor Chen
      objectives: ["Build machine learning models from scratch", "Deploy Neural Networks with PyTorch", "Implement Retrieval-Augmented Generation (RAG)"],
      prerequisites: ["Python programming background"],
      modules: [
        {
          title: "Module 1: Exploratory Data Analysis & Statistics",
          description: "Data manipulation, visualization, hypothesis testing, and feature engineering with Pandas.",
          orderIndex: 1,
          lessons: [
            {
              title: "Data Wrangling with Pandas & NumPy",
              contentType: ContentType.VIDEO,
              contentUrl: "https://www.youtube.com/watch?v=dcqPhpY7tWk",
              durationMinutes: 60,
              orderIndex: 1,
              isFreePreview: true,
              resources: [
                { title: "Housing Prices Dataset (CSV)", fileType: "CODE", fileSize: 4500000, fileUrl: "https://example.com/datasets/housing.csv" },
              ],
            },
          ],
        },
        {
          title: "Module 2: Deep Learning & Neural Networks",
          description: "Building multi-layer perceptrons, convolutional neural networks, and transformers.",
          orderIndex: 2,
          lessons: [
            {
              title: "PyTorch Fundamentals & Model Training Loops",
              contentType: ContentType.VIDEO,
              contentUrl: "https://www.youtube.com/watch?v=vT1JzLTH4G4",
              durationMinutes: 65,
              orderIndex: 1,
              isFreePreview: false,
              resources: [
                { title: "PyTorch Jupyter Notebook", fileType: "CODE", fileSize: 3200000, fileUrl: "https://example.com/notebooks/pytorch_intro.ipynb" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Cloud DevOps, Kubernetes & Infrastructure Security",
      slug: "cloud-devops-kubernetes",
      description: "Learn infrastructure as code, Terraform, Docker containerization, Kubernetes orchestration, Prometheus monitoring, and AWS cloud engineering.",
      durationHours: 50,
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      trainerId: trainers[2].id, // Marcus Brody
      objectives: ["Containerize microservices with Docker", "Deploy production Kubernetes clusters", "Automate CI/CD pipelines with GitHub Actions"],
      prerequisites: ["Linux CLI fundamentals"],
      modules: [
        {
          title: "Module 1: Docker Containerization",
          description: "Multi-stage Dockerfiles, container networking, volumes, and Docker Compose.",
          orderIndex: 1,
          lessons: [
            {
              title: "Building Production Docker Images",
              contentType: ContentType.VIDEO,
              contentUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE",
              durationMinutes: 45,
              orderIndex: 1,
              isFreePreview: true,
              resources: [
                { title: "Docker Security Guide", fileType: "PDF", fileSize: 1200000, fileUrl: "https://example.com/docs/docker-security.pdf" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Cyber Security, Penetration Testing & Ethical Hacking",
      slug: "cybersecurity-ethical-hacking",
      description: "Hands-on offensive security, network sniffing, Wireshark, Metasploit, web application security (OWASP Top 10), and defensive hardening.",
      durationHours: 55,
      level: CourseLevel.ALL_LEVELS,
      status: CourseStatus.PUBLISHED,
      trainerId: trainers[3].id, // Sarah Jenkins
      objectives: ["Perform web app penetration tests", "Identify OWASP Top 10 vulnerabilities", "Implement network defense protocols"],
      prerequisites: ["Basic networking concepts"],
      modules: [
        {
          title: "Module 1: Web Application Penetration Testing",
          description: "SQL Injection, Cross-Site Scripting (XSS), CSRF, and Authentication Bypass techniques.",
          orderIndex: 1,
          lessons: [
            {
              title: "OWASP Top 10 Vulnerabilities Deep-Dive",
              contentType: ContentType.TEXT,
              textContent: "The OWASP Top 10 represents the most critical security risks facing web applications today. Key threats include Broken Access Control, Cryptographic Failures, and Injection.",
              durationMinutes: 50,
              orderIndex: 1,
              isFreePreview: true,
              resources: [],
            },
          ],
        },
      ],
    },
    {
      title: "Mobile App Development with React Native & Expo",
      slug: "mobile-app-dev-react-native",
      description: "Build cross-platform mobile apps for iOS and Android using React Native, Expo Router, Native Device APIs, Push Notifications, and SQLite local storage.",
      durationHours: 45,
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      trainerId: trainers[4].id, // David Miller
      objectives: ["Develop iOS & Android apps with a single codebase", "Integrate Native Device Camera & GPS", "Publish to App Store and Google Play"],
      prerequisites: ["JavaScript/React basics"],
      modules: [
        {
          title: "Module 1: Mobile UI & Navigation",
          description: "Flexbox layouts, Expo Router file-based navigation, and animated components.",
          orderIndex: 1,
          lessons: [
            {
              title: "React Native Navigation & Navigation Stacks",
              contentType: ContentType.VIDEO,
              contentUrl: "https://www.youtube.com/watch?v=bCpFbERgj7s",
              durationMinutes: 40,
              orderIndex: 1,
              isFreePreview: true,
              resources: [
                { title: "React Native Component Cheatsheet", fileType: "PDF", fileSize: 1500000, fileUrl: "https://example.com/docs/react-native-cheat.pdf" },
              ],
            },
          ],
        },
      ],
    },
  ];

  const createdCourses = [];
  for (const cData of coursesData) {
    const { modules, ...courseFields } = cData;
    const course = await prisma.course.create({
      data: {
        ...courseFields,
        modules: {
          create: modules.map((m) => ({
            title: m.title,
            description: m.description,
            orderIndex: m.orderIndex,
            lessons: {
              create: m.lessons.map((l) => ({
                title: l.title,
                contentType: l.contentType,
                contentUrl: l.contentUrl || null,
                textContent: l.textContent || null,
                durationMinutes: l.durationMinutes,
                orderIndex: l.orderIndex,
                isFreePreview: l.isFreePreview,
                resources: {
                  create: l.resources.map((r) => ({
                    title: r.title,
                    fileType: r.fileType,
                    fileSize: r.fileSize,
                    fileUrl: r.fileUrl,
                    isPublic: true,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
    createdCourses.push(course);
  }

  // ----------------------------------------------------
  // 6. CREATE BATCHES (Multiple cohorts per course)
  // ----------------------------------------------------
  console.log("🏫 Seeding Batches (including multi-trainer batches)...");
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const prevMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const batch1 = await prisma.batch.create({
    data: {
      name: "Full-Stack Web Dev - Cohort 2026-A",
      courseId: createdCourses[0].id,
      startDate: prevMonth,
      endDate: nextMonth,
      status: BatchStatus.ONGOING,
      trainers: {
        create: [{ trainerId: trainers[0].id }],
      },
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      name: "Full-Stack Web Dev - Cohort 2026-B",
      courseId: createdCourses[0].id,
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 60 * 24 * 60 * 60 * 1000),
      status: BatchStatus.UPCOMING,
      trainers: {
        create: [{ trainerId: trainers[0].id }],
      },
    },
  });

  const batch3 = await prisma.batch.create({
    data: {
      name: "Data Science Masterclass - Batch 1",
      courseId: createdCourses[1].id,
      startDate: prevMonth,
      endDate: nextMonth,
      status: BatchStatus.ONGOING,
      trainers: {
        create: [{ trainerId: trainers[1].id }],
      },
    },
  });

  // Multi-Trainer Batch (Cloud DevOps with Trainer 2 & Trainer 0)
  const batch4 = await prisma.batch.create({
    data: {
      name: "Cloud DevOps & Multi-Cloud Infrastructure",
      courseId: createdCourses[2].id,
      startDate: prevMonth,
      endDate: nextMonth,
      status: BatchStatus.ONGOING,
      trainers: {
        create: [
          { trainerId: trainers[2].id },
          { trainerId: trainers[0].id },
        ],
      },
    },
  });

  const batch5 = await prisma.batch.create({
    data: {
      name: "Cyber Security Intensive - Spring 2026",
      courseId: createdCourses[3].id,
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: BatchStatus.COMPLETED,
      trainers: {
        create: [{ trainerId: trainers[3].id }],
      },
    },
  });

  const batch6 = await prisma.batch.create({
    data: {
      name: "Mobile Dev Intensive",
      courseId: createdCourses[4].id,
      startDate: prevMonth,
      endDate: nextMonth,
      status: BatchStatus.ONGOING,
      trainers: {
        create: [{ trainerId: trainers[4].id }],
      },
    },
  });

  const batches = [batch1, batch2, batch3, batch4, batch5, batch6];

  // ----------------------------------------------------
  // 7. ENROLLMENTS & STUDENT SCENARIOS
  // ----------------------------------------------------
  console.log("📝 Enrolling students with realistic progress & scenarios...");

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    // Assign student to course and batch based on index
    const courseIndex = i % 5;
    const course = createdCourses[courseIndex];

    let batch = batch1;
    if (courseIndex === 0) batch = i % 2 === 0 ? batch1 : batch2;
    else if (courseIndex === 1) batch = batch3;
    else if (courseIndex === 2) batch = batch4;
    else if (courseIndex === 3) batch = batch5;
    else if (courseIndex === 4) batch = batch6;

    // Determine student progress scenario
    let isCompleted = false;
    let progressPercent = 0;

    if (i < 5 || courseIndex === 3) {
      // Completed scenario
      isCompleted = true;
      progressPercent = 100.0;
    } else if (i >= 5 && i < 38) {
      // Active in-progress scenario
      progressPercent = Math.min(95, Math.floor(25 + Math.random() * 65));
    } else {
      // New enrolled scenario (0%)
      progressPercent = 0.0;
    }

    const enrollmentStatus = isCompleted
      ? EnrollmentStatus.COMPLETED
      : student.isActive
      ? EnrollmentStatus.ACTIVE
      : EnrollmentStatus.SUSPENDED;

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        batchId: batch.id,
        status: enrollmentStatus,
        completedAt: isCompleted ? new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
      },
    });

    await prisma.batchStudent.create({
      data: {
        batchId: batch.id,
        userId: student.id,
      },
    });

    // Seed LessonProgress & CourseProgress
    const courseLessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = courseLessons.length;
    const completedCount = isCompleted
      ? totalLessons
      : Math.floor((progressPercent / 100) * totalLessons);

    for (let lIdx = 0; lIdx < courseLessons.length; lIdx++) {
      const lesson = courseLessons[lIdx];
      const lessonDone = lIdx < completedCount;

      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: lesson.id,
          isCompleted: lessonDone,
          completionPercent: lessonDone ? 100.0 : 0.0,
          completedAt: lessonDone ? new Date() : null,
        },
      });
    }

    await prisma.courseProgress.create({
      data: {
        userId: student.id,
        courseId: course.id,
        completedLessonsCount: completedCount,
        totalLessonsCount: totalLessons,
        progressPercent: isCompleted ? 100.0 : totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // If student is completed, issue Certificate
    if (isCompleted && student.isActive) {
      const certNum = `CERT-2026-${String(i + 1).padStart(6, "0")}`;
      await prisma.certificate.create({
        data: {
          certificateNumber: certNum,
          userId: student.id,
          courseId: course.id,
          issueDate: new Date(),
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(certNum)}`,
          metadata: {
            studentName: student.name,
            courseName: course.title,
            grade: "Distinction",
            instructorName: trainers[0].name,
          },
        },
      });
    }
  }

  // ----------------------------------------------------
  // 8. LIVE CLASSES & ATTENDANCE
  // ----------------------------------------------------
  console.log("🎥 Seeding Live Classes & Student Attendance...");
  const liveClassesData = [
    {
      title: "Live Q&A: Next.js Server Actions & App Router Security",
      description: "Interactive session covering middleware guards, session encryption, and form actions.",
      batchId: batch1.id,
      trainerId: trainers[0].id,
      scheduledDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      meetUrl: "https://meet.google.com/abc-defg-hij",
      status: LiveClassStatus.COMPLETED,
    },
    {
      title: "Live Cohort Lab: Building RAG Pipelines with PyTorch",
      description: "Hands-on implementation of vector embeddings and cosine similarity search.",
      batchId: batch3.id,
      trainerId: trainers[1].id,
      scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
      meetUrl: "https://meet.google.com/xyz-uvwx-rst",
      status: LiveClassStatus.SCHEDULED,
    },
    {
      title: "Emergency Office Hours: Kubernetes Cluster Recovery",
      description: "Troubleshooting pod crash loop backoffs and ingress routing problems.",
      batchId: batch4.id,
      trainerId: trainers[2].id,
      scheduledDate: now,
      startTime: now,
      endTime: new Date(now.getTime() + 60 * 60 * 1000),
      meetUrl: "https://meet.google.com/live-devops-class",
      status: LiveClassStatus.LIVE,
    },
    {
      title: "Guest Masterclass: Penetration Testing Industry Standards",
      description: "Cancelled due to speaker scheduling conflict.",
      batchId: batch5.id,
      trainerId: trainers[3].id,
      scheduledDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      startTime: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      meetUrl: "https://meet.google.com/cancelled-session",
      status: LiveClassStatus.CANCELLED,
    },
  ];

  for (const lcData of liveClassesData) {
    const liveClass = await prisma.liveClass.create({
      data: lcData,
    });

    // Fetch students in this batch for attendance
    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId: lcData.batchId },
      include: { user: true },
    });

    const statuses = [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT, AttendanceStatus.EXCUSED];
    for (let sIdx = 0; sIdx < batchStudents.length; sIdx++) {
      const bs = batchStudents[sIdx];
      const status = statuses[sIdx % statuses.length];

      await prisma.attendance.create({
        data: {
          liveClassId: liveClass.id,
          userId: bs.userId,
          status,
          joinedTime: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE ? new Date() : null,
        },
      });
    }
  }

  // ----------------------------------------------------
  // 9. QUIZZES, QUESTIONS & ATTEMPTS
  // ----------------------------------------------------
  console.log("🧩 Seeding Quizzes, MCQ Questions & Student Attempts...");
  const quiz1 = await prisma.quiz.create({
    data: {
      courseId: createdCourses[0].id,
      title: "Next.js Core Concepts & RBAC Assessment",
      description: "Test your understanding of Next.js App Router, Server Components, and Middleware RBAC protection.",
      timeLimitMinutes: 20,
      passingMarks: 70,
      maxAttempts: 3,
      status: QuizStatus.PUBLISHED,
      questions: {
        create: [
          {
            question: "By default, in the Next.js App Router, components in the app directory are:",
            type: QuestionType.MCQ,
            difficulty: QuestionDifficulty.EASY,
            marks: 10,
            explanation: "In Next.js App Router, components default to Server Components unless specified with 'use client'.",
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
            question: "Which cookie attribute prevents client-side JavaScript from accessing session tokens?",
            type: QuestionType.MCQ,
            difficulty: QuestionDifficulty.MEDIUM,
            marks: 10,
            explanation: "The HttpOnly flag ensures JavaScript cannot read cookie values via document.cookie, mitigating XSS.",
            orderIndex: 2,
            options: {
              create: [
                { text: "HttpOnly", isCorrect: true, orderIndex: 1 },
                { text: "SameSite=Strict", isCorrect: false, orderIndex: 2 },
                { text: "Secure", isCorrect: false, orderIndex: 3 },
                { text: "Domain", isCorrect: false, orderIndex: 4 },
              ],
            },
          },
        ],
      },
    },
    include: {
      questions: { include: { options: true } },
    },
  });

  // Seed QuizAttempt for Primary Student (Sophia Martinez)
  const attempt1 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      userId: primaryStudent.id,
      score: 20.0,
      totalMarks: 20,
      isPassed: true,
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
      timeTakenSec: 480,
    },
  });

  for (const q of quiz1.questions) {
    const correctOpt = q.options.find((o) => o.isCorrect);
    if (correctOpt) {
      await prisma.quizAnswer.create({
        data: {
          quizAttemptId: attempt1.id,
          questionId: q.id,
          selectedOptionIds: [correctOpt.id],
          isCorrect: true,
          marksAwarded: q.marks,
        },
      });
    }
  }

  // ----------------------------------------------------
  // 10. ASSIGNMENTS, SUBMISSIONS & FEEDBACK
  // ----------------------------------------------------
  console.log("📑 Seeding Assignments, Submissions & Faculty Feedback...");
  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: createdCourses[0].id,
      title: "Capstone Milestone 1: Secure Auth & RBAC Architecture",
      description: "Implement a full authentication module with student/trainer/admin roles, Next.js Middleware guards, and verifiable JWT tokens.",
      instructions: "Submit your GitHub repository URL and a detailed architectural README.",
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      allowedFileTypes: ["zip", "pdf", "docx"],
      maxFileSizeMb: 25,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      courseId: createdCourses[0].id,
      title: "Prisma Schema Design & Relational Normalization",
      description: "Design a complete 3NF database schema for an e-commerce platform including carts, orders, and payments.",
      instructions: "Provide your schema.prisma file and SQL migration scripts.",
      deadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Deadline passed
      totalMarks: 100,
      allowedFileTypes: ["zip", "pdf"],
      maxFileSizeMb: 10,
    },
  });

  // Submission 1: Evaluated (Sophia Martinez)
  const sub1 = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment2.id,
      userId: primaryStudent.id,
      fileUrl: "https://github.com/sophiamartinez/lms-prisma-assignment",
      fileName: "prisma-schema-submission.zip",
      fileSize: 4200000,
      notes: "Implemented 3NF schema with indexes on foreign keys and compound unique constraints.",
      status: SubmissionStatus.EVALUATED,
      submittedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignmentFeedback.create({
    data: {
      submissionId: sub1.id,
      trainerId: trainers[0].id,
      marksAwarded: 96.5,
      feedbackText: "Outstanding work! Excellent schema indexing, foreign key cascade strategies, and clean model definitions.",
    },
  });

  // Submission 2: Resubmission Requested (Student 1)
  const sub2 = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment2.id,
      userId: students[1].id,
      fileUrl: "https://github.com/student1/draft-schema",
      fileName: "draft-schema.zip",
      fileSize: 1200000,
      notes: "Initial draft submission.",
      status: SubmissionStatus.RESUBMISSION_REQUESTED,
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignmentFeedback.create({
    data: {
      submissionId: sub2.id,
      trainerId: trainers[0].id,
      marksAwarded: 45.0,
      feedbackText: "Missing compound index on Enrollment table. Please address foreign key cascading rules and resubmit.",
    },
  });

  // Submission 3: Submitted / Pending Evaluation (Student 2)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      userId: students[2].id,
      fileUrl: "https://github.com/student2/capstone-milestone-1",
      fileName: "capstone1.zip",
      fileSize: 8500000,
      notes: "Ready for review by Dr. Vance.",
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  // ----------------------------------------------------
  // 11. NOTIFICATIONS, TRAINER NOTES & ACTIVITY LOGS
  // ----------------------------------------------------
  console.log("🔔 Seeding Notifications, Trainer Notes & Audit Logs...");
  await prisma.notification.createMany({
    data: [
      {
        userId: primaryStudent.id,
        title: "Assignment Evaluated",
        message: "Your submission for 'Prisma Schema Design' was graded 96.5/100 by Dr. Alexander Vance.",
        type: NotificationType.ASSIGNMENT_EVALUATED,
        isRead: false,
        actionUrl: `/student/assignments/${assignment2.id}`,
      },
      {
        userId: primaryStudent.id,
        title: "New Quiz Published",
        message: "A new quiz 'Next.js Core Concepts & RBAC Assessment' has been published.",
        type: NotificationType.QUIZ_PUBLISHED,
        isRead: true,
        actionUrl: `/student/quizzes/${quiz1.id}`,
      },
      {
        userId: trainers[0].id,
        title: "New Student Submission",
        message: `${students[2].name} submitted Capstone Milestone 1 for evaluation.`,
        type: NotificationType.ASSIGNMENT_DUE,
        isRead: false,
        actionUrl: `/trainer/assignments/${assignment1.id}`,
      },
    ],
  });

  await prisma.trainerNote.create({
    data: {
      studentId: primaryStudent.id,
      trainerId: trainers[0].id,
      content: "Sophia demonstrates exemplary problem-solving skills in backend architecture. Recommended for Lead TA role next semester.",
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "SYSTEM_SEED_INITIALIZED",
        resource: "System:Database",
        details: { status: "SUCCESS", environment: "development" },
      },
      {
        userId: primaryStudent.id,
        action: "USER_LOGIN",
        resource: `User:${primaryStudent.id}`,
        details: { ip: "127.0.0.1", userAgent: "Mozilla/5.0" },
      },
      {
        userId: trainers[0].id,
        action: "COURSE_CREATED",
        resource: `Course:${createdCourses[0].id}`,
        details: { title: createdCourses[0].title },
      },
    ],
  });

  // ----------------------------------------------------
  // SUMMARY & PRINT CREDENTIALS
  // ----------------------------------------------------
  console.log("\n=======================================================");
  console.log("🎉 LMS SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("📊 Summary of Generated Database Entities:");
  console.log(` - Admin Accounts: 1`);
  console.log(` - Trainer Accounts: ${trainers.length}`);
  console.log(` - Student Accounts: ${students.length}`);
  console.log(` - Total Courses: ${createdCourses.length}`);
  console.log(` - Total Batches: ${batches.length}`);
  console.log("=======================================================");
  console.log("🔑 PRESET SYSTEM TEST LOGIN CREDENTIALS:");
  console.log("=======================================================");
  console.log("👑 SUPER ADMIN:");
  console.log(`   Email:    sulagadleaishwarya@gmail.com`);
  console.log(`   Password: 123`);
  console.log("-------------------------------------------------------");
  console.log("👨‍🏫 FACULTY / TRAINERS (All use Password: Password123!):");
  trainers.forEach((t, idx) => {
    console.log(`   ${idx + 1}. ${t.name} (${t.email})`);
  });
  console.log("-------------------------------------------------------");
  console.log("🎓 PRIMARY DEMO STUDENT:");
  console.log(`   Email:    sophia.student@institute.edu`);
  console.log(`   Password: Password123!`);
  console.log("-------------------------------------------------------");
  console.log("🎓 ADDITIONAL SAMPLE STUDENTS (Password: Password123!):");
  for (let i = 1; i <= 5; i++) {
    console.log(`   ${i}. ${students[i].name} (${students[i].email})`);
  }
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
