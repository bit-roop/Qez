import { prisma } from "@/lib/prisma";
import { createRandomToken, hashOpaqueToken } from "@/lib/auth";

const EMAIL_VERIFICATION_HOURS = 24;

export async function createEmailVerificationToken(userId: bigint) {
  const rawToken = createRandomToken(32);
  const tokenHash = hashOpaqueToken(rawToken);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId }
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000)
    }
  });

  return rawToken;
}

export async function consumeEmailVerificationToken(token: string) {
  const tokenHash = hashOpaqueToken(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          emailVerified: true
        }
      }
    }
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    }),
    prisma.emailVerificationToken.delete({
      where: { tokenHash }
    })
  ]);

  return record.user;
}
