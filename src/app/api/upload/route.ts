import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

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

    // Determine resource type for Cloudinary
    let resourceType: "image" | "video" | "raw" | "auto" = "auto";
    const mime = file.type.toLowerCase();
    if (mime.startsWith("image/")) {
      resourceType = "image";
    } else if (mime.startsWith("video/")) {
      resourceType = "video";
    } else {
      resourceType = "raw";
    }

    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanOriginalName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");

    // Upload directly to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `jvm_lms/${safeCategory}`,
          resource_type: resourceType,
          public_id: `${cleanOriginalName}_${Date.now()}`,
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      message: "File uploaded successfully to cloud storage",
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to Cloudinary" },
      { status: 500 }
    );
  }
}
