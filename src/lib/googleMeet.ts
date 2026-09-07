import prisma from "@/lib/prisma";

export interface GoogleCalendarEventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}

export function getGoogleOAuthUrl(userId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
  
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar.events",
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

export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

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
    throw new Error(`Failed to exchange Google code: ${errorText}`);
  }

  return response.json();
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.trainerGoogleAccount.findUnique({
    where: { userId },
  });

  if (!account) return null;

  // If token is expired and we have a refresh token, refresh it
  if (account.expiresAt && account.expiresAt.getTime() < Date.now() + 60000 && account.refreshToken) {
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
        const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

        await prisma.trainerGoogleAccount.update({
          where: { userId },
          data: {
            accessToken: data.access_token,
            expiresAt: newExpiresAt,
          },
        });

        return data.access_token;
      }
    } catch (e) {
      console.error("Error refreshing Google access token:", e);
    }
  }

  return account.accessToken;
}

export async function createGoogleMeetEvent(
  accessToken: string,
  event: GoogleCalendarEventInput
): Promise<{ meetUrl: string; eventId: string }> {
  const requestId = `jvm-lms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const body = {
    summary: event.title,
    description: event.description || "JVM LMS Live Interactive Class Session",
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API error: ${errorText}`);
  }

  const data = await response.json();
  const meetUrl =
    data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri ||
    data.hangoutLink ||
    "";

  if (!meetUrl) {
    throw new Error("Failed to extract Google Meet URL from Calendar event");
  }

  return {
    meetUrl,
    eventId: data.id,
  };
}
