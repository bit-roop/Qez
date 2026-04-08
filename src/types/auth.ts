import { UserRole } from "@prisma/client";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  emailVerified: boolean;
};

export type AuthUser = {
  id: bigint;
  email: string;
  role: UserRole;
  name: string;
  institution?: string | null;
  bio?: string | null;
  avatarKey?: string | null;
  profileSerial?: string | null;
  emailVerified: boolean;
};
