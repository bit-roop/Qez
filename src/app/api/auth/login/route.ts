import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { comparePassword, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid login data.");
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return jsonError("Invalid email or password.", 401);
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = signAuthToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    return jsonOk({
      token,
      user: serializeBigInt({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })
    });
  } catch (error) {
    console.error("login error", error);
    return jsonError("Unable to login right now.", 500);
  }
}

