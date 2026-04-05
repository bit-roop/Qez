import { z } from "zod";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    return jsonOk({ profile: serializeBigInt(user) });
  } catch (error) {
    console.error("profile me error", error);
    return jsonError("Unable to fetch profile.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile update.");
    }

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return jsonOk({ profile: serializeBigInt(profile) });
  } catch (error) {
    console.error("profile update error", error);
    return jsonError("Unable to update profile.", 500);
  }
}
