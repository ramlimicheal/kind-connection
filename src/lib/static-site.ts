import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** ARDE zero-network Content-Security-Policy (mirrors serve.js and the HTML meta tags). */
const ARDE_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; " +
  "script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; " +
  "connect-src 'self'; worker-src 'self' blob:; frame-src 'self'; form-action 'self'";

/** Standard response headers for every served static page. */
const STATIC_HEADERS: HeadersInit = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": ARDE_CSP,
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
};

/**
 * Serves the pre-built static website that lives in `public/`.
 *
 * Pretty URLs like /services or /about are mapped to /services/index.html.
 * Uses direct filesystem read — no network fetch fallback (zero-network contract).
 */
export async function serveStaticPage(_request: Request, pathname: string): Promise<Response> {
  const clean = pathname.replace(/\/+$/, "");
  const relPath = clean === "" ? "index.html" : `${clean.replace(/^\/+/, "")}/index.html`;

  // 1. Try the pretty-URL path: public/{route}/index.html
  try {
    const publicPath = join(process.cwd(), "public", relPath);
    const content = await readFile(publicPath, "utf-8");
    return new Response(content, { status: 200, headers: STATIC_HEADERS });
  } catch {
    // Fall through to direct path attempt
  }

  // 2. Try the exact path: public/{route} (e.g. a file without /index.html)
  if (clean !== "") {
    try {
      const directPath = join(process.cwd(), "public", clean.replace(/^\/+/, ""));
      const content = await readFile(directPath, "utf-8");
      return new Response(content, { status: 200, headers: STATIC_HEADERS });
    } catch {
      // Fall through to 404
    }
  }

  return new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
