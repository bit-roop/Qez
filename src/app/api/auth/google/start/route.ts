import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRandomToken, getGoogleOAuthConfigForRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfigForRequest(request);

  if (!config) {
    return NextResponse.json(
      {
        error: "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL."
      },
      { status: 500 }
    );
  }

  const state = createRandomToken(16);
  const cookieStore = await cookies();
  cookieStore.set("qez_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/"
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(url);
}
