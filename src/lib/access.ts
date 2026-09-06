export interface AccessUser {
  email: string;
  sub: string;
}

export function guardUser(locals: { user?: AccessUser }): AccessUser | null {
  const user = locals.user;
  return user?.email && user.sub ? user : null;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "application/json",
      Pragma: "no-cache",
    },
  });
}

interface AccessClaims {
  aud?: string | string[];
  email?: string;
  sub?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
}

interface AccessJwk extends JsonWebKey {
  kid?: string;
}

interface AccessCerts {
  keys: AccessJwk[];
}

const ACCESS_HEADER = "Cf-Access-Jwt-Assertion";
const CLOCK_SKEW_SECONDS = 60;
const CERTS_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedCerts: { domain: string; keys: AccessJwk[]; at: number } | null = null;

function normalizeDomain(value?: string): string {
  if (!value) return "";
  return value
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
}

function base64UrlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJson<T>(input: string): T {
  const bytes = base64UrlDecode(input);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function getTokenKeys(teamDomain: string): Promise<AccessJwk[] | null> {
  const now = Date.now();
  if (
    cachedCerts &&
    cachedCerts.domain === teamDomain &&
    now - cachedCerts.at < CERTS_CACHE_TTL_MS
  ) {
    return cachedCerts.keys;
  }

  try {
    const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
    if (!res.ok) return null;
    const data = (await res.json()) as AccessCerts;
    const keys = Array.isArray(data.keys) ? data.keys : [];
    cachedCerts = { domain: teamDomain, keys, at: now };
    return keys;
  } catch {
    if (cachedCerts && cachedCerts.domain === teamDomain) {
      return cachedCerts.keys;
    }
    return null;
  }
}

async function verifySignature(
  header: string,
  payload: string,
  signature: string,
  keys: AccessJwk[]
): Promise<boolean> {
  let headerClaims: { alg?: string; kid?: string };
  try {
    headerClaims = base64UrlDecodeJson<{ alg?: string; kid?: string }>(header);
  } catch {
    return false;
  }

  if (headerClaims.alg !== "RS256") return false;

  const key = keys.find((k) => k.kid === headerClaims.kid && k.alg === "RS256");
  if (!key) return false;

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = new TextEncoder().encode(`${header}.${payload}`);
    const sig = base64UrlDecode(signature);

    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      toArrayBuffer(sig),
      toArrayBuffer(data)
    );
  } catch {
    return false;
  }
}

export interface AccessConfig {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ACCESS_ALLOWED_EMAIL?: string;
}

export type AccessVerification =
  | { ok: true; user: AccessUser }
  | { ok: false; error: string };

export async function verifyAccessRequest(
  request: Request,
  config: AccessConfig | undefined
): Promise<AccessVerification> {
  const teamDomain = normalizeDomain(config?.ACCESS_TEAM_DOMAIN);
  const aud = config?.ACCESS_AUD?.trim();
  const allowedEmail = config?.ACCESS_ALLOWED_EMAIL?.trim().toLowerCase();

  if (!teamDomain || !aud || !allowedEmail) {
    return { ok: false, error: "Access authorization is not configured" };
  }

  const token = request.headers.get(ACCESS_HEADER);
  if (!token) {
    return { ok: false, error: "Missing access token" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "Malformed access token" };
  }

  const [header, payload, signature] = parts;

  let claims: AccessClaims;
  try {
    claims = base64UrlDecodeJson<AccessClaims>(payload);
  } catch {
    return { ok: false, error: "Malformed access token" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || now > claims.exp + CLOCK_SKEW_SECONDS) {
    return { ok: false, error: "Access token expired" };
  }

  if (typeof claims.nbf === "number" && now + CLOCK_SKEW_SECONDS < claims.nbf) {
    return { ok: false, error: "Access token is not active" };
  }

  if (typeof claims.iat === "number" && claims.iat > now + CLOCK_SKEW_SECONDS) {
    return { ok: false, error: "Access token issued in the future" };
  }

  if (claims.iss !== `https://${teamDomain}`) {
    return { ok: false, error: "Access token issuer mismatch" };
  }

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(aud)) {
    return { ok: false, error: "Access token audience mismatch" };
  }

  const keys = await getTokenKeys(teamDomain);
  if (!keys || keys.length === 0) {
    return { ok: false, error: "Unable to fetch access keys" };
  }

  const signatureValid = await verifySignature(header, payload, signature, keys);
  if (!signatureValid) {
    return { ok: false, error: "Access token signature invalid" };
  }

  const email = (claims.email || "").trim().toLowerCase();
  const sub = (claims.sub || "").trim();

  if (!email || !sub || email !== allowedEmail) {
    return { ok: false, error: "Identity not authorized" };
  }

  return { ok: true, user: { email, sub } };
}
