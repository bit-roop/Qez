import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { comparePassword, signAuthToken } from "@/lib/auth";
import { verifyCaptchaToken } from "@/lib/captcha";
import { DatabaseConnectionError, prisma, withDatabaseRetry } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid login data.");
    }

    const { email, password, captchaToken } = parsed.data;
    const captchaValid = await verifyCaptchaToken(captchaToken);

    if (!captchaValid) {
      return jsonError("Captcha verification failed. Please try again.", 400);
    }

    const user = await withDatabaseRetry(() =>
      prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          institution: true,
          bio: true,
          avatarKey: true,
          profileSerial: true,
          emailVerified: true
        }
      })
    );

    if (!user) {
      return jsonError("Invalid email or password.", 401);
    }

    if (!user.passwordHash) {
      return jsonError("This account uses Google sign-in. Continue with Google instead.", 401);
    }

    if (!user.emailVerified) {
      return jsonError("Please verify your email before logging in.", 403);
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = signAuthToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified
    });

    return jsonOk({
      token,
      user: serializeBigInt({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institution: user.institution,
        bio: user.bio,
        avatarKey: user.avatarKey,
        profileSerial: user.profileSerial,
        emailVerified: user.emailVerified
      })
    });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return jsonError("Database connection was interrupted. Please try again.", 503);
    }

    console.error("login error", error);
    return jsonError("Unable to login right now.", 500);
  }
}
