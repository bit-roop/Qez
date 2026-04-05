import { QuizMode, UserRole } from "@prisma/client";

export function canCreateQuiz(role: UserRole) {
  return role === "TEACHER" || role === "ADMIN" || role === "WEBINAR_HOST";
}

export function canManageQuiz(role: UserRole, ownerId: bigint, actorId: bigint) {
  if (role === "ADMIN") {
    return true;
  }

  if (role === "TEACHER" || role === "WEBINAR_HOST") {
    return ownerId === actorId;
  }

  return false;
}

export function canAttemptQuiz(role: UserRole, mode: QuizMode) {
  if (mode === "ACADEMIC") {
    return role === "STUDENT";
  }

  return role === "STUDENT";
}

