import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/email-verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const baseUrl = process.env.APP_URL ?? request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?verified=missing`);
  }

  const result = await consumeEmailVerificationToken(token);

  if (!result) {
    return NextResponse.redirect(`${baseUrl}/login?verified=invalid`);
  }

  return NextResponse.redirect(`${baseUrl}/login?verified=success`);
}
