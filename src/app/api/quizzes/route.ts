import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canCreateQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createQuizSchema } from "@/lib/validators/quiz";

function generateJoinCode() {
  return randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

type QuizCreateInput = Omit<Prisma.QuizCreateInput, "joinCode">;

async function createQuizWithRetry(input: QuizCreateInput) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.quiz.create({
        data: {
          ...input,
          joinCode: generateJoinCode()
        },
        include: {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique join code.");
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const quizzes =
      user.role === "ADMIN"
        ? await prisma.quiz.findMany({
            orderBy: { createdAt: "desc" },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              },
              _count: {
                select: {
                  questions: true,
                  attempts: true
                }
              }
            }
          })
        : await prisma.quiz.findMany({
            where: { ownerId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: {
                  questions: true,
                  attempts: true
                }
              }
            }
          });

    return jsonOk({ quizzes: serializeBigInt(quizzes) });
  } catch (error) {
    console.error("list quizzes error", error);
    return jsonError("Unable to fetch quizzes.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    if (!canCreateQuiz(user.role)) {
      return jsonError("You do not have permission to create quizzes.", 403);
    }

    const body = await request.json();
    const parsed = createQuizSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid quiz data.");
    }

    const quiz = await createQuizWithRetry({
      title: parsed.data.title,
      description: parsed.data.description,
      mode: parsed.data.mode,
      owner: {
        connect: {
          id: user.id
        }
      },
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      allowLeaderboard: parsed.data.allowLeaderboard,
      leaderboardVisibility: parsed.data.leaderboardVisibility,
      showResultsToStudents: parsed.data.showResultsToStudents,
      shuffleQuestions: parsed.data.shuffleQuestions,
      shuffleOptions: parsed.data.shuffleOptions,
      negativeMarking:
        parsed.data.negativeMarking !== undefined
          ? new Prisma.Decimal(parsed.data.negativeMarking)
          : undefined,
      questions: {
        create: parsed.data.questions.map((question) => ({
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
        quiz: serializeBigInt(quiz)
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Generated join code collided. Please try again.", 409);
    }

    console.error("create quiz error", error);
    return jsonError("Unable to create quiz.", 500);
  }
}
