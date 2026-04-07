import { NextRequest } from "next/server";
import { jsonError, jsonOk, serializeBigInt } from "@/lib/api";
import { getAuthUserFromRequest } from "@/lib/auth";
import { DatabaseConnectionError } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    return jsonOk({ user: serializeBigInt(user) });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return jsonError("Database connection was interrupted. Please refresh and try again.", 503);
    }

    console.error("me error", error);
    return jsonError("Unable to fetch current user.", 500);
  }
}
