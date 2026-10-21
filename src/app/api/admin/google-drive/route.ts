import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import {
  getGoogleDriveOAuthUrl,
  getValidDriveAccessToken,
  listGoogleDriveFolder,
} from "@/lib/googleDrive";
import prisma from "@/lib/prisma";

// GET: Returns Drive connection status, auth URL, current root folder, and drives/folder listings
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId") || undefined;
    const search = searchParams.get("search") || undefined;

    const account = await prisma.adminGoogleDriveAccount.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        email: true,
        rootFolderId: true,
        rootFolderName: true,
        updatedAt: true,
      },
    });

    const isConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here"
    );
    const authUrl = isConfigured
      ? getGoogleDriveOAuthUrl(session.userId)
      : null;

    if (!account) {
      return NextResponse.json({
        success: true,
        data: {
          isConnected: false,
          email: null,
          isConfigured,
          authUrl,
          rootFolderId: null,
          rootFolderName: null,
          items: [],
          currentFolder: null,
        },
      });
    }

    // Try fetching files using valid token
    let items: any[] = [];
    let currentFolder: any = null;
    let driveError: string | null = null;

    try {
      const tokenInfo = await getValidDriveAccessToken(session.userId);
      if (tokenInfo?.accessToken) {
        // If no folderId requested, default to saved rootFolderId or 'root'
        const targetFolder = folderId || tokenInfo.rootFolderId || "root";
        const listing = await listGoogleDriveFolder(
          tokenInfo.accessToken,
          targetFolder,
          search
        );
        items = listing.items;
        currentFolder = listing.currentFolder;
      }
    } catch (err: any) {
      console.error("Error browsing drive contents:", err);
      driveError = err.message || "Failed to query Google Drive folder contents";
    }

    return NextResponse.json({
      success: true,
      data: {
        isConnected: true,
        email: account.email,
        isConfigured,
        authUrl,
        rootFolderId: account.rootFolderId,
        rootFolderName: account.rootFolderName,
        currentFolder,
        items,
        error: driveError,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Set root folder for recorded lectures (e.g., when Admin selects the parent lecture directory)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const { rootFolderId, rootFolderName } = body;

    if (!rootFolderId) {
      return NextResponse.json(
        { success: false, error: "rootFolderId is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.adminGoogleDriveAccount.update({
      where: { userId: session.userId },
      data: {
        rootFolderId,
        rootFolderName: rootFolderName || "Recorded Lectures Folder",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Default Drive root folder updated successfully",
      data: {
        rootFolderId: updated.rootFolderId,
        rootFolderName: updated.rootFolderName,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Disconnects Google Drive connection
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    await prisma.adminGoogleDriveAccount.deleteMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Google Drive account disconnected successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
