import { Prisma } from "@prisma/client";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { verifyCaptchaToken } from "@/lib/captcha";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { resolveBaseUrl } from "@/lib/auth";
import { sendEmailVerificationEmail } from "@/lib/mail";
import { DatabaseConnectionError, prisma, withDatabaseRetry } from "@/lib/prisma";
import { getProfileSerial } from "@/lib/profile";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid registration data.");
    }

    const { email, name, password, role, captchaToken } = parsed.data;
    const captchaValid = await verifyCaptchaToken(captchaToken);

    if (!captchaValid) {
      return jsonError("Captcha verification failed. Please try again.", 400);
    }

    const passwordHash = await hashPassword(password);

    const user = await withDatabaseRetry(() =>
      prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
          profileSerial: getProfileSerial(email)
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true
        }
      })
    );

    const verificationToken = await createEmailVerificationToken(user.id);
    const verificationBaseUrl = resolveBaseUrl(request);
    const verificationLink = `${verificationBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
    await sendEmailVerificationEmail(user.email, verificationLink);

    return jsonOk({
      requiresVerification: true,
      message: "Account created. Please verify your email before signing in.",
      user: serializeBigInt(user)
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account with this email already exists.", 409);
    }

    if (error instanceof DatabaseConnectionError) {
      return jsonError("Database connection was interrupted. Please try again.", 503);
    }

    console.error("register error", error);
    return jsonError("Unable to register user right now.", 500);
  }
}
