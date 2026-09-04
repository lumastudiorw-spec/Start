// Single-password admin gate for the research dashboard. Deliberately not
// Supabase Auth's magic-link flow: that needs email delivery configured,
// redirect URLs, and a client-side Supabase instance, none of which this
// solo-admin MVP needs. A signed, expiring session cookie is enough here.

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(signature);
}

export function checkPassword(candidate: string): boolean {
  const actual = process.env.ADMIN_PASSWORD;
  return Boolean(actual) && candidate === actual;
}

export async function createSessionCookieValue(): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${expiry}.${await sign(String(expiry))}`;
}

export async function verifySessionCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const [expiryStr, signature] = value.split(".");
  if (!expiryStr || !signature) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  return (await sign(expiryStr)) === signature;
}
