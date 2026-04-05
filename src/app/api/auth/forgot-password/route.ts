import { jsonError, jsonOk } from "@/lib/api";
import { createRandomToken, hashOpaqueToken, resolveBaseUrl } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";

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
        message: "If that email exists, a reset link would appear here in local/demo mode."
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

    return jsonOk({
      message: "Use this reset link to continue:",
      resetLink
    });
  } catch (error) {
    console.error("forgot password error", error);
    return jsonError("Unable to prepare password reset.", 500);
  }
}
