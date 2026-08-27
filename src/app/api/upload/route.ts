import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "resources";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided in form data" }, { status: 400 });
    }

    // Sanitize category folder name
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "");
    const uploadDir = path.join(process.cwd(), "public", "uploads", safeCategory);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean filename: timestamp_originalName
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const uniqueFilename = `${Date.now()}_${cleanOriginalName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeCategory}/${uniqueFilename}`;

    // Determine file type helper
    let detectedType = "FILE";
    const mime = file.type.toLowerCase();
    const ext = path.extname(file.name).toLowerCase();

    if (mime.includes("pdf") || ext === ".pdf") detectedType = "PDF";
    else if (mime.includes("video") || ext === ".mp4" || ext === ".webm" || ext === ".mkv") detectedType = "VIDEO";
    else if (mime.includes("image") || ext === ".png" || ext === ".jpg" || ext === ".jpeg") detectedType = "IMAGE";
    else if (ext === ".zip" || ext === ".rar" || ext === ".tar" || ext === ".gz") detectedType = "CODE";
    else if (ext === ".doc" || ext === ".docx" || ext === ".ppt" || ext === ".pptx") detectedType = "DOC";

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully from device",
      data: {
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: detectedType,
        mimeType: file.type,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file from device" },
      { status: 500 }
    );
  }
}
