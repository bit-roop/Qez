const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export function isCaptchaConfigured() {
  return Boolean(TURNSTILE_SECRET_KEY);
}

export async function verifyCaptchaToken(token?: string | null) {
  if (!isCaptchaConfigured()) {
    return process.env.NODE_ENV !== "production";
  }

  if (!token) {
    return false;
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY ?? "",
      response: token
    })
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { success?: boolean };
  return Boolean(result.success);
}
