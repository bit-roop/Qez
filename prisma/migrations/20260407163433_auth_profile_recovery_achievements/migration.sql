/*
  Warnings:

  - A unique constraint covering the columns `[profileSerial]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "draftAnswers" JSONB,
ADD COLUMN     "draftTimeSpent" JSONB,
ADD COLUMN     "lastRecoveredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "profileSerial" TEXT;

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateClaim" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "quizId" BIGINT NOT NULL,
    "attemptId" BIGINT,
    "title" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "CertificateClaim_userId_claimedAt_idx" ON "CertificateClaim"("userId", "claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateClaim_userId_quizId_key" ON "CertificateClaim"("userId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "User_profileSerial_key" ON "User"("profileSerial");

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateClaim" ADD CONSTRAINT "CertificateClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateClaim" ADD CONSTRAINT "CertificateClaim_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateClaim" ADD CONSTRAINT "CertificateClaim_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
