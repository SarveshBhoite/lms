import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import imagekit from "@/lib/imagekit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER" && session.role !== "STUDENT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Upload directly to ImageKit
    const uploadResult = await imagekit.upload({
      file: buffer.toString("base64"),
      fileName: cleanFileName,
      folder: "/jvm_lms/images",
      useUniqueFileName: true,
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      fileId: uploadResult.fileId,
    });
  } catch (error: any) {
    console.error("ImageKit image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to ImageKit" },
      { status: 500 }
    );
  }
}
