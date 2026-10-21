import prisma from "@/lib/prisma";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: string | null;
  thumbnailLink?: string | null;
  videoDurationMinutes?: number | null;
  createdTime?: string | null;
  modifiedTime?: string | null;
}

export function getGoogleDriveOAuthUrl(userId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/google-drive/callback`;

  // Request drive.readonly + email profile scopes
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive.readonly",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state: userId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeDriveCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/google-drive/callback`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange Google Drive code: ${errorText}`);
  }

  return response.json();
}

/**
 * Returns a valid access token for the active Admin Google Drive connection.
 * Automatically handles token refresh via refresh_token when expired.
 */
export async function getValidDriveAccessToken(userId?: string): Promise<{
  accessToken: string;
  email: string;
  rootFolderId: string | null;
  rootFolderName: string | null;
} | null> {
  const account = userId
    ? await prisma.adminGoogleDriveAccount.findUnique({ where: { userId } })
    : await prisma.adminGoogleDriveAccount.findFirst({
        orderBy: { updatedAt: "desc" },
      });

  if (!account) return null;

  // Refresh if token expires within 2 minutes
  if (
    account.expiresAt &&
    account.expiresAt.getTime() < Date.now() + 120000 &&
    account.refreshToken
  ) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: account.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newExpiresAt = new Date(
          Date.now() + (data.expires_in || 3600) * 1000
        );

        await prisma.adminGoogleDriveAccount.update({
          where: { id: account.id },
          data: {
            accessToken: data.access_token,
            expiresAt: newExpiresAt,
          },
        });

        return {
          accessToken: data.access_token,
          email: account.email,
          rootFolderId: account.rootFolderId,
          rootFolderName: account.rootFolderName,
        };
      }
    } catch (e) {
      console.error("Error refreshing Google Drive access token:", e);
    }
  }

  return {
    accessToken: account.accessToken,
    email: account.email,
    rootFolderId: account.rootFolderId,
    rootFolderName: account.rootFolderName,
  };
}

/**
 * List files and subfolders under a specific parent folder in Google Drive.
 * If folderId is not specified or "root", queries the selected rootFolderId or Drive root.
 */
export async function listGoogleDriveFolder(
  accessToken: string,
  folderId?: string,
  search?: string
): Promise<{
  currentFolder: { id: string; name: string } | null;
  items: DriveItem[];
}> {
  const targetParent = folderId && folderId !== "root" ? folderId : "root";

  let query = `'${targetParent}' in parents and trashed = false`;
  if (search && search.trim()) {
    query += ` and name contains '${search.replace(/'/g, "\\'")}'`;
  }

  const fields =
    "files(id, name, mimeType, size, thumbnailLink, videoMediaMetadata, createdTime, modifiedTime)";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=${encodeURIComponent(fields)}&pageSize=100&orderBy=folder,name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive API error: ${errorText}`);
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  // Optionally fetch current folder name if not root
  let currentFolder: { id: string; name: string } | null = null;
  if (targetParent !== "root") {
    try {
      const folderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${targetParent}?fields=id,name`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (folderRes.ok) {
        currentFolder = await folderRes.json();
      }
    } catch {
      currentFolder = { id: targetParent, name: "Folder" };
    }
  } else {
    currentFolder = { id: "root", name: "Drive Root" };
  }

  const items: DriveItem[] = rawFiles.map((f: any) => {
    const isFolder = f.mimeType === "application/vnd.google-apps.folder";
    let videoDurationMinutes: number | null = null;
    if (f.videoMediaMetadata?.durationMillis) {
      videoDurationMinutes = Math.round(
        Number(f.videoMediaMetadata.durationMillis) / 60000
      );
    }

    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder,
      size: f.size || null,
      thumbnailLink: f.thumbnailLink || null,
      videoDurationMinutes,
      createdTime: f.createdTime || null,
      modifiedTime: f.modifiedTime || null,
    };
  });

  // Sort: folders first, then files
  items.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return { currentFolder, items };
}
