"use strict";
const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const requestedPort = process.env.PORT === undefined ? 8080 : Number(process.env.PORT);
if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
  console.error(`[ARDE] Invalid PORT: ${process.env.PORT}`);
  process.exit(1);
}
const PORT = requestedPort;
const BASE_DIR = fs.realpathSync.native(__dirname);
const NETWORK_ISOLATION = process.env.ARDE_NETWORK_MODE !== "connected";
const NETWORK_POLICY = "default-src 'self'; base-uri 'self'; object-src 'none'; " +
  "script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; " +
  "connect-src 'self'; worker-src 'self' blob:; frame-src 'self'; form-action 'self'";

const MIME = new Map(Object.entries({
  ".avif":"image/avif", ".css":"text/css; charset=UTF-8",
  ".gif":"image/gif", ".html":"text/html; charset=UTF-8",
  ".ico":"image/x-icon", ".jpeg":"image/jpeg", ".jpg":"image/jpeg",
  ".js":"application/javascript; charset=UTF-8",
  ".json":"application/json; charset=UTF-8", ".map":"application/json; charset=UTF-8",
  ".mjs":"application/javascript; charset=UTF-8", ".mp4":"video/mp4",
  ".png":"image/png", ".svg":"image/svg+xml", ".txt":"text/plain; charset=UTF-8",
  ".wasm":"application/wasm", ".webm":"video/webm", ".webp":"image/webp",
  ".woff":"font/woff", ".woff2":"font/woff2", ".xml":"application/xml; charset=UTF-8"
}));

function isWithin(base, candidate) {
  const relative = path.relative(base, candidate);
  return relative === "" || (
    !path.isAbsolute(relative) &&
    relative !== ".." &&
    !relative.startsWith(".." + path.sep)
  );
}

function sendText(res, status, body, extra = {}) {
  const payload = Buffer.from(body, "utf8");
  res.writeHead(status, {
    "Content-Type":"text/plain; charset=UTF-8",
    "Content-Length":payload.length,
    "X-Content-Type-Options":"nosniff",
    ...extra,
  });
  res.end(payload);
}

