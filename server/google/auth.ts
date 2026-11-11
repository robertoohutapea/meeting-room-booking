import { ApiError } from "../http";
export interface Env {
  GOOGLE_CALENDAR_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
}
const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const part = (obj: unknown) =>
  encode(new TextEncoder().encode(JSON.stringify(obj)));
export async function accessToken(env: Env) {
  if (
    !env.GOOGLE_CALENDAR_ID ||
    !env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !env.GOOGLE_PRIVATE_KEY
  )
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "ระบบยังไม่พร้อมให้บริการ กรุณาติดต่อผู้ดูแลระบบ",
    );
  const pem = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(
    /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
    "",
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${part({ alg: "RS256", typ: "JWT" })}.${part({ iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, scope: "https://www.googleapis.com/auth/calendar.events", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${encode(new Uint8Array(signature))}`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.error("google_auth_failed", { status: response.status });
    throw new Error("GoogleAuthError");
  }
  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) throw new Error("MissingAccessToken");
  return result.access_token;
}
