import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return jsonError("Unauthorized.", 401);
    }

    const [usersCount, quizzesCount, attemptsCount, suspiciousAttemptsCount, recentUsers, recentQuizzes, roleCounts, quizModeCounts] =
      await Promise.all([
        prisma.user.count(),
        prisma.quiz.count(),
        prisma.attempt.count(),
        prisma.attempt.count({
          where: {
            suspicious: true
          }
        }),
        prisma.user.findMany({
          orderBy: {
            createdAt: "desc"
          },
          take: 6,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }),
        prisma.quiz.findMany({
          orderBy: {
            createdAt: "desc"
          },
          take: 6,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            _count: {
              select: {
                attempts: true,
                questions: true
              }
            }
          }
        }),
        prisma.user.groupBy({
          by: ["role"],
          _count: {
            role: true
          }
        }),
        prisma.quiz.groupBy({
          by: ["mode"],
          _count: {
            mode: true
          }
        })
      ]);

    return jsonOk({
      stats: serializeBigInt({
        usersCount,
        quizzesCount,
        attemptsCount,
        suspiciousAttemptsCount
      }),
      roleCounts: serializeBigInt(roleCounts),
      quizModeCounts: serializeBigInt(quizModeCounts),
      recentUsers: serializeBigInt(recentUsers),
      recentQuizzes: serializeBigInt(recentQuizzes)
    });
  } catch (error) {
    console.error("admin overview error", error);
    return jsonError("Unable to load admin overview.", 500);
  }
}
