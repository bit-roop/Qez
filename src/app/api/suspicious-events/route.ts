import { Prisma, SuspiciousEventType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { canAttemptQuiz } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const suspiciousEventSchema = z.object({
  quizId: z.string().trim().min(1),
  eventType: z.nativeEnum(SuspiciousEventType),
  metadata: z.record(z.string(), z.unknown()).optional()
});

function parseBigInt(rawValue: string) {
  try {
    return BigInt(rawValue);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const body = await request.json();
    const parsed = suspiciousEventSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid suspicious event payload.");
    }

    const quizId = parseBigInt(parsed.data.quizId);

    if (!quizId) {
      return jsonError("Invalid quiz id.");
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        mode: true,
        state: true
      }
    });

    if (!quiz) {
      return jsonError("Quiz not found.", 404);
    }

    if (!canAttemptQuiz(user.role, quiz.mode)) {
      return jsonError("Your role cannot log suspicious activity for this quiz.", 403);
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingAttempt = await tx.attempt.findUnique({
        where: {
          userId_quizId: {
            userId: user.id,
            quizId
          }
        }
      });

      const nextWarningLevel = Math.min((existingAttempt?.warningLevel ?? 0) + 1, 99);
      const nextTabSwitchCount =
        parsed.data.eventType === SuspiciousEventType.TAB_SWITCH
          ? (existingAttempt?.tabSwitchCount ?? 0) + 1
          : (existingAttempt?.tabSwitchCount ?? 0);
      const suspicious = nextWarningLevel >= 3;

      const attempt = existingAttempt
        ? await tx.attempt.update({
            where: { id: existingAttempt.id },
            data: {
              warningLevel: nextWarningLevel,
              tabSwitchCount: nextTabSwitchCount,
              suspicious
            }
          })
        : await tx.attempt.create({
            data: {
              userId: user.id,
              quizId,
              warningLevel: nextWarningLevel,
              tabSwitchCount: nextTabSwitchCount,
              suspicious
            }
          });

      const event = await tx.suspiciousEvent.create({
        data: {
          attemptId: attempt.id,
          eventType: parsed.data.eventType,
          metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined
        }
      });

      return { attempt, event };
    });

    return jsonOk({
      attempt: serializeBigInt(result.attempt),
      event: serializeBigInt(result.event)
    });
  } catch (error) {
    console.error("suspicious event error", error);
    return jsonError("Unable to record suspicious activity.", 500);
  }
}
