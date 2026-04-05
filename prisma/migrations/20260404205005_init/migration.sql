-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'WEBINAR_HOST');

-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('ACADEMIC', 'WEBINAR');

-- CreateEnum
CREATE TYPE "QuizState" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED');

-- CreateEnum
CREATE TYPE "LeaderboardVisibility" AS ENUM ('HIDDEN', 'TOP_10', 'FULL');

-- CreateEnum
CREATE TYPE "SuspiciousEventType" AS ENUM ('TAB_SWITCH', 'RIGHT_CLICK', 'DEVTOOLS_ATTEMPT', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "joinCode" TEXT NOT NULL,
    "mode" "QuizMode" NOT NULL,
    "state" "QuizState" NOT NULL DEFAULT 'DRAFT',
    "ownerId" BIGINT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "allowLeaderboard" BOOLEAN NOT NULL DEFAULT false,
    "leaderboardVisibility" "LeaderboardVisibility" NOT NULL DEFAULT 'HIDDEN',
    "showResultsToStudents" BOOLEAN NOT NULL DEFAULT false,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "negativeMarking" DECIMAL(5,2),
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" BIGSERIAL NOT NULL,
    "quizId" BIGINT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "questionType" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "timeLimitSeconds" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "correctOptionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" BIGSERIAL NOT NULL,
    "questionId" BIGINT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "quizId" BIGINT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "warningLevel" INTEGER NOT NULL DEFAULT 0,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" BIGSERIAL NOT NULL,
    "attemptId" BIGINT NOT NULL,
    "questionId" BIGINT NOT NULL,
    "selectedOptionKey" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeTakenSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuspiciousEvent" (
    "id" BIGSERIAL NOT NULL,
    "attemptId" BIGINT NOT NULL,
    "eventType" "SuspiciousEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspiciousEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebinarResult" (
    "id" BIGSERIAL NOT NULL,
    "quizId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "rank" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebinarResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_joinCode_key" ON "Quiz"("joinCode");

-- CreateIndex
CREATE INDEX "Quiz_ownerId_idx" ON "Quiz"("ownerId");

-- CreateIndex
CREATE INDEX "Quiz_state_startsAt_endsAt_idx" ON "Quiz"("state", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_quizId_displayOrder_key" ON "Question"("quizId", "displayOrder");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_optionKey_key" ON "QuestionOption"("questionId", "optionKey");

-- CreateIndex
CREATE INDEX "Attempt_quizId_idx" ON "Attempt"("quizId");

-- CreateIndex
CREATE INDEX "Attempt_userId_quizId_idx" ON "Attempt"("userId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_userId_quizId_key" ON "Attempt"("userId", "quizId");

-- CreateIndex
CREATE INDEX "Response_attemptId_idx" ON "Response"("attemptId");

-- CreateIndex
CREATE INDEX "Response_questionId_idx" ON "Response"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_attemptId_questionId_key" ON "Response"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "SuspiciousEvent_attemptId_createdAt_idx" ON "SuspiciousEvent"("attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "WebinarResult_quizId_rank_idx" ON "WebinarResult"("quizId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "WebinarResult_quizId_userId_key" ON "WebinarResult"("quizId", "userId");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousEvent" ADD CONSTRAINT "SuspiciousEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarResult" ADD CONSTRAINT "WebinarResult_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarResult" ADD CONSTRAINT "WebinarResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
