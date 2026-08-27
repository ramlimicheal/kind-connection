import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Serves the pre-built static website that lives in `public/`.
 * Pretty URLs like /services or /about are mapped to /services/index.html.
 * Uses direct filesystem read for 100% reliable Node/Bun SSR, with fetch fallback.
 */
export async function serveStaticPage(request: Request, pathname: string): Promise<Response> {
  const clean = pathname.replace(/\/+$/, "");
  const relPath = clean === "" ? "index.html" : `${clean.replace(/^\/+/, "")}/index.html`;

  // 1. Try direct filesystem read from public directory
  try {
    const publicPath = join(process.cwd(), "public", relPath);
    const content = await readFile(publicPath, "utf-8");
    return new Response(content, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (fsErr) {
    // 2. Try direct file without /index.html (e.g. if requested with exact path)
    try {
      const directPath = join(process.cwd(), "public", clean.replace(/^\/+/, ""));
      const content = await readFile(directPath, "utf-8");
      return new Response(content, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {}
  }

  // 3. Fallback to network fetch
  try {
    const target = clean === "" ? "/index.html" : `${clean}/index.html`;
    const res = await fetch(new URL(target, request.url), {
      headers: { accept: "text/html" },
    });

    if (res.ok) {
      const html = await res.text();
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  } catch {}

  return new Response("Not found", { status: 404 });
}
