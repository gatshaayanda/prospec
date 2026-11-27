import { NextRequest, NextResponse } from "next/server";
import { createGrowthToken, hasProspecGrowthSession, isGrowthAccessCode, PROSPEC_GROWTH_COOKIE } from "@/lib/growth-session";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ authenticated: await hasProspecGrowthSession() });
}
export async function POST(request: NextRequest) {
  let code = "";
  try {
    const body = await request.json() as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "Enter the Growth Desk access number." }, { status: 400 });
  }
  if (!isGrowthAccessCode(code)) return NextResponse.json({ error: "That access number was not accepted." }, { status: 401 });
  let session: ReturnType<typeof createGrowthToken>;
  try { session = createGrowthToken(); }
  catch { return NextResponse.json({ error: "Growth Desk session signing is not configured. Set GROWTH_SESSION_SECRET or the existing ADMIN_PASSWORD." }, { status: 503 }); }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(PROSPEC_GROWTH_COOKIE, session.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: session.maxAge });
  return response;
}
export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PROSPEC_GROWTH_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
