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

export function isAllowedQuizParticipant(
  email: string,
  allowedParticipantEmails: string[],
  allowedEmailDomains: string[]
) {
  if (allowedParticipantEmails.length === 0 && allowedEmailDomains.length === 0) {
    return true;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailDomain = normalizedEmail.split("@")[1] ?? "";

  if (allowedParticipantEmails.map((item) => item.toLowerCase()).includes(normalizedEmail)) {
    return true;
  }

  return allowedEmailDomains.some((domainRule) => {
    const normalizedRule = domainRule.trim().toLowerCase().replace(/^[@.]+/, "");
    return emailDomain === normalizedRule || emailDomain.endsWith(`.${normalizedRule}`);
  });
}

export function describeAllowedParticipants(
  allowedParticipantEmails: string[],
  allowedEmailDomains: string[]
) {
  const emailPreview =
    allowedParticipantEmails.length > 0
      ? `Allowed emails: ${allowedParticipantEmails.slice(0, 10).join(", ")}${
          allowedParticipantEmails.length > 10 ? ` and ${allowedParticipantEmails.length - 10} more` : ""
        }.`
      : "";

  const domainPreview =
    allowedEmailDomains.length > 0
      ? ` Allowed domains: ${allowedEmailDomains.map((domain) => `@${domain}`).join(", ")}.`
      : "";

  return `${emailPreview}${domainPreview}`.trim();
}
