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
        allowLeaderboard: true,
        leaderboardVisibility: true,
        ownerId: true
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    const canManage = canManageQuiz(user.role, quiz.ownerId, user.id);

    if (!canManage) {
      if (!quiz.allowLeaderboard || quiz.leaderboardVisibility === "HIDDEN") {
        return jsonError("Leaderboard is not available for this quiz.", 403);
      }
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId,
        status: {
          in: ["SUBMITTED", "AUTO_SUBMITTED"]
        }
      },
      orderBy: [
        { totalScore: "desc" },
        { totalTimeSeconds: "asc" },
        { submittedAt: "asc" }
      ],
      select: {
        id: true,
        totalScore: true,
        totalTimeSeconds: true,
        submittedAt: true,
        suspicious: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const ranked = attempts.map((attempt, index) => ({
      rank: index + 1,
      pointsAwarded:
        index === 0 ? 5 : index === 1 ? 4 : index === 2 ? 3 : attempt.totalScore > 0 ? 1 : 0,
      ...attempt
    }));

    const visibleEntries =
      canManage || quiz.leaderboardVisibility === "FULL"
        ? ranked
        : ranked.slice(0, 10);

    const myEntry = ranked.find((entry) => entry.user.id === user.id) ?? null;

    return jsonOk({
      quiz: serializeBigInt(quiz),
      entries: serializeBigInt(visibleEntries),
      myEntry: serializeBigInt(myEntry),
      totalParticipants: ranked.length
    });
  } catch (error) {
    console.error("leaderboard error", error);
    return jsonError("Unable to load leaderboard.", 500);
  }
}
