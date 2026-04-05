import { NextResponse } from "next/server";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serializeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, nestedValue: unknown) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue
    )
  );
}

