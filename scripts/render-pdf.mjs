// Renders build/pricing-sheet.html (written by src/build.mjs) to docs/assets/docs/terra-elemental-pricing.pdf
// using a locally installed Chrome or Edge in headless mode.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "build/pricing-sheet.html");
const out = path.join(ROOT, "docs/assets/docs/terra-elemental-pricing.pdf");

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = candidates.find((c) => fs.existsSync(c));
if (!browser) throw new Error("No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.");

fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync(browser, [
  "--headless=new",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--no-pdf-header-footer",
  `--print-to-pdf=${out}`,
  pathToFileURL(src).href,
], { stdio: "ignore" });
console.log(`Wrote ${path.relative(ROOT, out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
