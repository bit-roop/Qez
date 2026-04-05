import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGEABLE_ROLES = ["STUDENT", "TEACHER", "WEBINAR_HOST", "ADMIN"] as const;

function parseUserRole(rawRole: unknown): UserRole | null {
  if (typeof rawRole !== "string") {
    return null;
  }

  return MANAGEABLE_ROLES.includes(rawRole as (typeof MANAGEABLE_ROLES)[number])
    ? (rawRole as UserRole)
    : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return jsonError("Unauthorized.", 401);
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
            createdQuizzes: true
          }
        }
      }
    });

    return jsonOk({
      users: serializeBigInt(users)
    });
  } catch (error) {
    console.error("admin users list error", error);
    return jsonError("Unable to load users.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return jsonError("Unauthorized.", 401);
    }

    const body = (await request.json()) as {
      userId?: string;
      role?: UserRole;
    };

    if (!body.userId) {
      return jsonError("User id is required.");
    }

    const nextRole = parseUserRole(body.role);

    if (!nextRole) {
      return jsonError("Please choose a valid role.");
    }

    let targetUserId: bigint;

    try {
      targetUserId = BigInt(body.userId);
    } catch {
      return jsonError("Invalid user id.");
    }

    if (targetUserId === user.id && nextRole !== "ADMIN") {
      return jsonError("The current admin account cannot remove its own admin access.");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        role: nextRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
            createdQuizzes: true
          }
        }
      }
    });

    return jsonOk({
      user: serializeBigInt(updatedUser)
    });
  } catch (error) {
    console.error("admin user update error", error);
    return jsonError("Unable to update that user.", 500);
  }
}
