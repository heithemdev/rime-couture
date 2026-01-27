/**
 * UI Security Helpers (safe in client & server)
 * - CSP builders (dev + prod compatible)
 * - Server-side HTML sanitization (DOMPurify+JSDOM, graceful fallback)
 * - Safe URL / JSON helpers
 * - Hardened search params parser
 */

import React, { type JSX } from "react";

const IS_SERVER = typeof window === "undefined";

/* ----------------------------- Base64 & Nonce ---------------------------- */

/**
 * Generate a cryptographically secure nonce for CSP.
 * Uses crypto.getRandomValues when available, falls back to Math.random.
 */
export function generateNonce(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  
  // Use crypto API if available (browser or Node 19+)
  const crypto = globalThis.crypto;
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    // Fallback for older environments
    for (let i = 0; i < bytes; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to URL-safe base64
  if (IS_SERVER && typeof Buffer !== "undefined") {
    return Buffer.from(buf).toString("base64url");
  }
  
  // Browser fallback
  let binary = "";
  for (let i = 0; i < buf.length; i++) {
    binary += String.fromCharCode(buf[i]!);
  }
  return btoa(binary).replace(/[+/=]/g, "");
}

/* ---------------------------------- CSP ---------------------------------- */

/** Options for building a Content Security Policy */
export type CspOptions = {
  /** Nonce for script-src (enables strict-dynamic) */
  nonce?: string;
  /** Additional allowed image sources */
  imgSrc?: string[];
  /** Additional allowed connect (fetch/XHR) sources */
  connectSrc?: string[];
  /** Additional allowed script sources */
  scriptSrc?: string[];
  /** Additional allowed style sources */
  styleSrc?: string[];
  /** Additional allowed font sources */
  fontSrc?: string[];
  /** Additional allowed frame sources */
  frameSrc?: string[];
  /** Allow data: URIs for images (default: true) */
  allowDataImages?: boolean;
  /** Allow unsafe-inline for styles (default: true, needed for Tailwind) */
  allowInlineStyles?: boolean;
  /** Add upgrade-insecure-requests directive (default: true) */
  upgradeInsecure?: boolean;
};

/**
 * Cloudinary Upload Widget requirements:
 * - scripts load from Cloudinary widget hosts
 * - widget renders an iframe
 * - uploads go to Cloudinary Upload API
 */
const CLOUDINARY_WIDGET_SCRIPT_HOSTS = [
  "https://upload-widget.cloudinary.com",
  "https://widget.cloudinary.com",
];

const CLOUDINARY_WIDGET_FRAME_HOSTS = [
  "https://upload-widget.cloudinary.com",
  "https://widget.cloudinary.com",
];

const CLOUDINARY_UPLOAD_CONNECT_HOSTS = [
  "https://api.cloudinary.com",
  "https://upload-widget.cloudinary.com",
  "https://widget.cloudinary.com",
  "https://res.cloudinary.com",
];

const CLOUDINARY_IMG_HOSTS = ["https://res.cloudinary.com"];

export function buildCSP({
  nonce = "",
  imgSrc = [],
  connectSrc = [],
  scriptSrc = [],
  styleSrc = [],
  fontSrc = [],
  frameSrc = [],
  allowDataImages = true,
  allowInlineStyles = true,
  upgradeInsecure = true,
}: CspOptions): string {
  const self = "'self'";

  // Images: self + https + blob + (optional data) + allowlisted extras
  const img = [self, "https:", "blob:", ...(allowDataImages ? ["data:"] : []), ...imgSrc];

  // Connect: self + https (+ ws for dev compatibility) + allowlisted extras
  const conn = [self, "https:", "wss:", "ws:", ...connectSrc];

  // Script:
  // - Only add 'strict-dynamic' when a nonce is provided (avoids surprising behavior without a nonce).
  // - Keep host allowlists for third-party scripts like Cloudinary widget.
  const scr = [
    self,
    nonce ? `'nonce-${nonce}'` : "",
    ...(nonce ? ["'strict-dynamic'"] : []),
    ...scriptSrc,
  ].filter(Boolean);

  const sty = [self, ...(allowInlineStyles ? ["'unsafe-inline'"] : []), ...styleSrc];
  const fnt = [self, "https:", "data:", ...fontSrc];
  const frm = [self, ...frameSrc];

  return [
    `default-src ${self}`,
    `base-uri ${self}`,
    `form-action ${self}`,
    `frame-ancestors 'none'`,
    `img-src ${img.join(" ")}`,
    `font-src ${fnt.join(" ")}`,
    `connect-src ${conn.join(" ")}`,
    `script-src ${scr.join(" ")}`,
    `style-src ${sty.join(" ")}`,
    `frame-src ${frm.join(" ")}`,
    upgradeInsecure ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildDevCSP(): string {
  // Dev stays permissive so HMR/tools don’t break.
  // Cloudinary hosts included so the widget works in dev too.
  const cloudinaryScripts = CLOUDINARY_WIDGET_SCRIPT_HOSTS.join(" ");
  const cloudinaryFrames = CLOUDINARY_WIDGET_FRAME_HOSTS.join(" ");
  const cloudinaryConnect = CLOUDINARY_UPLOAD_CONNECT_HOSTS.join(" ");
  const cloudinaryImgs = CLOUDINARY_IMG_HOSTS.join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `img-src 'self' https: data: blob: ${cloudinaryImgs}`,
    "font-src 'self' https: data:",
    `connect-src 'self' https: http: ws: wss: ${cloudinaryConnect}`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: ${cloudinaryScripts}`,
    "style-src 'self' 'unsafe-inline' https:",
    `frame-src 'self' ${cloudinaryFrames}`,
    "worker-src 'self' blob:",
  ].join("; ");
}

export function buildProdCSPCompat(): string {
  // Prod CSP that stays compatible with Next.js + Upload Widget (no nonce requirement).
  // Keep it tight: only allow Cloudinary widget where needed.
  const cloudinaryScripts = CLOUDINARY_WIDGET_SCRIPT_HOSTS.join(" ");
  const cloudinaryFrames = CLOUDINARY_WIDGET_FRAME_HOSTS.join(" ");
  const cloudinaryConnect = CLOUDINARY_UPLOAD_CONNECT_HOSTS.join(" ");
  const cloudinaryImgs = CLOUDINARY_IMG_HOSTS.join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `img-src 'self' https: data: blob: ${cloudinaryImgs}`,
    "font-src 'self' https: data:",
    `connect-src 'self' https: ${cloudinaryConnect}`,
    `script-src 'self' ${cloudinaryScripts}`,
    "style-src 'self' 'unsafe-inline' https:",
    `frame-src 'self' ${cloudinaryFrames}`,
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * React component that renders security-related meta tags.
 * Use in <head> via Next.js metadata or manually.
 */
export function SecureHead({
  csp,
  referrerPolicy = "strict-origin-when-cross-origin",
  permissionsPolicy = "geolocation=(), microphone=(), camera=()",
}: {
  csp: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}): JSX.Element {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement("meta", {
      httpEquiv: "Content-Security-Policy",
      content: csp,
    }),
    React.createElement("meta", {
      name: "referrer",
      content: referrerPolicy,
    }),
    React.createElement("meta", {
      httpEquiv: "Permissions-Policy",
      content: permissionsPolicy,
    }),
  );
}

/* -------------------- Server-side sanitization with fallback ------------------- */

type PurifyInstance = {
  sanitize: (s: string, c: unknown) => string;
  setConfig: (cfg: Record<string, unknown>) => void;
};
type DomPurifyFactory = (w: Window) => PurifyInstance;
type JsdomModule = { JSDOM: new (html?: string) => { window: Window } };

// Cached purify instance (initialized once per runtime)
let _purify: PurifyInstance | null | undefined;

function toDomPurifyFactory(mod: unknown): DomPurifyFactory | null {
  if (typeof mod === "function") return mod as DomPurifyFactory;
  if (mod && typeof (mod as { default?: unknown }).default === "function") {
    return (mod as { default: unknown }).default as DomPurifyFactory;
  }
  return null;
}

async function getPurify(): Promise<PurifyInstance | null> {
  // Return cached instance
  if (_purify !== undefined) return _purify;
  
  // Client-side: no DOMPurify (use server components for sanitization)
  if (!IS_SERVER) return (_purify = null);

  // Dynamic import avoids bundling these in edge/client
  try {
    const importer = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const [jsdom, dompurifyMod] = await Promise.all([
      importer("jsdom").catch(() => null) as Promise<JsdomModule | null>,
      importer("dompurify").catch(() => null),
    ]);

    const createDOMPurify = toDomPurifyFactory(dompurifyMod);
    if (!jsdom || !createDOMPurify) return (_purify = null);

    const { JSDOM } = jsdom;
    const windowShim = new JSDOM("").window as unknown as Window;
    const purify = createDOMPurify(windowShim);

    purify.setConfig({
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });

    return (_purify = purify);
  } catch {
    return (_purify = null);
  }
}

function escapeHtml(input: string): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sanitizeHTML(
  dirty: string,
  opts: { allowIframes?: boolean; extraAllowedSchemes?: string[] } = {},
) {
  const purify = await getPurify();
  if (!purify) return escapeHtml(dirty);

  const allowSchemes = new Set(["http", "https", "mailto", "tel", ...(opts.extraAllowedSchemes ?? [])]);
  const cfg = {
    ADD_TAGS: opts.allowIframes ? ["iframe"] : [],
    ADD_ATTR: opts.allowIframes ? ["allow", "allowfullscreen", "frameborder", "scrolling"] : [],
    ALLOWED_URI_REGEXP: new RegExp(
      `^(?:(?:${Array.from(allowSchemes).join("|")}):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))`,
      "i",
    ),
  };
  return purify.sanitize(String(dirty ?? ""), cfg);
}

export async function stripHTML(dirty: string): Promise<string> {
  const purified = await sanitizeHTML(dirty, {});
  return purified.replace(/<[^>]*>/g, "");
}

/* ------------------------------ Safe URLs/JSON ----------------------------- */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function safeHref(href: string | null | undefined, base?: string): string {
  if (!href) return "#";
  try {
    const u = new URL(href, base ?? "http://localhost");
    if (!SAFE_PROTOCOLS.has(u.protocol)) return "#";
    return u.toString();
  } catch {
    return "#";
  }
}

export function safeRedirectTarget(
  target: string | null | undefined,
  allowedHosts: string[] = [],
  fallback = "/",
): string {
  if (!target) return fallback;
  try {
    if (target.startsWith("/")) return target.replace(/\/{2,}/g, "/");
    const u = new URL(target);
    if (SAFE_PROTOCOLS.has(u.protocol) && allowedHosts.includes(u.host)) return u.toString();
    return fallback;
  } catch {
    return fallback;
  }
}

export function externalRel(target?: string | null, rel?: string | null): string | undefined {
  if (target === "_blank") {
    const set = new Set((rel ?? "").split(/\s+/).filter(Boolean));
    set.add("noopener");
    set.add("noreferrer");
    return Array.from(set).join(" ");
  }
  return rel ?? undefined;
}

export function safeJson<T>(obj: T): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* ------------------------- Hardened search params ------------------------- */

export class SafeSearchParams {
  constructor(private sp: URLSearchParams | import("next/navigation").ReadonlyURLSearchParams) {}

  string(name: string, opts?: { maxLen?: number; default?: string; trim?: boolean }) {
    const raw = this.sp.get(name);
    if (!raw) return opts?.default ?? null;
    const v = (opts?.trim ? raw.trim() : raw).slice(0, Math.max(0, opts?.maxLen ?? 200));
    return v;
  }
  int(name: string, opts?: { min?: number; max?: number; default?: number }) {
    const raw = this.sp.get(name);
    if (raw == null) return opts?.default ?? null;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return opts?.default ?? null;
    const min = opts?.min ?? Number.MIN_SAFE_INTEGER;
    const max = opts?.max ?? Number.MAX_SAFE_INTEGER;
    return Math.min(max, Math.max(min, n));
  }
  float(name: string, opts?: { min?: number; max?: number; default?: number }) {
    const raw = this.sp.get(name);
    if (raw == null) return opts?.default ?? null;
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return opts?.default ?? null;
    const min = opts?.min ?? -Number.MAX_SAFE_INTEGER;
    const max = opts?.max ?? Number.MAX_SAFE_INTEGER;
    return Math.min(max, Math.max(min, n));
  }
  bool(name: string, opts?: { default?: boolean }) {
    const raw = this.sp.get(name);
    if (raw == null) return opts?.default ?? null;
    const v = raw.toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }
  csv(name: string, opts?: { maxItems?: number; maxItemLen?: number; lowercase?: boolean }) {
    const raw = this.sp.get(name);
    if (!raw) return [] as string[];
    const maxItems = Math.max(1, opts?.maxItems ?? 50);
    const maxItemLen = Math.max(1, opts?.maxItemLen ?? 100);
    const items = raw
      .split(",")
      .map((s) => (opts?.lowercase ? s.toLowerCase() : s).trim())
      .filter(Boolean)
      .slice(0, maxItems)
      .map((s) => s.slice(0, maxItemLen));
    return Array.from(new Set(items));
  }
  oneOf<T extends readonly string[]>(name: string, values: T, opts?: { default?: T[number] }): T[number] | null {
    const v = this.string(name, { maxLen: 50, trim: true });
    if (!v) return opts?.default ?? null;
    return (values as readonly string[]).includes(v) ? (v as T[number]) : opts?.default ?? null;
  }
}

/* --------------------------------- Utils --------------------------------- */

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const maskEmail = (e: string) => e.replace(/(.).+(@.+)/, "$1***$2");
export const maskPhone = (p: string) => p.replace(/(\d{2})\d+(\d{2})$/, "$1****$2");
