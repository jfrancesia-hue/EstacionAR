// QR firmado + nonce por operacion (CLAUDE.md §3.3). Antifraude.
// El QR identifica al PERMISIONARIO (estatico). El cobro se procesa SIEMPRE del lado del servidor
// contra la credencial/cuenta del permisionario. Un QR clonado no puede desviar fondos.
// Implementacion isomorfica con Web Crypto (Node 20+ y navegador) — sin dependencias externas.

const enc = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlEncodeStr(str: string): string {
  return b64urlEncode(enc.encode(str));
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

export interface QrPayload {
  /** id del permisionario (subject del token). */
  permisionarioId: string;
  /** sector asignado (validado en cada escaneo). */
  sectorId: string | null;
  /** turno asignado. */
  shift: "diurno" | "nocturno" | null;
  /** emitido en (epoch ms). */
  iat: number;
}

/** Firma un token QR de permisionario (JWT-like HMAC-SHA256). */
export async function signQrToken(payload: QrPayload, secret: string): Promise<string> {
  const header = b64urlEncodeStr(JSON.stringify({ alg: "HS256", typ: "QR" }));
  const body = b64urlEncodeStr(JSON.stringify(payload));
  const sig = await hmacSha256(secret, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export interface VerifyResult {
  valid: boolean;
  payload: QrPayload | null;
  reason?: string;
}

/** Verifica la firma e integridad de un token QR. */
export async function verifyQrToken(token: string, secret: string): Promise<VerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, payload: null, reason: "formato_invalido" };
  const [header, body, sig] = parts as [string, string, string];
  const expected = await hmacSha256(secret, `${header}.${body}`);
  if (!timingSafeEqual(sig, expected)) {
    return { valid: false, payload: null, reason: "firma_invalida" };
  }
  try {
    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/"))) as QrPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null, reason: "payload_corrupto" };
  }
}

/** Comparacion en tiempo constante para evitar timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Genera un nonce unico por operacion (un escaneo => un cobro). */
export function generarNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}

/** Firma una operacion concreta (nonce + monto) para ligar el cobro a un unico escaneo. */
export async function firmarOperacion(
  args: { permisionarioId: string; nonce: string; amount: number; plate: string; iat: number },
  secret: string,
): Promise<string> {
  return hmacSha256(secret, JSON.stringify(args));
}

/** Genera un id corto razonable para entidades (sin dependencias). */
export function newId(prefix = "id"): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `${prefix}_${b64urlEncode(bytes)}`;
}
