import os from "node:os";
import process from "node:process";
import { spawn } from "node:child_process";

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT || DEFAULT_PORT);
const isWsl =
  Boolean(process.env.WSL_DISTRO_NAME) ||
  os.release().toLowerCase().includes("microsoft") ||
  os.version().toLowerCase().includes("microsoft");

function spawnCommand(command, args, extraEnv = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

function killChild(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill("SIGTERM");
}

const nextProcess = spawnCommand(
  "pnpm",
  ["exec", "next", "dev", "--hostname", "0.0.0.0", "--port", String(port)],
  { PORT: String(port) },
);

let tunnelProcess = null;

if (isWsl) {
  console.log(`[dev] WSL detectado. Abriendo tunnel para http://127.0.0.1:${port}`);

  const useCloudflared = spawn("cloudflared", ["--version"], { stdio: "ignore" });

  useCloudflared.once("error", () => {
    tunnelProcess = spawnCommand("pnpm", ["dlx", "localtunnel", "--port", String(port)]);
  });

  useCloudflared.once("exit", (code) => {
    if (code === 0) {
      tunnelProcess = spawnCommand("cloudflared", ["tunnel", "--url", `http://127.0.0.1:${port}`]);
      return;
    }

    tunnelProcess = spawnCommand("pnpm", ["dlx", "localtunnel", "--port", String(port)]);
  });
}

function shutdown(exitCode = 0) {
  killChild(tunnelProcess);
  killChild(nextProcess);
  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

nextProcess.on("exit", (code) => {
  killChild(tunnelProcess);
  process.exit(code ?? 0);
});
