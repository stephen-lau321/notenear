/**
 * Unified Server — serves frontend static files + proxies /api to NestJS backend
 * Replaces the broken vite-preview approach. Zero external dependencies.
 *
 * Architecture:
 *   :5181/notenear/*  → static files from frontend/dist/
 *   :5181/api/*       → proxied to localhost:3000/api/v1/*
 *   :5181/            → redirect to /notenear/
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// ===== CONFIG =====
const PORT = process.env.PORT || 5181;
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const BACKEND_HOST = process.env.BACKEND_HOST || "127.0.0.1";
const STATIC_DIR = path.join(__dirname, "frontend", "dist");
const LOG_FILE = path.join(__dirname, "logs", "server.log");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ===== LOGGING =====
function log(level, msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (_) {
    // ignore log write failures
  }
}

// ===== MIME TYPES =====
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

// ===== STATIC FILE SERVING =====
function serveStatic(reqPath, res) {
  // Map /notenear/... to frontend/dist/...
  let relativePath = reqPath;
  if (relativePath.startsWith("/notenear/")) {
    relativePath = relativePath.slice("/notenear/".length) || "index.html";
  } else if (relativePath.startsWith("/notenear")) {
    relativePath = relativePath.slice("/notenear".length) || "index.html";
  }

  // Security: prevent directory traversal
  if (relativePath.includes("..")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let filePath = path.join(STATIC_DIR, relativePath || "index.html");

  // If the path doesn't have an extension or doesn't exist, serve index.html (SPA fallback)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(STATIC_DIR, "index.html");
  }

  // Check again after fallback
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    filePath = path.join(filePath, "index.html");
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
  }

  const content = fs.readFileSync(filePath);
  const mime = getMime(filePath);

  // Cache policy: assets have hashed filenames, cache aggressively
  const cacheControl = relativePath.match(/^assets\//)
    ? "public, max-age=31536000, immutable"
    : "no-cache";

  res.writeHead(200, {
    "Content-Type": mime,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(content);
}

// ===== API PROXY =====
function proxyApi(req, res) {
  const targetPath = req.url.replace(/^\/api/, "/api/v1");

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers },
  };

  // Remove hop-by-hop headers
  delete options.headers["host"];
  delete options.headers["connection"];

  const proxyReq = http.request(options, (proxyRes) => {
    // Log API requests
    const shortUrl = req.url.length > 120 ? req.url.slice(0, 120) + "..." : req.url;
    log("API", `${req.method} ${shortUrl} → ${proxyRes.statusCode}`);

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    log("ERROR", `Backend unreachable (${BACKEND_HOST}:${BACKEND_PORT}): ${err.message}`);
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        success: false,
        statusCode: 502,
        message: "后端服务不可用，请确认后端已启动",
        timestamp: new Date().toISOString(),
      })
    );
  });

  // Pipe request body
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

// ===== REQUEST HANDLER =====
function handleRequest(req, res) {
  // Use WHATWG URL API (no deprecation warning)
  const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsed.pathname;

  // Serve uploaded files (teacher certs, ID cards, etc.)
  if (pathname.startsWith("/uploads/")) {
    const uploadPath = path.join(__dirname, "uploads", pathname.slice("/uploads/".length));
    if (uploadPath.includes("..")) { res.writeHead(403); return res.end("Forbidden"); }
    if (fs.existsSync(uploadPath)) {
      res.writeHead(200, { "Content-Type": getMime(uploadPath), "Cache-Control": "public, max-age=3600" });
      return res.end(fs.readFileSync(uploadPath));
    }
    res.writeHead(404);
    return res.end("Not Found");
  }

  // API proxy
  if (pathname.startsWith("/api/")) {
    return proxyApi(req, res);
  }

  // Redirect root to /notenear/
  if (pathname === "/") {
    res.writeHead(302, { Location: "/notenear/" });
    return res.end();
  }

  // Favicon shortcut (also check in dist root)
  if (pathname === "/favicon.ico" || pathname === "/favicon.svg") {
    const favPath = path.join(STATIC_DIR, pathname.slice(1));
    if (fs.existsSync(favPath)) {
      res.writeHead(200, { "Content-Type": getMime(favPath), "Cache-Control": "public, max-age=86400" });
      return res.end(fs.readFileSync(favPath));
    }
    res.writeHead(204);
    return res.end();
  }

  // PWA manifest (short path redirect to notenear)
  if (pathname === "/manifest.webmanifest" || pathname === "/manifest.json") {
    res.writeHead(302, { Location: "/notenear/" + pathname.slice(1) });
    return res.end();
  }

  // Everything else: serve static under /notenear/ prefix
  return serveStatic(pathname, res);
}

// ===== STARTUP =====
const server = http.createServer(handleRequest);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    log("FATAL", `Port ${PORT} is already in use. Is another server running?`);
  } else {
    log("FATAL", `Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  log("START", `========================================`);
  log("START", `Unified server running on port ${PORT}`);
  log("START", `Static files: ${STATIC_DIR}`);
  log("START", `API proxy: /api/* → http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1/*`);
  log("START", `Open: http://localhost:${PORT}/notenear/auth`);
  log("START", `========================================`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  log("STOP", "Server shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  log("STOP", "Server shutting down...");
  server.close(() => process.exit(0));
});

// Log uncaught exceptions
process.on("uncaughtException", (err) => {
  log("FATAL", `Uncaught exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log("ERROR", `Unhandled rejection: ${reason}`);
});
