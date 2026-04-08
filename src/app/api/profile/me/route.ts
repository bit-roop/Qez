import { z } from "zod";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  institution: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(240).optional().nullable(),
  avatarKey: z.string().trim().max(40).optional().nullable()
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

    const profile = await withDatabaseRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: parsed.data.name,
          institution: parsed.data.institution || null,
          bio: parsed.data.bio || null,
          avatarKey: parsed.data.avatarKey || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          institution: true,
          bio: true,
          avatarKey: true,
          profileSerial: true,
          emailVerified: true
        }
      })
    );

    return jsonOk({ profile: serializeBigInt(profile) });
  } catch (error) {
    console.error("profile update error", error);
    return jsonError("Unable to update profile.", 500);
  }
}
