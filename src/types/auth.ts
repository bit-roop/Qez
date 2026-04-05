import { UserRole } from "@prisma/client";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
};

export type AuthUser = {
  id: bigint;
  email: string;
  role: UserRole;
  name: string;
};
