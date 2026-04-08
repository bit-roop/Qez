import { NextRequest } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getProfileSerial } from "@/lib/profile";
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
      return new Response("Unauthorized.", { status: 401 });
    }

    const resolvedParams = await params;
    const quizId = parseQuizId(resolvedParams.quizId);

    if (!quizId) {
      return new Response("Invalid quiz id.", { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        mode: true
      }
    });

    if (!quiz) {
      return new Response("Quiz not found.", { status: 404 });
    }

    if (!canManageQuiz(user.role, quiz.ownerId, user.id)) {
      return new Response("Forbidden.", { status: 403 });
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
        suspicious: true,
        submittedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const csvRows = [
      ["rank", "profile_serial", "name", "email", "points", "score", "time_seconds", "suspicious", "submitted_at"].join(","),
      ...attempts.map((attempt, index) => {
        const points =
          quiz.mode === "WEBINAR"
            ? index === 0
              ? 5
              : index === 1
                ? 4
                : index === 2
                  ? 3
                  : attempt.totalScore > 0
                    ? 1
                    : 0
            : 0;

        return [
          index + 1,
          `QEZ-${getProfileSerial(attempt.user.id.toString())}`,
          `"${attempt.user.name.replace(/"/g, '""')}"`,
          attempt.user.email,
          points,
          attempt.totalScore,
          attempt.totalTimeSeconds,
          attempt.suspicious ? "TRUE" : "FALSE",
          attempt.submittedAt?.toISOString() ?? ""
        ].join(",");
      })
    ];

    return new Response(csvRows.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qez-${quiz.mode.toLowerCase()}-winners-${quiz.id.toString()}.csv"`
      }
    });
  } catch (error) {
    console.error("winner export error", error);
    return new Response("Unable to export winners.", { status: 500 });
  }
}
