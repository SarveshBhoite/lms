import prisma from "@/lib/prisma";

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback",
  };
}

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

export function getGoogleAuthUrl(state?: string): string {
  const { clientId, redirectUri } = getGoogleConfig();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  if (state) {
    params.set("state", state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, userId: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Google Client ID or Secret is not configured in environment variables");
  }

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

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || "Failed to exchange Google OAuth code for tokens");
  }

  const { access_token, refresh_token, expires_in, scope } = data;
  const expiresAt = new Date(Date.now() + (expires_in - 60) * 1000); // 1 minute buffer

  // Fetch Google user email
  let googleEmail = "";
  try {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = await userInfoRes.json();
    if (userInfo.email) {
      googleEmail = userInfo.email;
    }
  } catch (err) {
    console.warn("Failed to fetch Google user info:", err);
  }

  if (!googleEmail) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    googleEmail = user?.email || "";
  }

  // Check if refresh_token was returned. If not returned on re-auth, retrieve existing refresh token
  let finalRefreshToken = refresh_token;
  if (!finalRefreshToken) {
    const existing = await prisma.googleAccount.findUnique({ where: { userId } });
    finalRefreshToken = existing?.refreshToken || "";
  }

  if (!finalRefreshToken) {
    throw new Error("No refresh token received from Google. Please revoke app access in your Google Account and try again.");
  }

  const googleAccount = await prisma.googleAccount.upsert({
    where: { userId },
    create: {
      userId,
      email: googleEmail,
      accessToken: access_token,
      refreshToken: finalRefreshToken,
      expiresAt,
      scope: scope || GOOGLE_SCOPES.join(" "),
    },
    update: {
      email: googleEmail,
      accessToken: access_token,
      refreshToken: finalRefreshToken,
      expiresAt,
      scope: scope || GOOGLE_SCOPES.join(" "),
    },
  });

  return googleAccount;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.googleAccount.findUnique({ where: { userId } });

  if (!account) {
    throw new Error("Google Account is not connected. Please connect your Google Account in settings.");
  }

  // Check if token is still valid (with 2 min buffer)
  if (account.expiresAt.getTime() > Date.now() + 2 * 60 * 1000) {
    return account.accessToken;
  }

  // Token is expired, refresh it using refresh_token
  if (!account.refreshToken) {
    throw new Error("Google refresh token missing. Please reconnect your Google Account.");
  }

  const { clientId, clientSecret } = getGoogleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || "Failed to refresh Google access token. Account access may be revoked.");
  }

  const newAccessToken = data.access_token;
  const newExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);

  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessToken: newAccessToken,
      expiresAt: newExpiresAt,
    },
  });

  return newAccessToken;
}

export async function getGoogleAccountStatus(userId: string) {
  const account = await prisma.googleAccount.findUnique({
    where: { userId },
    select: { email: true, createdAt: true },
  });

  return {
    isConnected: !!account,
    email: account?.email || null,
    connectedAt: account?.createdAt || null,
  };
}

export async function disconnectGoogleAccount(userId: string) {
  await prisma.googleAccount.deleteMany({
    where: { userId },
  });
  return { success: true };
}
