import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canManageQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function parseBigIntValue(rawValue: string) {
  try {
    return BigInt(rawValue);
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const resolvedParams = await params;
    const quizId = parseBigIntValue(resolvedParams.quizId);
    const attemptId = parseBigIntValue(resolvedParams.attemptId);

    if (!quizId || !attemptId) {
      return jsonError("Invalid quiz or attempt id.");
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
      return jsonError("You do not have permission to inspect this attempt.", 403);
    }

    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        quizId
      },
      select: {
        id: true,
        status: true,
        totalScore: true,
        totalTimeSeconds: true,
        warningLevel: true,
        tabSwitchCount: true,
        suspicious: true,
        startedAt: true,
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
            createdAt: true,
            metadata: true
          }
        },
        responses: {
          select: {
            questionId: true,
            selectedOptionKey: true,
            isCorrect: true,
            timeTakenSeconds: true,
            question: {
              select: {
                prompt: true,
                displayOrder: true,
                explanation: true,
                correctOptionKey: true,
                options: {
                  orderBy: {
                    optionKey: "asc"
                  },
                  select: {
                    optionKey: true,
                    optionText: true
                  }
                }
              }
            }
          },
          orderBy: {
            question: {
              displayOrder: "asc"
            }
          }
        }
      }
    });

    if (!attempt) {
      return jsonError("Attempt not found.", 404);
    }

    return jsonOk({
      quiz: serializeBigInt(quiz),
      attempt: serializeBigInt(attempt)
    });
  } catch (error) {
    console.error("attempt detail route error", error);
    return jsonError("Unable to load attempt review.", 500);
  }
}
