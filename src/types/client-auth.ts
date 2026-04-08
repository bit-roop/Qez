export type ClientUser = {
  id: string;
  email: string;
  name: string;
  avatarKey?: string | null;
  bio?: string | null;
  institution?: string | null;
  profileSerial?: string | null;
  emailVerified?: boolean;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "WEBINAR_HOST";
};

export type AuthSession = {
  token: string;
  user: ClientUser;
};
