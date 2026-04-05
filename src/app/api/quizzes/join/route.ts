import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import {
  canAttemptQuiz,
  describeAllowedParticipants,
  isAllowedQuizParticipant
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const joinQuizSchema = z.object({
  joinCode: z.string().trim().min(6).max(6)
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const body = await request.json();
    const parsed = joinQuizSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Please enter a valid 6-character quiz code.");
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        joinCode: parsed.data.joinCode.toUpperCase()
      },
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
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    if (!quiz) {
      return jsonError("No quiz found for that join code.", 404);
    }

    if (!canAttemptQuiz(user.role, quiz.mode)) {
      return jsonError("Your role cannot join this quiz.", 403);
    }

    if (quiz.state !== "ACTIVE") {
      return jsonError("This quiz is not active yet. Ask your teacher or host to activate it.", 409);
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

    return jsonOk({
      quiz: serializeBigInt({
        ...quiz,
        questionCount: quiz._count.questions
      })
    });
  } catch (error) {
    console.error("join quiz error", error);
    return jsonError("Unable to look up quiz.", 500);
  }
}
