import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const testTrainers = [
  {
    name: "Vikram Malhotra",
    email: "vikram.trainer@jvm.edu",
    phone: "+91 98201 11223",
    bio: "Senior Java & Cloud Architect with 12+ years experience.",
    designation: "Lead Java & Cloud Trainer",
  },
  {
    name: "Ananya Sharma",
    email: "ananya.trainer@jvm.edu",
    phone: "+91 98202 22334",
    bio: "Full Stack & Next.js specialist trainer.",
    designation: "Senior Web Tech Trainer",
  },
  {
    name: "Rohan Kulkarni",
    email: "rohan.trainer@jvm.edu",
    phone: "+91 98203 33445",
    bio: "DevOps & Cloud Infrastructure engineer.",
    designation: "DevOps & CI/CD Specialist",
  },
  {
    name: "Pooja Mehta",
    email: "pooja.trainer@jvm.edu",
    phone: "+91 98204 44556",
    bio: "Data Science, Machine Learning & Python specialist.",
    designation: "Data & AI Trainer",
  },
];

const testStudents = [
  {
    name: "Aarav Patil",
    email: "aarav.student@jvm.edu",
    phone: "+91 97100 11001",
    bio: "Computer Engineering Student - 3rd Year",
    designation: "Student",
  },
  {
    name: "Sneha Deshmukh",
    email: "sneha.student@jvm.edu",
    phone: "+91 97100 22002",
    bio: "IT Graduate aspiring Cloud Engineer",
    designation: "Student",
  },
  {
    name: "Rahul Verma",
    email: "rahul.student@jvm.edu",
    phone: "+91 97100 33003",
    bio: "Full Stack Development Aspirant",
    designation: "Student",
  },
  {
    name: "Priya Nair",
    email: "priya.student@jvm.edu",
    phone: "+91 97100 44004",
    bio: "Data Analytics & Engineering Enthusiast",
    designation: "Student",
  },
  {
    name: "Aditya Shinde",
    email: "aditya.student@jvm.edu",
    phone: "+91 97100 55005",
    bio: "Backend Java & Microservices learner",
    designation: "Student",
  },
  {
    name: "Neha Joshi",
    email: "neha.student@jvm.edu",
    phone: "+91 97100 66006",
    bio: "Frontend Specialist & React Enthusiast",
    designation: "Student",
  },
  {
    name: "Karan Iyer",
    email: "karan.student@jvm.edu",
    phone: "+91 97100 77007",
    bio: "AI & ML student eager to build real-world models",
    designation: "Student",
  },
  {
    name: "Tanvi Sawant",
    email: "tanvi.student@jvm.edu",
    phone: "+91 97100 88008",
    bio: "Cloud Architecture and DevOps enthusiast",
    designation: "Student",
  },
];

async function seedLogins() {
  console.log("🌱 Creating unlinked test Trainer & Student accounts...");

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
  const createdTrainers: string[] = [];
  const createdStudents: string[] = [];

  // Seed Trainers
  for (const t of testTrainers) {
    const existing = await prisma.user.findUnique({ where: { email: t.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: t.name,
          email: t.email,
          passwordHash: defaultPasswordHash,
          role: Role.TRAINER,
          isEmailVerified: true,
          isActive: true,
          profile: {
            create: {
              phone: t.phone,
              bio: t.bio,
              designation: t.designation,
            },
          },
        },
      });
      createdTrainers.push(t.email);
    } else {
      createdTrainers.push(`${t.email} (already exists)`);
    }
  }

  // Seed Students
  for (const s of testStudents) {
    const existing = await prisma.user.findUnique({ where: { email: s.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          passwordHash: defaultPasswordHash,
          role: Role.STUDENT,
          isEmailVerified: true,
          isActive: true,
          profile: {
            create: {
              phone: s.phone,
              bio: s.bio,
              designation: s.designation,
            },
          },
        },
      });
      createdStudents.push(s.email);
    } else {
      createdStudents.push(`${s.email} (already exists)`);
    }
  }

  console.log("\n✅ Test Logins Created Successfully (No courses, batches, or links attached):");
  console.log("Default Password for all: Password123!\n");
  console.log("👨‍🏫 Trainers:");
  testTrainers.forEach((t) => console.log(` - ${t.name} (${t.email})`));
  console.log("\n👨‍🎓 Students:");
  testStudents.forEach((s) => console.log(` - ${s.name} (${s.email})`));
}

seedLogins()
  .catch((e) => {
    console.error("❌ Error adding test accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
