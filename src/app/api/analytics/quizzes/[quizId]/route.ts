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
        mode: true,
        ownerId: true,
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        },
        attempts: {
          where: {
            status: {
              in: ["SUBMITTED", "AUTO_SUBMITTED"]
            }
          },
          select: {
            id: true,
            totalScore: true,
            totalTimeSeconds: true,
            suspicious: true,
            warningLevel: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        questions: {
          orderBy: {
            displayOrder: "asc"
          },
          select: {
            id: true,
            prompt: true,
            displayOrder: true,
            difficulty: true,
            responses: {
              select: {
                isCorrect: true,
                timeTakenSeconds: true,
                selectedOptionKey: true
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canManageQuiz(user.role, quiz.ownerId, user.id)) {
      return jsonError("You do not have permission to view quiz analytics.", 403);
    }

    const submittedAttempts = quiz.attempts.length;
    const totalScore = quiz.attempts.reduce((sum, attempt) => sum + attempt.totalScore, 0);
    const totalTime = quiz.attempts.reduce((sum, attempt) => sum + attempt.totalTimeSeconds, 0);
    const suspiciousAttempts = quiz.attempts.filter((attempt) => attempt.suspicious).length;
    const bestAttempt = [...quiz.attempts].sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      return left.totalTimeSeconds - right.totalTimeSeconds;
    })[0] ?? null;

    const questionAnalytics = quiz.questions.map((question) => {
      const attemptsCount = question.responses.length;
      const correctCount = question.responses.filter((response) => response.isCorrect).length;
      const avgTimeSeconds =
        attemptsCount > 0
          ? Number(
              (
                question.responses.reduce((sum, response) => sum + response.timeTakenSeconds, 0) /
                attemptsCount
              ).toFixed(1)
            )
          : 0;

      return {
        id: question.id,
        prompt: question.prompt,
        displayOrder: question.displayOrder,
        difficulty: question.difficulty,
        attemptsCount,
        correctCount,
        accuracyPercent:
          attemptsCount > 0 ? Number(((correctCount / attemptsCount) * 100).toFixed(1)) : 0,
        avgTimeSeconds
      };
    });

    const hardestQuestion =
      [...questionAnalytics]
        .filter((question) => question.attemptsCount > 0)
        .sort((left, right) => left.accuracyPercent - right.accuracyPercent)[0] ?? null;

    return jsonOk({
      quiz: serializeBigInt({
        id: quiz.id,
        title: quiz.title,
        mode: quiz.mode,
        totalQuestions: quiz._count.questions,
        totalAttempts: quiz._count.attempts,
        submittedAttempts,
        avgScore: submittedAttempts > 0 ? Number((totalScore / submittedAttempts).toFixed(2)) : 0,
        avgTimeSeconds:
          submittedAttempts > 0 ? Number((totalTime / submittedAttempts).toFixed(1)) : 0,
        suspiciousAttempts,
        bestAttempt: bestAttempt
          ? {
              name: bestAttempt.user.name,
              score: bestAttempt.totalScore,
              time: bestAttempt.totalTimeSeconds
            }
          : null,
        hardestQuestion
      }),
      questions: serializeBigInt(questionAnalytics)
    });
  } catch (error) {
    console.error("quiz analytics error", error);
    return jsonError("Unable to load quiz analytics.", 500);
  }
}

