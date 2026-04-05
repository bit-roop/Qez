import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canManageQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function parseQuizId(rawQuizId: string) {
  try {
    return BigInt(rawQuizId);
  } catch {
    return null;
  }
}

export async function GET(
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

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        ownerId: true
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canManageQuiz(user.role, quiz.ownerId, user.id)) {
      return jsonError("You do not have permission to view suspicious attempts.", 403);
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId,
        OR: [{ suspicious: true }, { warningLevel: { gt: 0 } }]
      },
      orderBy: [{ suspicious: "desc" }, { warningLevel: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        status: true,
        totalScore: true,
        totalTimeSeconds: true,
        warningLevel: true,
        tabSwitchCount: true,
        suspicious: true,
        submittedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        suspiciousEvents: {
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true,
            eventType: true,
            metadata: true,
            createdAt: true
          }
        }
      }
    });

    return jsonOk({
      quiz: serializeBigInt(quiz),
      attempts: serializeBigInt(attempts)
    });
  } catch (error) {
    console.error("suspicious attempts route error", error);
    return jsonError("Unable to load suspicious attempts.", 500);
  }
}

