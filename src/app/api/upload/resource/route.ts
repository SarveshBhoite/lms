import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resource file uploaded" }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const hasCloudinaryKeys =
      Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
      Boolean(process.env.CLOUDINARY_API_KEY) &&
      Boolean(process.env.CLOUDINARY_API_SECRET);

    if (hasCloudinaryKeys) {
      try {
        let resourceType: "image" | "video" | "raw" | "auto" = "auto";
        if (file.type.startsWith("image/")) resourceType = "image";
        else if (file.type.startsWith("video/")) resourceType = "video";
        else resourceType = "raw";

        const uploadResult: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "jvm_lms/resources",
              resource_type: resourceType,
              public_id: file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + Date.now(),
            },
            (error, result) => {
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
        });
      } catch (cloudinaryErr) {
        console.warn("Cloudinary resource upload failed, falling back to local storage:", cloudinaryErr);
      }
    }

    // Local Storage Fallback when Cloudinary keys are missing or failing
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "resources");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);
    const localUrl = `/uploads/resources/${fileName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      publicId: fileName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
    });
  } catch (error: any) {
    console.error("Resource upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload resource file" },
      { status: 500 }
    );
  }
}
