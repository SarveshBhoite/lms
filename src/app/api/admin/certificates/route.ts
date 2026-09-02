import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const courseId = searchParams.get("courseId") || "";
    const batchId = searchParams.get("batchId") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (startDate || endDate) {
      whereClause.issueDate = {};
      if (startDate) whereClause.issueDate.gte = new Date(startDate);
      if (endDate) whereClause.issueDate.lte = new Date(endDate);
    }

    if (search) {
      whereClause.OR = [
        { certificateNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { course: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { phone: true, avatarUrl: true } },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            level: true,
            durationHours: true,
            trainer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    // Post-filter by batch if requested
    let filteredCertificates = certificates;
    if (batchId) {
      filteredCertificates = certificates.filter((cert) => {
        const metadata: any = cert.metadata;
        return metadata?.batchId === batchId || metadata?.batchName?.toLowerCase().includes(batchId.toLowerCase());
      });
    }

    // Fetch lists for filter dropdowns
    const courses = await prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    const batches = await prisma.batch.findMany({
      select: { id: true, name: true, courseId: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        certificates: filteredCertificates,
        courses,
        batches,
        stats: {
          totalCertificates: certificates.length,
          verifiedCredentials: certificates.length,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
