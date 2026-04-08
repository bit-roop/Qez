import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
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

function escapeCsv(value: string | number | boolean | null | undefined) {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }

  return text;
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
        ownerId: true,
        attempts: {
          orderBy: {
            createdAt: "asc"
          },
          select: {
            id: true,
            status: true,
            totalScore: true,
            totalTimeSeconds: true,
            warningLevel: true,
            suspicious: true,
            startedAt: true,
            submittedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
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
      return jsonError("You do not have permission to export this quiz.", 403);
    }

    const rows = [
      [
        "Attempt ID",
        "Profile Serial",
        "Student Name",
        "Student Email",
        "Status",
        "Score",
        "Total Time (s)",
        "Warning Level",
        "Suspicious",
        "Started At",
        "Submitted At"
      ],
      ...quiz.attempts.map((attempt) => [
        attempt.id.toString(),
        `QEZ-${getProfileSerial(attempt.user.id.toString())}`,
        attempt.user.name,
        attempt.user.email,
        attempt.status,
        attempt.totalScore,
        attempt.totalTimeSeconds,
        attempt.warningLevel,
        attempt.suspicious,
        attempt.startedAt.toISOString(),
        attempt.submittedAt?.toISOString() ?? ""
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${quiz.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attempts.csv\"`
      }
    });
  } catch (error) {
    console.error("quiz export error", error);
    return jsonError("Unable to export quiz attempts.", 500);
  }
}
