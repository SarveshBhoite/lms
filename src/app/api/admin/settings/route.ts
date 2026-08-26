import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { INSTITUTE_CONFIG } from "@/lib/branding";

// In-memory / configuration state (with persistent fallback defaults)
let currentSettings = {
  instituteName: INSTITUTE_CONFIG.name,
  shortName: INSTITUTE_CONFIG.shortName,
  tagline: INSTITUTE_CONFIG.tagline,
  supportEmail: INSTITUTE_CONFIG.supportEmail,
  supportPhone: INSTITUTE_CONFIG.supportPhone,
  allowPublicRegistration: true,
  enableEmailVerification: false,
  maintenanceMode: false,
};

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  return NextResponse.json({ settings: currentSettings });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    currentSettings = {
      ...currentSettings,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: "System & branding settings updated successfully",
      settings: currentSettings,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update institutional settings" },
      { status: 500 }
    );
  }
}
