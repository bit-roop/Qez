import { NextRequest } from "next/server";
import { QuizState } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canManageQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createQuizSchema } from "@/lib/validators/quiz";

const partialQuizUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    state: z.nativeEnum(QuizState).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    allowLeaderboard: z.boolean().optional(),
    leaderboardVisibility: z.enum(["HIDDEN", "TOP_10", "FULL"]).optional(),
    showResultsToStudents: z.boolean().optional()
  })
  .refine(
    (value) =>
      !value.startsAt || !value.endsAt || value.endsAt.getTime() > value.startsAt.getTime(),
    {
      message: "Quiz end time must be after start time.",
      path: ["endsAt"]
    }
  );

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
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        questions: {
          include: {
            options: true
          },
          orderBy: {
            displayOrder: "asc"
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canManageQuiz(user.role, quiz.ownerId, user.id)) {
      return jsonError("You do not have permission to view this quiz.", 403);
    }

    return jsonOk({ quiz: serializeBigInt(quiz) });
  } catch (error) {
    console.error("get quiz error", error);
    return jsonError("Unable to fetch quiz.", 500);
  }
}

export async function PATCH(
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

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        ownerId: true
      }
    });

    if (!existingQuiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canManageQuiz(user.role, existingQuiz.ownerId, user.id)) {
      return jsonError("You do not have permission to update this quiz.", 403);
    }

    const attemptCount = await prisma.attempt.count({
      where: {
        quizId
      }
    });

    const body = await request.json();

    if ("questions" in body) {
      if (attemptCount > 0) {
        return jsonError("This quiz can no longer be edited because attempts already exist.", 409);
      }

      const parsed = createQuizSchema.safeParse(body);

      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Invalid quiz update.");
      }

      const updatedQuiz = await prisma.$transaction(async (transaction) => {
        await transaction.quiz.update({
          where: { id: quizId },
          data: {
            title: parsed.data.title,
            description: parsed.data.description,
            mode: parsed.data.mode,
            startsAt: parsed.data.startsAt,
            endsAt: parsed.data.endsAt,
            allowLeaderboard: parsed.data.allowLeaderboard,
            leaderboardVisibility: parsed.data.leaderboardVisibility,
            showResultsToStudents: parsed.data.showResultsToStudents,
            shuffleQuestions: parsed.data.shuffleQuestions,
            shuffleOptions: parsed.data.shuffleOptions
          }
        });

        await transaction.question.deleteMany({
          where: {
            quizId
          }
        });

        for (const question of parsed.data.questions) {
          await transaction.question.create({
            data: {
              quizId,
              prompt: question.prompt,
              explanation: question.explanation,
              difficulty: question.difficulty,
              timeLimitSeconds: question.timeLimitSeconds,
              displayOrder: question.displayOrder,
              correctOptionKey: question.correctOptionKey,
              options: {
                create: question.options.map((option: { optionKey: string; optionText: string }) => ({
                  optionKey: option.optionKey,
                  optionText: option.optionText
                }))
              }
            }
          });
        }

        return transaction.quiz.findUnique({
          where: { id: quizId },
          include: {
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            },
            questions: {
              include: {
                options: true
              },
              orderBy: {
                displayOrder: "asc"
              }
            }
          }
        });
      });

      return jsonOk({ quiz: serializeBigInt(updatedQuiz) });
    }

    const parsed = partialQuizUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid quiz update.");
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: parsed.data,
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        },
        questions: {
          include: {
            options: true
          },
          orderBy: {
            displayOrder: "asc"
          }
        }
      }
    });

    return jsonOk({ quiz: serializeBigInt(updatedQuiz) });
  } catch (error) {
    console.error("update quiz error", error);
    return jsonError("Unable to update quiz.", 500);
  }
}

export async function DELETE(
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

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        ownerId: true,
        title: true
      }
    });

    if (!existingQuiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canManageQuiz(user.role, existingQuiz.ownerId, user.id)) {
      return jsonError("You do not have permission to delete this quiz.", 403);
    }

    await prisma.quiz.delete({
      where: { id: quizId }
    });

    return jsonOk({
      success: true,
      deletedQuizId: quizId.toString(),
      message: `Quiz "${existingQuiz.title}" deleted successfully.`
    });
  } catch (error) {
    console.error("delete quiz error", error);
    return jsonError("Unable to delete quiz.", 500);
  }
}
