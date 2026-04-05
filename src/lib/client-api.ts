import { getStoredToken } from "@/lib/client-auth";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const token = getStoredToken();
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Something went wrong.");
  }

  return payload as T;
}
