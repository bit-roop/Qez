import { jsonError, jsonOk } from "@/lib/api";
import { createRandomToken, hashOpaqueToken, resolveBaseUrl } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const APP_URL = process.env.APP_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid forgot-password request.");
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email
      }
    });

    if (!user) {
      return jsonOk({
        message: "If that email exists, a reset link has been prepared."
      });
    }

    const rawToken = createRandomToken(24);
    const tokenHash = hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id
      }
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    const resetLink = `${resolveBaseUrl(request)}/reset-password?token=${rawToken}`;

    if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: user.email,
          subject: "Reset your Qez password",
          html: `<p>Hello ${user.name},</p><p>Reset your password here:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`
        })
      });

      if (emailResponse.ok) {
        return jsonOk({
          message: "Password reset link sent."
        });
      }

      const resendError = (await emailResponse.json().catch(() => null)) as
        | { message?: string; error?: string; name?: string }
        | null;

      const resendMessage =
        resendError?.message ?? resendError?.error ?? "Email delivery failed at the provider.";

      return jsonError(
        `Password reset email could not be sent. ${resendMessage} Check RESEND_FROM_EMAIL and your verified Resend domain.`,
        502
      );
    }

    return jsonOk({
      message: "Password reset link prepared. Email delivery was unavailable, so use this local reset link:",
      resetLink
    });
  } catch (error) {
    console.error("forgot password error", error);
    return jsonError("Unable to prepare password reset.", 500);
  }
}
