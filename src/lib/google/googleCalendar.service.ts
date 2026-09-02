import { getValidAccessToken } from "./googleAuth.service";

interface CreateMeetParams {
  userId: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  attendeesEmails?: string[];
}

interface UpdateMeetParams {
  userId: string;
  googleEventId: string;
  title?: string;
  description?: string | null;
  startTime?: Date;
  endTime?: Date;
}

interface DeleteMeetParams {
  userId: string;
  googleEventId: string;
}

/**
 * Creates a Google Calendar event with automatic Google Meet conference generation
 */
export async function createGoogleMeetEvent({
  userId,
  title,
  description,
  startTime,
  endTime,
  attendeesEmails = [],
}: CreateMeetParams): Promise<{ eventId: string; meetUrl: string }> {
  const accessToken = await getValidAccessToken(userId);

  const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const requestBody: any = {
    summary: title,
    description: description || `Live LMS Class: ${title}`,
    start: {
      dateTime: startTime.toISOString(),
    },
    end: {
      dateTime: endTime.toISOString(),
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

  if (attendeesEmails.length > 0) {
    requestBody.attendees = attendeesEmails.map((email) => ({ email }));
  }

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("Google Calendar API Error:", data);
    throw new Error(
      data.error?.message || "Failed to create Google Calendar event and Meet link"
    );
  }

  // Retrieve Google Meet URL from hangoutLink or entryPoints
  let meetUrl = data.hangoutLink || "";
  if (!meetUrl && data.conferenceData?.entryPoints) {
    const videoEntry = data.conferenceData.entryPoints.find(
      (ep: any) => ep.entryPointType === "video"
    );
    if (videoEntry?.uri) {
      meetUrl = videoEntry.uri;
    }
  }

  if (!meetUrl) {
    throw new Error(
      "Google Calendar event was created, but Google Meet link generation is pending or disabled for this Google Account."
    );
  }

  return {
    eventId: data.id,
    meetUrl,
  };
}

/**
 * Updates an existing Google Calendar event
 */
export async function updateGoogleMeetEvent({
  userId,
  googleEventId,
  title,
  description,
  startTime,
  endTime,
}: UpdateMeetParams): Promise<{ eventId: string; meetUrl?: string }> {
  const accessToken = await getValidAccessToken(userId);

  const requestBody: any = {};
  if (title) requestBody.summary = title;
  if (description !== undefined) requestBody.description = description || "";
  if (startTime) requestBody.start = { dateTime: startTime.toISOString() };
  if (endTime) requestBody.end = { dateTime: endTime.toISOString() };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}?conferenceDataVersion=1`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("Google Calendar Update API Error:", data);
    throw new Error(data.error?.message || "Failed to update Google Calendar event");
  }

  let meetUrl = data.hangoutLink;
  if (!meetUrl && data.conferenceData?.entryPoints) {
    const videoEntry = data.conferenceData.entryPoints.find(
      (ep: any) => ep.entryPointType === "video"
    );
    if (videoEntry?.uri) {
      meetUrl = videoEntry.uri;
    }
  }

  return {
    eventId: data.id,
    meetUrl,
  };
}

/**
 * Deletes/Cancels a Google Calendar event
 */
export async function deleteGoogleMeetEvent({
  userId,
  googleEventId,
}: DeleteMeetParams): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404 && response.status !== 410) {
      const data = await response.json();
      console.warn("Google Calendar Delete Warning:", data);
    }

    return true;
  } catch (err) {
    console.warn("Failed to delete Google Calendar event:", err);
    return false;
  }
}
