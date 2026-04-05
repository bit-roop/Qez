export type ClientUser = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "WEBINAR_HOST";
};

export type AuthSession = {
  token: string;
  user: ClientUser;
};

