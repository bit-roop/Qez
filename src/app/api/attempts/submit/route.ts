import { AttemptStatus, QuizState } from "@prisma/client";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canAttemptQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { attemptSubmissionSchema } from "@/lib/validators/attempt";

function parseBigInt(rawValue: string) {
  try {
    return BigInt(rawValue);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const body = await request.json();
    const parsed = attemptSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid attempt submission.");
    }

    const quizId = parseBigInt(parsed.data.quizId);

    if (!quizId) {
      return jsonError("Invalid quiz id.");
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        mode: true,
        state: true,
        startsAt: true,
        endsAt: true,
        negativeMarking: true,
        questions: {
          select: {
            id: true,
            correctOptionKey: true
          }
        }
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canAttemptQuiz(user.role, quiz.mode)) {
      return jsonError("Your role cannot submit this quiz.", 403);
    }

    const now = new Date();

    if (quiz.state !== QuizState.ACTIVE) {
      return jsonError("Quiz is not active.", 400);
    }

    if (now < quiz.startsAt) {
      return jsonError("Quiz has not started yet.", 400);
    }

    if (now > quiz.endsAt) {
      return jsonError("Quiz has already ended.", 400);
    }

    const existingAttempt = await prisma.attempt.findUnique({
      where: {
        userId_quizId: {
          userId: user.id,
          quizId
        }
      },
      select: {
        id: true,
        status: true
      }
    });

    if (
      existingAttempt &&
      (existingAttempt.status === AttemptStatus.SUBMITTED ||
        existingAttempt.status === AttemptStatus.AUTO_SUBMITTED)
    ) {
      return jsonError("You have already attempted this quiz.", 409);
    }

    const questionMap = new Map(
      quiz.questions.map((question) => [question.id.toString(), question.correctOptionKey])
    );

    const uniqueQuestionIds = new Set<string>();
    let totalTimeSeconds = 0;
    let totalScore = 0;
    const scoredResponses: Array<{
      questionId: bigint;
      selectedOptionKey: "A" | "B" | "C" | "D";
      isCorrect: boolean;
      timeTakenSeconds: number;
    }> = [];

    for (const response of parsed.data.responses) {
      if (uniqueQuestionIds.has(response.questionId)) {
        return jsonError("A question was answered more than once.", 400);
      }

      uniqueQuestionIds.add(response.questionId);

      const correctOptionKey = questionMap.get(response.questionId);

      if (!correctOptionKey) {
        return jsonError("A submitted question does not belong to this quiz.", 400);
      }

      const isCorrect = correctOptionKey === response.selectedOptionKey;

      if (isCorrect) {
        totalScore += 1;
      }

      totalTimeSeconds += response.timeTakenSeconds;

      const parsedQuestionId = parseBigInt(response.questionId);

      if (!parsedQuestionId) {
        return jsonError("A submitted question id is invalid.", 400);
      }

      scoredResponses.push({
        questionId: parsedQuestionId,
        selectedOptionKey: response.selectedOptionKey,
        isCorrect,
        timeTakenSeconds: response.timeTakenSeconds
      });
    }

    const attempt = await prisma.$transaction(async (tx) => {
      if (existingAttempt) {
        await tx.response.deleteMany({
          where: {
            attemptId: existingAttempt.id
          }
        });

        return tx.attempt.update({
          where: { id: existingAttempt.id },
          data: {
            status: AttemptStatus.SUBMITTED,
            totalScore,
            totalTimeSeconds,
            submittedAt: new Date(),
            responses: {
              create: scoredResponses.map((response) => ({
                questionId: response.questionId,
                selectedOptionKey: response.selectedOptionKey,
                isCorrect: response.isCorrect,
                timeTakenSeconds: response.timeTakenSeconds
              }))
            }
          },
          include: {
            responses: {
              select: {
                questionId: true,
                selectedOptionKey: true,
                isCorrect: true,
                timeTakenSeconds: true
              }
            }
          }
        });
      }

      return tx.attempt.create({
        data: {
          userId: user.id,
          quizId,
          status: AttemptStatus.SUBMITTED,
          totalScore,
          totalTimeSeconds,
          submittedAt: new Date(),
          responses: {
            create: scoredResponses.map((response) => ({
              questionId: response.questionId,
              selectedOptionKey: response.selectedOptionKey,
              isCorrect: response.isCorrect,
              timeTakenSeconds: response.timeTakenSeconds
            }))
          }
        },
        include: {
          responses: {
            select: {
              questionId: true,
              selectedOptionKey: true,
              isCorrect: true,
              timeTakenSeconds: true
            }
          }
        }
      });
    });

    return jsonOk(
      {
        attempt: serializeBigInt(attempt),
        leaderboardEligible: quiz.mode === "WEBINAR",
        negativeMarkingConfigured: quiz.negativeMarking !== null
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("submit attempt error", error);
    return jsonError("Unable to submit quiz attempt.", 500);
  }
}
