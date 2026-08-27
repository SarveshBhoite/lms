import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanAndSeed() {
  console.log("🌱 Cleaning LMS database and creating fresh Admin, Trainer & Student accounts...");

  // Execute raw SQL truncate for clean slate
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END $$;
  `);

  console.log("✅ All tables truncated cleanly.");

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
  const adminPasswordHash = await bcrypt.hash("12345678", 10);

  // 1. Super Admin
  const admin = await prisma.user.create({
    data: {
      name: "Raj Bhoite (Super Admin)",
      email: "rajb81008@gmail.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+91 98345 03574",
          bio: "JVM Institute LMS Super Administrator",
          designation: "Super Admin",
        },
      },
    },
  });

  // 2. Lead Trainer
  const trainer = await prisma.user.create({
    data: {
      name: "Prof. Marcus Thorne",
      email: "trainer@institute.edu",
      passwordHash: defaultPasswordHash,
      role: Role.TRAINER,
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+91 98765 43210",
          bio: "Lead Technical Trainer & PySpark Cloud Specialist",
          designation: "Principal Trainer",
        },
      },
    },
  });

  // 3. Active Student
  const student = await prisma.user.create({
    data: {
      name: "Sophia Student",
      email: "student@institute.edu",
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+91 91234 56789",
          bio: "Data Engineering Master Program Enrolled Student",
          designation: "Student",
        },
      },
    },
  });

  console.log(`\n🎉 Accounts Seeded Successfully!`);
  console.log(`--------------------------------------------------`);
  console.log(`1. Super Admin:  ${admin.email}   | Pass: 12345678`);
  console.log(`2. Lead Trainer: ${trainer.email} | Pass: Password123!`);
  console.log(`3. Student:      ${student.email} | Pass: Password123!`);
  console.log(`--------------------------------------------------\n`);
}

cleanAndSeed()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
