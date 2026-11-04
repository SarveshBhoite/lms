import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import imagekit from "@/lib/imagekit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "assignments";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided in form data" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Upload directly to ImageKit
    const uploadResult = await imagekit.upload({
      file: buffer.toString("base64"),
      fileName: cleanOriginalName,
      folder: `/jvm_lms/${safeCategory}`,
      useUniqueFileName: true,
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      message: "File uploaded successfully to ImageKit cloud storage",
    });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to ImageKit" },
      { status: 500 }
    );
  }
}
