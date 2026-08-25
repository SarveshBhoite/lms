import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from "@/validations/auth.schema";
import { createSession, deleteSession } from "@/lib/auth";

export class AuthService {
  /**
   * Register a new user. Public registration ALWAYS creates a STUDENT account.
   */
  static async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: Role.STUDENT,
        isEmailVerified: false,
        verificationToken,
        verificationExpiresAt,
        profile: {
          create: {
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
          },
        },
      },
    });

    // Log registration activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        resource: `User:${user.id}`,
        details: { email: user.email, role: user.role },
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }

  /**
   * Log in an existing user and create a secure cookie session.
   */
  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password.");
    }

    if (user.isActive === false) {
      throw new Error("Your account has been deactivated. Please contact an administrator.");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        resource: `User:${user.id}`,
        details: { email: user.email, role: user.role },
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatarUrl: user.profile?.avatarUrl,
    };
  }

  /**
   * Logout user and clear session
   */
  static async logout() {
    await deleteSession();
  }

  /**
   * Generate password reset token
   */
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return true to prevent email enumeration
      return { success: true, message: "If the email is registered, a reset link will be sent." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    // In production, send email via MailerService. For dev, log the token.
    console.log(`[AUTH] Password Reset Token for ${user.email}: ${resetToken}`);

    return { success: true, message: "If the email is registered, a reset link will be sent.", token: resetToken };
  }

  /**
   * Reset password with valid token
   */
  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired password reset token.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return { success: true, message: "Password has been successfully reset. You can now log in." };
  }

  /**
   * Verify email address with token
   */
  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired email verification token.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationExpiresAt: null,
      },
    });

    return { success: true, message: "Email verified successfully." };
  }
}
