import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { comparePassword, hashPassword, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || "Qez Admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid login data.");
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email
      }
    });

    if (!user) {
      if (
        ADMIN_EMAIL &&
        ADMIN_PASSWORD &&
        parsed.data.email === ADMIN_EMAIL &&
        parsed.data.password === ADMIN_PASSWORD
      ) {
        const passwordHash = await hashPassword(ADMIN_PASSWORD);
        const createdAdmin = await prisma.user.create({
          data: {
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            passwordHash,
            role: "ADMIN"
          }
        });

        const bootstrapToken = signAuthToken({
          userId: createdAdmin.id.toString(),
          email: createdAdmin.email,
          role: createdAdmin.role,
          name: createdAdmin.name,
          emailVerified: true
        });

        return jsonOk({
          token: bootstrapToken,
          user: serializeBigInt({
            id: createdAdmin.id,
            email: createdAdmin.email,
            name: createdAdmin.name,
            role: createdAdmin.role
          })
        });
      }

      return jsonError("Admin access is not available for this account.", 403);
    }

    if (user.role !== "ADMIN") {
      return jsonError("This account is not marked as an admin.", 403);
    }

    const passwordMatches = await comparePassword(parsed.data.password, user.passwordHash);

    if (!passwordMatches) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = signAuthToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: true
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
    console.error("admin login error", error);
    return jsonError("Unable to login as admin right now.", 500);
  }
}
