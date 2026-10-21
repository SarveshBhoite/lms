import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getValidDriveAccessToken,
  listGoogleDriveFolder,
} from "@/lib/googleDrive";
import prisma from "@/lib/prisma";

// GET: Allows enrolled students (or admin/trainer) to view Drive directory
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId") || undefined;
    const search = searchParams.get("search") || undefined;

    // Get active Google Drive connection
    const tokenInfo = await getValidDriveAccessToken();

    if (!tokenInfo) {
      return NextResponse.json({
        success: true,
        data: {
          isConfigured: false,
          items: [],
          currentFolder: null,
          message: "Institution Google Drive has not been connected yet.",
        },
      });
    }

    // Determine target folder.
    // If student didn't supply folderId, default to admin's configured rootFolderId or 'root'
    const targetFolder = folderId || tokenInfo.rootFolderId || "root";

    const { currentFolder, items } = await listGoogleDriveFolder(
      tokenInfo.accessToken,
      targetFolder,
      search
    );

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: true,
        rootFolderId: tokenInfo.rootFolderId,
        rootFolderName: tokenInfo.rootFolderName,
        currentFolder,
        items,
      },
    });
  } catch (err: any) {
    console.error("Student Drive fetch error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load Google Drive lectures",
      },
      { status: 500 }
    );
  }
}
