import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthConfigForRequest, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type GoogleTokenResponse = {
  access_token: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
};

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfigForRequest(request);

  if (!config) {
    return NextResponse.redirect(new URL("/login?error=google-not-configured", request.url));
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("qez_google_oauth_state")?.value;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  cookieStore.delete("qez_google_oauth_state");

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(new URL("/login?error=google-state-mismatch", request.url));
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=google-token", request.url));
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=google-userinfo", request.url));
    }

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!googleUser.email_verified) {
      return NextResponse.redirect(new URL("/login?error=google-email-not-verified", request.url));
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.sub }, { email: googleUser.email.toLowerCase() }]
      }
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          name: user.name || googleUser.name
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.sub,
          passwordHash: "",
          role: "STUDENT"
        }
      });
    }

    const token = signAuthToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    const completeUrl = new URL("/oauth-complete", request.url);
    completeUrl.searchParams.set("token", token);
    completeUrl.searchParams.set("id", user.id.toString());
    completeUrl.searchParams.set("email", user.email);
    completeUrl.searchParams.set("name", user.name);
    completeUrl.searchParams.set("role", user.role);

    return NextResponse.redirect(completeUrl);
  } catch (error) {
    console.error("google callback error", error);
    return NextResponse.redirect(new URL("/login?error=google-callback", request.url));
  }
}
