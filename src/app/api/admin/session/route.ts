import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createProspecAdminToken, hasProspecAdminSession, PROSPEC_ADMIN_COOKIE } from "@/lib/admin-session";

export const runtime = "nodejs";

function matchesSecret(candidate: string, expected: string) {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  return NextResponse.json({ authenticated: await hasProspecAdminSession() });
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: "Owner access is not configured. Set the server-only ADMIN_PASSWORD environment variable." }, { status: 503 });
  let candidate = "";
  try {
    const body = await request.json() as { password?: unknown };
    candidate = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Enter the owner access word." }, { status: 400 });
  }
  if (!candidate || !matchesSecret(candidate, expected)) return NextResponse.json({ error: "That access word was not accepted." }, { status: 401 });
  const session = createProspecAdminToken(expected);
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(PROSPEC_ADMIN_COOKIE, session.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: session.maxAge });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PROSPEC_ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
