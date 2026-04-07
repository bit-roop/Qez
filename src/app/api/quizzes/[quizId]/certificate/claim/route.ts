import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";

function parseQuizId(rawQuizId: string) {
  try {
    return BigInt(rawQuizId);
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const resolvedParams = await params;
    const quizId = parseQuizId(resolvedParams.quizId);

    if (!quizId) {
      return jsonError("Invalid quiz id.");
    }

    const attempt = await withDatabaseRetry(() =>
      prisma.attempt.findUnique({
        where: {
          userId_quizId: {
            userId: user.id,
            quizId
          }
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    );

    if (!attempt || !attempt.submittedAt) {
      return jsonError("Complete the quiz before claiming a certificate.", 400);
    }

    const claim = await withDatabaseRetry(() =>
      prisma.certificateClaim.upsert({
        where: {
          userId_quizId: {
            userId: user.id,
            quizId
          }
        },
        update: {
          title: `${attempt.quiz.title} Completion Certificate`,
          attemptId: attempt.id,
          claimedAt: new Date()
        },
        create: {
          userId: user.id,
          quizId,
          attemptId: attempt.id,
          title: `${attempt.quiz.title} Completion Certificate`
        }
      })
    );

    return jsonOk({ claim: serializeBigInt(claim) }, { status: 201 });
  } catch (error) {
    console.error("claim certificate error", error);
    return jsonError("Unable to claim certificate.", 500);
  }
}
