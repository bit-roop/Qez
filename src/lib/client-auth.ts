"use client";

import { AuthSession, ClientUser } from "@/types/client-auth";

const AUTH_STORAGE_KEY = "qez.auth.session";
const AUTH_SESSION_EVENT = "qez-auth-session-changed";

function emitSessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function loadProfilePreferences() {
  return {};
}

export function saveProfilePreferences(
  preferences: Pick<ClientUser, "avatarKey" | "bio" | "institution">
) {
  const current = loadSession();

  if (current) {
    saveSession({
      ...current,
      user: {
        ...current.user,
        ...preferences
      }
    });
    return;
  }

  emitSessionChange();
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitSessionChange();
}

export function storeToken(token: string, user?: ClientUser) {
  const existingUser = user ?? loadSession()?.user;

  if (!existingUser) {
    throw new Error("User details are required to store a session.");
  }

  saveSession({
    token,
    user: existingUser
  });
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  emitSessionChange();
}

export function clearStoredToken() {
  clearSession();
}

export function getCurrentUser(): ClientUser | null {
  return loadSession()?.user ?? null;
}

export function getStoredToken(): string | null {
  return loadSession()?.token ?? null;
}

export function subscribeToSessionChanges(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(AUTH_SESSION_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getDefaultDashboardPath(role: ClientUser["role"]) {
  if (role === "ADMIN") {
    return "/dashboard/admin";
  }

  if (role === "WEBINAR_HOST") {
    return "/dashboard/host";
  }

  if (role === "TEACHER") {
    return "/dashboard/teacher";
  }

  return "/dashboard/student";
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const session = loadSession();
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
}

export async function downloadAuthenticatedFile(
  input: RequestInfo | URL,
  filename: string,
  init?: RequestInit
) {
  const session = loadSession();
  const headers = new Headers(init?.headers);

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Unable to download file.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
