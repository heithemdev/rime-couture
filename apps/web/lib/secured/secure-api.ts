// apps/web/lib/secured/secure-api.ts
/**
 * Security helpers for API/Route Handlers (Edge or Node).
 * - CSRF signal check (same-origin/same-site; allows dev)
 * - Strict JSON reader with size limit (Edge-friendly)
 * - No-cache JSON responses with security headers
 * - Tiny in-memory rate limiter with auto-cleanup
 */

const IS_DEV = process.env.NODE_ENV !== 'production';

/* ------------------------- Origins / protocol utils ------------------------- */

// Pre-compiled regex for localhost detection (perf)
const LOCALHOST_RE = /^(localhost|127\.0\.0\.1)(:\d+)?$|\.local$/i;

function isLocalhostHost(host: string | null): boolean {
  return host ? LOCALHOST_RE.test(host) : false;
}

function safeOrigin(input: string | null): string | null {
  if (!input) return null;
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function guessProto(req: Request) {
  const xfProto = req.headers?.get('x-forwarded-proto');
  if (xfProto) return xfProto.toLowerCase();
  try {
    return new URL(req.url).protocol.replace(':', '');
  } catch {
    return 'https';
  }
}

function selfOriginFrom(req: Request) {
  const h = req.headers;
  const rawHost = (h?.get('x-forwarded-host') || h?.get('host') || '').split(',')[0]?.trim() || '';
  const proto = guessProto(req);
  return rawHost ? `${proto}://${rawHost}` : null;
}

/** Build allowlist using the request's own origin plus any extras provided by caller. */
function buildAllowlist(req: Request, extra: readonly string[] = []) {
  const normalized = new Set<string>();

  // extras can be bare hosts or full URLs
  for (const v of extra) {
    const s = v.trim();
    if (!s) continue;
    try {
      const u = s.startsWith('http') ? new URL(s) : new URL(`https://${s}`);
      normalized.add(u.origin);
    } catch {
      /* ignore bad entries */
    }
  }

  const self = selfOriginFrom(req);
  if (self) normalized.add(self);
  return normalized;
}

/* ---------------------------- Responses / CSRF ---------------------------- */

export function noCacheJson(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Vary: 'Cookie, Authorization, Origin',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
      ...extraHeaders,
    },
  });
}

/**
 * CSRF guard: accepts same-origin/site; lenient in dev.
 * Pass extra allowed origins if you need cross-origin POSTs.
 *
 * @example
 * if (!csrfOk(req)) return noCacheJson({ error: "Forbidden" }, 403);
 */
export function csrfOk(req: Request, opts?: { allowlist?: readonly string[] }): boolean {
  const h = req.headers;
  const host = (h?.get('x-forwarded-host') || h?.get('host') || '').split(',')[0]?.trim() || '';

  // Always allow localhost in any environment
  if (isLocalhostHost(host)) return true;

  // Require HTTPS in production
  const proto = guessProto(req);
  if (!IS_DEV && proto !== 'https') return false;

  // Modern browsers send Sec-Fetch-Site header
  const sfs = (h?.get('sec-fetch-site') || '').toLowerCase();
  if (sfs === 'same-origin' || sfs === 'same-site') return true;

  // Check allowlist for cross-origin requests
  const allow = buildAllowlist(req, opts?.allowlist ?? []);
  const origin = safeOrigin(h?.get('origin'));
  const referer = safeOrigin(h?.get('referer'));
  if (origin && allow.has(origin)) return true;
  if (referer && allow.has(referer)) return true;

  // DX convenience in dev only (for tools like Postman)
  if (IS_DEV && h?.get('x-requested-with') === 'XMLHttpRequest') {
    return true;
  }

  return false;
}

/* ---------------- In-memory rate limiting (per instance) ------------------ */

declare global {
  var __RIME_RL__: Map<string, { c: number; r: number }> | undefined;
  var __RIME_RL_CLEANUP__: ReturnType<typeof setInterval> | undefined;
}

const RL: Map<string, { c: number; r: number }> = (globalThis.__RIME_RL__ ??= new Map());

// Auto-cleanup expired entries every 5 minutes (prevents memory leak)
if (!globalThis.__RIME_RL_CLEANUP__ && typeof setInterval !== 'undefined') {
  globalThis.__RIME_RL_CLEANUP__ = setInterval(
    () => {
      const now = Date.now();
      for (const [key, rec] of RL) {
        if (rec.r <= now) RL.delete(key);
      }
    },
    5 * 60 * 1000,
  );
}

type MaybeNextRequest = Request & { nextUrl?: { pathname?: string } };

/**
 * Generate a rate limit key from request context.
 * @param req - The request object
 * @param name - A namespace for the rate limit (e.g., "login", "api")
 * @param userOrIp - Optional user ID to use instead of IP
 */
export function rateKey(req: MaybeNextRequest, name: string, userOrIp?: string): string {
  const h = req.headers;
  const ip =
    (h?.get('x-forwarded-for') || '').split(',')[0]?.trim() || h?.get('x-real-ip') || 'unknown';
  const path = req.nextUrl?.pathname || 'api';
  return `${name}:${userOrIp ?? ip}:${path}:${req.method}`;
}

export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfter: number };

/**
 * Check rate limit for a given key.
 * @param key - The rate limit key (from rateKey())
 * @param limit - Max requests per window (default: 120)
 * @param windowMs - Window duration in ms (default: 60000 = 1 min)
 */
export function checkRateLimit(key: string, limit = 120, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const rec = RL.get(key);

  // New window or expired
  if (!rec || rec.r <= now) {
    RL.set(key, { c: 1, r: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  // Over limit
  if (rec.c >= limit) {
    return { ok: false, retryAfter: Math.ceil((rec.r - now) / 1000) };
  }

  // Increment
  rec.c += 1;
  return { ok: true, remaining: limit - rec.c };
}

/* ---------------- Tight JSON reader (Edge-friendly) ---------------- */

export async function readJson<T = unknown>(
  req: Request,
  maxBytes = 8 * 1024,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: unknown }> {
  const ct = req.headers?.get('content-type') || '';
  if (!ct.includes('application/json'))
    return { ok: false, status: 415, body: { error: 'Unsupported media type' } };

  const body = req.body as ReadableStream<Uint8Array> | null;
  const reader = body?.getReader?.();
  if (!reader) return { ok: false, status: 400, body: { error: 'Invalid body' } };

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
      if (total > maxBytes) return { ok: false, status: 413, body: { error: 'Payload too large' } };
    }
  }

  try {
    const joined = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      joined.set(c, off);
      off += c.byteLength;
    }
    const text = new TextDecoder().decode(joined);
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 400, body: { error: 'Invalid JSON' } };
  }
}
