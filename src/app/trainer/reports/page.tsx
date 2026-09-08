import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportsClient from "@/app/components/reports/ReportsClient";

export default async function TrainerReportsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const [courses, batches] = await Promise.all([
    prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { trainers: { some: { trainerId } } },
            ],
          },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Faculty Reports & CSV/Excel Exports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate and download reports with custom date ranges, course scopes, and batch filters for your assigned cohorts.
        </p>
      </div>

      <ReportsClient
        role={isAdmin ? "ADMIN" : "TRAINER"}
        courses={courses}
        batches={batches}
      />
    </div>
  );
}


