import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthTokenPayload, AuthUser } from "@/types/auth";

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL;
const TOKEN_EXPIRES_IN = "7d";

function requireJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return JWT_SECRET;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, requireJwtSecret(), {
    expiresIn: TOKEN_EXPIRES_IN
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, requireJwtSecret()) as AuthTokenPayload;
}

export function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function getAuthUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });

    return user;
  } catch {
    return null;
  }
}

export function getGoogleOAuthConfig() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_URL) {
    return null;
  }

  return {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: `${APP_URL}/api/auth/google/callback`
  };
}

export function createRandomToken(size = 32) {
  return randomBytes(size).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
