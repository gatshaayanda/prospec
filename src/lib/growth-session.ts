import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const PROSPEC_GROWTH_COOKIE = "prospec-growth-session";
const SESSION_SECONDS = 12 * 60 * 60;
const ACCESS_CODE = process.env.GROWTH_ACCESS_CODE || "75363056";

function signingSecret() {
  const secret = process.env.GROWTH_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Set GROWTH_SESSION_SECRET or use the existing server-side owner session secret.");
  return secret;
}
function signature(expiresAt: number) {
  return createHmac("sha256", signingSecret()).update("prospec-growth:" + expiresAt).digest("base64url");
}
export function isGrowthAccessCode(candidate: string) {
  const a = Buffer.from(candidate);
  const b = Buffer.from(ACCESS_CODE);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function createGrowthToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_SECONDS;
  return { value: expiresAt + "." + signature(expiresAt), maxAge: SESSION_SECONDS };
}
export async function hasProspecGrowthSession(request?: Request) {
  const requestCookie = request?.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(PROSPEC_GROWTH_COOKIE + "="))?.slice(PROSPEC_GROWTH_COOKIE.length + 1);
  const cookie = request ? requestCookie || "" : (await cookies()).get(PROSPEC_GROWTH_COOKIE)?.value || "";
  const [expiresText, supplied] = cookie.split(".");
  const expiresAt = Number(expiresText);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !supplied) return false;
  const expected = signature(expiresAt);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
