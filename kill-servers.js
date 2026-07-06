/**
 * kill-servers.js — Stop all running street-music servers
 */
const { execSync } = require("child_process");
const os = require("os");

console.log("🔍 Finding street-music server processes...");

try {
  if (os.platform() === "win32") {
    // Windows: find and kill node processes running server.js or backend/dist/main.js
    const cmd = `wmic process where "name='node.exe'" get processid,commandline /format:csv 2>nul`;
    const output = execSync(cmd, { encoding: "utf8", windowsHide: true });

    let killed = 0;
    const lines = output.split("\n");
    for (const line of lines) {
      if (
        line.includes("server.js") ||
        line.includes("backend\\dist\\main.js") ||
        line.includes("backend/dist/main.js")
      ) {
        const cols = line.split(",");
        const pid = cols[cols.length - 1]?.trim();
        if (pid && /^\d+$/.test(pid)) {
          try {
            process.kill(parseInt(pid), "SIGTERM");
            console.log(`   ✓ Killed PID ${pid}`);
            killed++;
          } catch (_) {
            // already dead
          }
        }
      }
    }

    if (killed === 0) {
      console.log("   No street-music server processes found.");
    } else {
      console.log(`\n✅ Stopped ${killed} process(es).`);
    }
  } else {
    // Unix: use pkill
    execSync("pkill -f 'server.js' 2>/dev/null; pkill -f 'backend/dist/main.js' 2>/dev/null", {
      encoding: "utf8",
    });
    console.log("✅ Servers stopped.");
  }
} catch (e) {
  console.log("   No processes found or already stopped.");
}