async function resolveTarget(requestUrl) {
  const rawPath = requestUrl.split("?", 1)[0];
  let decoded;
  try { decoded = decodeURIComponent(rawPath); }
  catch { return {status:400, message:"Malformed URI"}; }
  if (decoded.includes("\0")) return {status:400, message:"NUL byte prohibited"};
  if (decoded === "/") decoded = "/index.html";

  const lexical = path.resolve(BASE_DIR, "." + path.normalize(decoded));
  if (!isWithin(BASE_DIR, lexical)) return {status:403, message:"Path traversal prohibited"};

  let candidate = lexical;
  try {
    const initial = await fsp.stat(candidate);
    if (initial.isDirectory()) candidate = path.join(candidate, "index.html");
    const real = await fsp.realpath(candidate);
    if (!isWithin(BASE_DIR, real)) return {status:403, message:"Symlink escape prohibited"};
    const stat = await fsp.stat(real);
    if (!stat.isFile()) return {status:404, message:"Not found"};
    return {status:200, real, stat};
  } catch (error) {
    if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
      return {status:404, message:"Not found"};
    }
    return {status:500, message:"Filesystem access error"};
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendText(res, 405, "Method not allowed", {"Allow":"GET, HEAD"});
    }
    const target = await resolveTarget(req.url || "/");
    if (target.status !== 200) {
      if ((req.url || "").includes(".framercms")) {
        const headers = {
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-cache",
          "Content-Type": "application/octet-stream",
          "Content-Length": 0,
          "X-Content-Type-Options": "nosniff"
        };
        res.writeHead(200, headers);
        return res.end();
      }
      return sendText(res, target.status, target.message);
    }

    // Open before emitting headers, then serve through this exact handle. This
    // prevents a rename/symlink swap from changing the bytes after validation.
    const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0);
    let handle;
    let openStat;
    try {
      handle = await fsp.open(target.real, flags);
      openStat = await handle.stat();
      if (!openStat.isFile()) {
        await handle.close();
        return sendText(res, 404, "Not found");
      }
    } catch {
      if (handle) await handle.close().catch(() => {});
      return sendText(res, 500, "Open failed");
    }

    const extension = path.extname(target.real).toLowerCase();
    const contentType = MIME.get(extension) || "application/octet-stream";
    let start = 0;
    let end = openStat.size - 1;
    let status = 200;
    const headers = {
      "Accept-Ranges":"bytes",
      "Cache-Control":"no-cache",
      "Content-Type":contentType,
      "X-Content-Type-Options":"nosniff",
      "X-Frame-Options":"SAMEORIGIN",
      "Referrer-Policy":"strict-origin-when-cross-origin",
    };
    if (NETWORK_ISOLATION) headers["Content-Security-Policy"] = NETWORK_POLICY;

    // Framer CMS readers request several inclusive byte slices through a
    // `?range=start-end,...` query and require one concatenated 200 response.
    // This is distinct from the standard HTTP Range header handled below.
    let cmsRange = null;
    try { cmsRange = new URL(req.url || "/", "http://127.0.0.1").searchParams.get("range"); }
    catch {
      await handle.close();
      return sendText(res, 400, "Malformed URI");
    }
    if (cmsRange !== null && extension === ".framercms") {
      if (req.headers.range) {
        await handle.close();
        return sendText(res, 400, "Conflicting range mechanisms");
      }
      const pieces = cmsRange.split(",");
      if (!pieces.length || pieces.length > 512) {
        await handle.close();
        return sendText(res, 416, "Invalid CMS range");
      }
      const ranges = [];
      let total = 0;
      for (const piece of pieces) {
        const match = /^(\d+)-(\d+)$/.exec(piece);
        if (!match) {
          await handle.close();
          return sendText(res, 416, "Invalid CMS range");
        }
        const from = Number(match[1]);
        const to = Number(match[2]);
        if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from > to || to >= openStat.size) {
          await handle.close();
          return sendText(res, 416, "CMS range not satisfiable");
        }
        total += to - from + 1;
        if (!Number.isSafeInteger(total) || total > openStat.size) {
          await handle.close();
          return sendText(res, 416, "CMS range response too large");
        }
        ranges.push({from, to});
      }
      headers["Content-Length"] = total;
      res.writeHead(200, headers);
      if (req.method === "HEAD" || total === 0) {
        await handle.close();
        return res.end();
      }
      const output = Buffer.allocUnsafe(total);
      let offset = 0;
      for (const {from, to} of ranges) {
        const length = to - from + 1;
        const result = await handle.read(output, offset, length, from);
        if (result.bytesRead !== length) {
          await handle.close();
          return res.destroy(new Error("Short CMS range read"));
        }
        offset += length;
      }
      await handle.close();
      return res.end(output);
    }

    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        await handle.close();
        return sendText(res, 416, "Invalid range", {"Content-Range":`bytes */${openStat.size}`});
      }
      if (match[1] === "" && match[2] === "") {
        await handle.close();
        return sendText(res, 416, "Invalid range");
      }
      if (match[1] === "") {
        const suffix = Number(match[2]);
        if (!Number.isSafeInteger(suffix) || suffix <= 0) {
          await handle.close();
          return sendText(res, 416, "Invalid range");
        }
        start = Math.max(0, openStat.size - suffix);
      } else {
        start = Number(match[1]);
        if (match[2] !== "") end = Number(match[2]);
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= openStat.size) {
        await handle.close();
        return sendText(res, 416, "Range not satisfiable", {"Content-Range":`bytes */${openStat.size}`});
      }
      end = Math.min(end, openStat.size - 1);
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${openStat.size}`;
    }
    headers["Content-Length"] = Math.max(0, end - start + 1);
    res.writeHead(status, headers);
    if (req.method === "HEAD" || openStat.size === 0) {
      await handle.close();
      return res.end();
    }

    const stream = handle.createReadStream({autoClose:true, start, end});
    stream.on("error", error => res.destroy(error));
    stream.pipe(res);
  } catch (error) {
    if (!res.headersSent) sendText(res, 500, "Internal server error");
    else res.destroy(error);
  }
});

server.on("error", error => {
  console.error(`[ARDE SERVER] ${error.message}`);
  process.exitCode = 1;
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[ARDE SERVER] http://127.0.0.1:${PORT}`);
});
