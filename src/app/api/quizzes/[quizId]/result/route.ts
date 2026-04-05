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
        showResultsToStudents: true,
        ownerId: true,
        questions: {
          orderBy: {
            displayOrder: "asc"
          },
          select: {
            id: true,
            prompt: true,
            explanation: true,
            displayOrder: true,
            correctOptionKey: true,
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

    const canManage = canManageQuiz(user.role, quiz.ownerId, user.id);

    if (!canManage && !quiz.showResultsToStudents) {
      return jsonError("Results are not available for students on this quiz yet.", 403);
    }

    const attempt = await prisma.attempt.findUnique({
      where: {
        userId_quizId: {
          userId: user.id,
          quizId
        }
      },
      select: {
        id: true,
        totalScore: true,
        totalTimeSeconds: true,
        warningLevel: true,
        suspicious: true,
        submittedAt: true,
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

    if (!attempt) {
      return jsonError("No attempt found for this quiz.", 404);
    }

    const responseMap = new Map(
      attempt.responses.map((response) => [response.questionId.toString(), response])
    );

    return jsonOk({
      quiz: serializeBigInt({
        id: quiz.id,
        title: quiz.title,
        mode: quiz.mode
      }),
      attempt: serializeBigInt(attempt),
      questions: serializeBigInt(
        quiz.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          explanation: question.explanation,
          displayOrder: question.displayOrder,
          correctOptionKey: question.correctOptionKey,
          options: question.options,
          response: responseMap.get(question.id.toString()) ?? null
        }))
      )
    });
  } catch (error) {
    console.error("result route error", error);
    return jsonError("Unable to load quiz result.", 500);
  }
}

