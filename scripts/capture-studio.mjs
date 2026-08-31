import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chrome = "/usr/bin/google-chrome";
const views = ["front", "q", "side"];
const outDir = process.argv[2] ?? "/tmp/optimus-stills";
const base = process.argv[3] ?? "http://127.0.0.1:5174";

function run(view) {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), `chrome-${view}-`));
    const out = join(outDir, `${view}.png`);
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
      `--user-data-dir=${dir}`,
      "--window-size=1100,1600",
      "--virtual-time-budget=8000",
      "--timeout=15000",
      `--screenshot=${out}`,
      `${base}/?studio=${view}`,
    ];
    const child = spawn(chrome, args, { stdio: "inherit" });
    const killer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`chrome hung on ${view}`));
    }, 20000);
    child.on("exit", (code) => {
      clearTimeout(killer);
      if (code === 0) resolve(out);
      else reject(new Error(`chrome ${view} exited ${code}`));
    });
  });
}

for (const view of views) {
  const path = await run(view);
  console.log("wrote", path);
}
