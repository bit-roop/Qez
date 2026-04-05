import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
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

function generateJoinCode() {
  return randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

type DuplicateQuizInput = Omit<Prisma.QuizCreateInput, "joinCode">;

async function duplicateQuizWithRetry(input: DuplicateQuizInput) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.quiz.create({
        data: {
          ...input,
          joinCode: generateJoinCode()
        },
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique join code.");
}

export async function POST(
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

    const sourceQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: {
              orderBy: {
                optionKey: "asc"
              }
            }
          },
          orderBy: {
            displayOrder: "asc"
          }
        }
      }
    });

    if (!sourceQuiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canManageQuiz(user.role, sourceQuiz.ownerId, user.id)) {
      return jsonError("You do not have permission to duplicate this quiz.", 403);
    }

    const durationMs = sourceQuiz.endsAt.getTime() - sourceQuiz.startsAt.getTime();
    const duplicatedStartsAt = new Date(Date.now() + 60 * 60 * 1000);
    const duplicatedEndsAt = new Date(duplicatedStartsAt.getTime() + Math.max(durationMs, 30 * 60 * 1000));

    const duplicatedQuiz = await duplicateQuizWithRetry({
      title: `${sourceQuiz.title} (Copy)`,
      description: sourceQuiz.description,
      mode: sourceQuiz.mode,
      state: "DRAFT",
      startsAt: duplicatedStartsAt,
      endsAt: duplicatedEndsAt,
      allowLeaderboard: sourceQuiz.allowLeaderboard,
      leaderboardVisibility: sourceQuiz.leaderboardVisibility,
      showResultsToStudents: false,
      shuffleQuestions: sourceQuiz.shuffleQuestions,
      shuffleOptions: sourceQuiz.shuffleOptions,
      allowedParticipantEmails: sourceQuiz.allowedParticipantEmails,
      allowedEmailDomains: sourceQuiz.allowedEmailDomains,
      negativeMarking: sourceQuiz.negativeMarking ?? undefined,
      maxAttempts: sourceQuiz.maxAttempts,
      owner: {
        connect: {
          id: sourceQuiz.ownerId
        }
      },
      questions: {
        create: sourceQuiz.questions.map((question) => ({
          prompt: question.prompt,
          explanation: question.explanation,
          difficulty: question.difficulty,
          timeLimitSeconds: question.timeLimitSeconds,
          displayOrder: question.displayOrder,
          correctOptionKey: question.correctOptionKey,
          options: {
            create: question.options.map((option) => ({
              optionKey: option.optionKey,
              optionText: option.optionText
            }))
          }
        }))
      }
    });

    return jsonOk(
      {
        quiz: serializeBigInt(duplicatedQuiz),
        message: `Created draft copy of "${sourceQuiz.title}".`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("duplicate quiz error", error);
    return jsonError("Unable to duplicate quiz.", 500);
  }
}
