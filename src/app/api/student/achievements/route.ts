import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const claims = await withDatabaseRetry(() =>
      prisma.certificateClaim.findMany({
        where: { userId: user.id },
        orderBy: { claimedAt: "desc" },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              mode: true
            }
          },
          attempt: {
            select: {
              totalScore: true,
              totalTimeSeconds: true,
              submittedAt: true
            }
          }
        }
      })
    );

    return jsonOk({
      achievements: serializeBigInt(
        claims.map((claim) => ({
          id: claim.id,
          title: claim.title,
          claimedAt: claim.claimedAt,
          quiz: claim.quiz,
          attempt: claim.attempt
        }))
      )
    });
  } catch (error) {
    console.error("student achievements error", error);
    return jsonError("Unable to load achievements.", 500);
  }
}
