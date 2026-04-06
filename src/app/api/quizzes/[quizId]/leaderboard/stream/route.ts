import { NextRequest } from "next/server";
import { getAuthUserFromRequest, verifyAuthToken } from "@/lib/auth";
import { canManageQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseQuizId(rawQuizId: string) {
  try {
    return BigInt(rawQuizId);
  } catch {
    return null;
  }
}

async function buildLeaderboardPayload(userId: bigint, userRole: string, quizId: bigint) {
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
    throw new Error("Quiz not found.");
  }

  const canManage = canManageQuiz(userRole as never, quiz.ownerId, userId);

  if (!canManage && (!quiz.allowLeaderboard || quiz.leaderboardVisibility === "HIDDEN")) {
    throw new Error("Leaderboard is not available for this quiz.");
  }

  const attempts = await prisma.attempt.findMany({
    where: {
      quizId,
      status: {
        in: ["SUBMITTED", "AUTO_SUBMITTED"]
      }
    },
    orderBy: [{ totalScore: "desc" }, { totalTimeSeconds: "asc" }, { submittedAt: "asc" }],
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
    canManage || quiz.leaderboardVisibility === "FULL" ? ranked : ranked.slice(0, 10);

  const myEntry = ranked.find((entry) => entry.user.id === userId) ?? null;

  return {
    quiz: {
      ...quiz,
      id: quiz.id.toString(),
      ownerId: quiz.ownerId.toString()
    },
    entries: visibleEntries.map((entry) => ({
      ...entry,
      id: entry.id.toString(),
      user: {
        ...entry.user,
        id: entry.user.id.toString()
      }
    })),
    topPerformers: ranked.slice(0, 3).map((entry) => ({
      ...entry,
      id: entry.id.toString(),
      user: {
        ...entry.user,
        id: entry.user.id.toString()
      }
    })),
    myEntry: myEntry
      ? {
          ...myEntry,
          id: myEntry.id.toString(),
          user: {
            ...myEntry.user,
            id: myEntry.user.id.toString()
          }
        }
      : null,
    totalParticipants: ranked.length,
    lastUpdatedAt: new Date().toISOString()
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  let user = await getAuthUserFromRequest(request);

  if (!user) {
    const token = request.nextUrl.searchParams.get("token");

    if (token) {
      try {
        const payload = verifyAuthToken(token);
        const fallbackUser = await prisma.user.findUnique({
          where: {
            id: BigInt(payload.userId)
          },
          select: {
            id: true,
            email: true,
            role: true,
            name: true
          }
        });

        user = fallbackUser;
      } catch {
        user = null;
      }
    }
  }

  if (!user) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const resolvedParams = await params;
  const quizId = parseQuizId(resolvedParams.quizId);

  if (!quizId) {
    return new Response("Invalid quiz id.", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const pushEvent = async () => {
        try {
          const payload = await buildLeaderboardPayload(user.id, user.role, quizId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to stream leaderboard.";
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`));
        }
      };

      await pushEvent();

      const interval = setInterval(() => {
        void pushEvent();
      }, 2500);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
