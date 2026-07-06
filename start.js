/**
 * start.js — Reliable launcher for street-music backend + unified server
 *
 * Spawns:
 *   1. NestJS backend (port 3000) — with log file
 *   2. Unified server (port 5181) — with log file, serves static + proxies /api
 *
 * All logs go to ./logs/ so you can diagnose crashes.
 * Run this directly or via start_servers.bat
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LOGS_DIR = path.join(ROOT, "logs");

// Ensure logs directory
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function openLogStream(name) {
  const logPath = path.join(LOGS_DIR, `${name}.log`);
  const stream = fs.createWriteStream(logPath, { flags: "a" });
  stream.write(`\n=== ${name} started at ${timestamp()} ===\n`);
  return stream;
}

function spawnServer(name, cmd, args, cwd) {
  const logStream = openLogStream(name);

  const child = spawn(cmd, args, {
    cwd: cwd || ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stdout.on("data", (data) => {
    logStream.write(data);
  });

  child.stderr.on("data", (data) => {
    logStream.write(`[STDERR] ${data}`);
  });

  child.on("error", (err) => {
    logStream.write(`[FATAL] Failed to start: ${err.message}\n`);
    console.error(`❌ ${name} failed to start: ${err.message}`);
  });

  child.on("exit", (code, signal) => {
    const reason = signal ? `killed by signal ${signal}` : `exited with code ${code}`;
    logStream.write(`\n=== ${name} ${reason} at ${timestamp()} ===\n`);
    logStream.end();
  });

  return child;
}

// ===== LAUNCH =====

console.log("🚀 Starting street-music servers...");
console.log(`   Logs: ${LOGS_DIR}\n`);

// 1. Backend (NestJS on port 3000)
const backend = spawnServer(
  "backend",
  process.execPath,
  [path.join(ROOT, "backend", "dist", "main.js")],
  path.join(ROOT, "backend")
);
console.log(`   ✓ Backend starting (PID ${backend.pid}) → logs/backend.log`);

// 2. Unified server (port 5181)
const frontend = spawnServer(
  "frontend",
  process.execPath,
  [path.join(ROOT, "server.js")],
  ROOT
);
console.log(`   ✓ Frontend starting (PID ${frontend.pid}) → logs/frontend.log`);

// ===== WAIT & REPORT =====
// Give servers 4 seconds to initialize, then report status
setTimeout(() => {
  // Detect LAN IP for convenience
  const os = require("os");
  const interfaces = os.networkInterfaces();
  let lanIp = "localhost";
  for (const [, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        lanIp = addr.address;
        break;
      }
    }
    if (lanIp !== "localhost") break;
  }

  console.log(`\n✅ Servers launched!`);
  console.log(`   Local:  http://localhost:5181/xtwhttra/auth`);
  console.log(`   LAN:    http://${lanIp}:5181/xtwhttra/auth`);
  console.log(`   Login:  13900002222 / 888888`);
  console.log(`\n   👉 Check logs/backend.log and logs/frontend.log if something goes wrong.`);
  console.log(`   👉 Run 'node kill-servers.js' to stop all servers.\n`);
}, 4000);

// Keep process alive to track child status
// (Press Ctrl+C to stop, or close the terminal window)
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
  setTimeout(() => process.exit(0), 1000);
});
