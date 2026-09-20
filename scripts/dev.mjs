#!/usr/bin/env node
/**
 * `npm run dev`.
 *
 * Starts Next with Turbopack, and falls back to webpack + polling if the OS
 * file-watch limit is exhausted.
 *
 * Why this exists. Linux caps inotify INSTANCES per user — 128 here — and each
 * running dev server takes several. With a few projects open at once Turbopack
 * cannot get a watcher and dies on startup with:
 *
 *   TurbopackInternalError: Unable to watch …/app
 *   OS file watch limit reached
 *
 * That is not a problem with this project, and it is confusing precisely
 * because nothing in this repo changed. Webpack with WATCHPACK_POLLING needs
 * no inotify instance at all, so it always starts; it just polls, which uses a
 * little more CPU and rebuilds slightly slower.
 *
 * The real fix is to raise the limit once, which needs root:
 *
 *   sudo sysctl -w fs.inotify.max_user_instances=512
 *   echo 'fs.inotify.max_user_instances=512' | sudo tee /etc/sysctl.d/99-inotify.conf
 *
 * After that Turbopack starts every time and this fallback never fires.
 *
 *   npm run dev              Turbopack, falling back to webpack
 *   npm run dev -- -p 3311   any next dev flag passes through
 */

import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const WATCH_LIMIT = /file watch limit|Unable to watch|inotify/i;

function run(extraArgs, env) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["next", "dev", ...extraArgs, ...args], {
      stdio: ["inherit", "inherit", "pipe"],
      env: { ...process.env, ...env },
    });

    let hitLimit = false;
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      if (WATCH_LIMIT.test(text)) hitLimit = true;
      process.stderr.write(text);
    });

    child.on("exit", (code) => resolve({ code, hitLimit }));
    // Ctrl-C should stop Next, not just this wrapper.
    for (const sig of ["SIGINT", "SIGTERM"]) {
      process.on(sig, () => child.kill(sig));
    }
  });
}

const first = await run([], {});
if (first.code === 0 || !first.hitLimit) process.exit(first.code ?? 0);

console.error(
  "\n[dev] Turbopack could not get a file watcher — the OS inotify instance limit is used up,\n" +
    "[dev] usually by other dev servers running on this machine. Retrying with webpack + polling.\n" +
    "[dev] Permanent fix: sudo sysctl -w fs.inotify.max_user_instances=512\n",
);

const second = await run(["--webpack"], { WATCHPACK_POLLING: "true", CHOKIDAR_USEPOLLING: "1" });
process.exit(second.code ?? 0);
