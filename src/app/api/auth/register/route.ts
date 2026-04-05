import { Prisma } from "@prisma/client";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { hashPassword, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid registration data.");
    }

    const { email, name, password, role } = parsed.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    const token = signAuthToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    return jsonOk({
      token,
      user: serializeBigInt(user)
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account with this email already exists.", 409);
    }

    console.error("register error", error);
    return jsonError("Unable to register user right now.", 500);
  }
}
