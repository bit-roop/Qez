import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        userId: user.id,
        submittedAt: {
          not: null
        }
      },
      orderBy: {
        submittedAt: "desc"
      },
      select: {
        id: true,
        status: true,
        totalScore: true,
        totalTimeSeconds: true,
        warningLevel: true,
        suspicious: true,
        submittedAt: true,
        quiz: {
          select: {
            id: true,
            title: true,
            mode: true,
            showResultsToStudents: true
          }
        }
      }
    });

    return jsonOk({
      history: serializeBigInt(attempts)
    });
  } catch (error) {
    console.error("student history route error", error);
    return jsonError("Unable to load quiz history.", 500);
  }
}
