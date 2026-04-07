import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { verifyCaptchaToken } from "@/lib/captcha";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { sendEmailVerificationEmail } from "@/lib/mail";
import { prisma, withDatabaseRetry } from "@/lib/prisma";

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  captchaToken: z.string().trim().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Enter a valid email address.", 400);
    }

    const captchaValid = await verifyCaptchaToken(parsed.data.captchaToken);

    if (!captchaValid) {
      return jsonError("Captcha verification failed. Please try again.", 400);
    }

    const user = await withDatabaseRetry(() =>
      prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: {
          id: true,
          email: true,
          emailVerified: true
        }
      })
    );

    if (!user) {
      return jsonOk({ message: "If that email exists, a verification link has been sent." });
    }

    if (user.emailVerified) {
      return jsonOk({ message: "This email is already verified." });
    }

    const token = await createEmailVerificationToken(user.id);
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const verificationLink = `${appUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    await sendEmailVerificationEmail(user.email, verificationLink);

    return jsonOk({ message: "A fresh verification email has been sent." });
  } catch (error) {
    console.error("resend verification error", error);
    return jsonError("Unable to resend verification email right now.", 500);
  }
}
