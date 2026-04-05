-- Add participant restriction fields to quizzes
ALTER TABLE "Quiz"
ADD COLUMN "allowedParticipantEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "allowedEmailDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
