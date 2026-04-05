import { NextRequest } from "next/server";
import { QuizState } from "@prisma/client";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import {
  canAttemptQuiz,
  describeAllowedParticipants,
  isAllowedQuizParticipant
} from "@/lib/permissions";
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
        description: true,
        mode: true,
        state: true,
        joinCode: true,
        startsAt: true,
        endsAt: true,
        allowLeaderboard: true,
        leaderboardVisibility: true,
        showResultsToStudents: true,
        allowedParticipantEmails: true,
        allowedEmailDomains: true,
        owner: {
          select: {
            name: true,
            role: true
          }
        },
        questions: {
          orderBy: {
            displayOrder: "asc"
          },
          select: {
            id: true,
            prompt: true,
            explanation: true,
            difficulty: true,
            displayOrder: true,
            timeLimitSeconds: true,
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
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canAttemptQuiz(user.role, quiz.mode)) {
      return jsonError("Your role cannot attempt this quiz.", 403);
    }

    if (
      !isAllowedQuizParticipant(
        user.email,
        quiz.allowedParticipantEmails,
        quiz.allowedEmailDomains
      )
    ) {
      return jsonError(
        `You are not on the allowed participant list for this quiz. ${describeAllowedParticipants(
          quiz.allowedParticipantEmails,
          quiz.allowedEmailDomains
        )}`,
        403
      );
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
        status: true,
        totalScore: true,
        totalTimeSeconds: true,
        warningLevel: true,
        suspicious: true,
        submittedAt: true
      }
    });

    const now = new Date();
    const availability =
      quiz.state !== QuizState.ACTIVE
        ? "Quiz is not active yet."
        : now < quiz.startsAt
          ? "Quiz has not started yet."
          : now > quiz.endsAt
            ? "Quiz has already ended."
            : existingAttempt &&
                (existingAttempt.status === "SUBMITTED" ||
                  existingAttempt.status === "AUTO_SUBMITTED")
              ? "You have already submitted this quiz."
              : null;

    return jsonOk({
      quiz: serializeBigInt({
        ...quiz,
        questionCount: quiz.questions.length,
        canAttemptNow: availability === null
      }),
      attempt: serializeBigInt(existingAttempt),
      availabilityMessage: availability
    });
  } catch (error) {
    console.error("attempt quiz fetch error", error);
    return jsonError("Unable to load quiz attempt data.", 500);
  }
}
