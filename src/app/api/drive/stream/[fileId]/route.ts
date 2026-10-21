import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getValidDriveAccessToken } from "@/lib/googleDrive";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { fileId } = await context.params;
    if (!fileId) {
      return new NextResponse("File ID required", { status: 400 });
    }

    const tokenInfo = await getValidDriveAccessToken();
    if (!tokenInfo?.accessToken) {
      return new NextResponse("Google Drive not connected", { status: 503 });
    }

    // Forward range header if supplied by video player for scrubbing/seeking
    const range = req.headers.get("range");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokenInfo.accessToken}`,
    };
    if (range) {
      headers["Range"] = range;
    }

    const googleDriveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers,
      }
    );

    if (!googleDriveRes.ok && googleDriveRes.status !== 206) {
      const errorText = await googleDriveRes.text();
      return new NextResponse(`Google Drive Stream Error: ${errorText}`, {
        status: googleDriveRes.status,
      });
    }

    // Pass through status & stream headers
    const responseHeaders = new Headers();
    const contentType =
      googleDriveRes.headers.get("content-type") || "video/mp4";
    const contentLength = googleDriveRes.headers.get("content-length");
    const contentRange = googleDriveRes.headers.get("content-range");
    const acceptRanges =
      googleDriveRes.headers.get("accept-ranges") || "bytes";

    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Accept-Ranges", acceptRanges);
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    // Prevent direct browser download prompts, encourage inline HTML5 video playback
    responseHeaders.set("Content-Disposition", "inline");
    responseHeaders.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(googleDriveRes.body, {
      status: googleDriveRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Stream Proxy Error:", error);
    return new NextResponse(error.message || "Internal server error", {
      status: 500,
    });
  }
}
