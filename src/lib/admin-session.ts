import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const PROSPEC_ADMIN_COOKIE = "prospec-owner-session";
const SESSION_SECONDS = 12 * 60 * 60;

function signature(expiresAt: number, password: string) {
  return createHmac("sha256", password).update("prospec-owner:" + expiresAt).digest("base64url");
}

export function createProspecAdminToken(password: string, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_SECONDS;
  return { value: expiresAt + "." + signature(expiresAt, password), maxAge: SESSION_SECONDS };
}

export async function hasProspecAdminSession() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookie = (await cookies()).get(PROSPEC_ADMIN_COOKIE)?.value || "";
  const [expiresText, supplied] = cookie.split(".");
  const expiresAt = Number(expiresText);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !supplied) return false;
  const expected = signature(expiresAt, password);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
