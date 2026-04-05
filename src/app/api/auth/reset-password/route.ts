import { jsonError, jsonOk } from "@/lib/api";
import { hashOpaqueToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid reset-password request.");
    }

    const tokenHash = hashOpaqueToken(parsed.data.token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: true
      }
    });

    if (!resetToken || resetToken.expiresAt < now) {
      return jsonError("This reset link is invalid or has expired.", 400);
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId }
      })
    ]);

    return jsonOk({
      message: "Password updated successfully."
    });
  } catch (error) {
    console.error("reset password error", error);
    return jsonError("Unable to reset password.", 500);
  }
}
