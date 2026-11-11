// Adds a content hash to the shared CSS and JS links in every page (site.css?v=1a2b3c4d), so browsers
// fetch the new file after a deploy instead of reusing a cached copy that no longer matches the HTML.
// Runs after Tailwind in `npm run build`, because the CSS hash is only known once site.css is built.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "docs");
const ASSETS = ["assets/css/site.css", "assets/js/main.js", "assets/js/calculator.js", "assets/js/pricing-data.js"];
const hash = (rel) => crypto.createHash("sha256").update(fs.readFileSync(path.join(OUT, rel))).digest("hex").slice(0, 10);
const versions = ASSETS.filter((a) => fs.existsSync(path.join(OUT, a))).map((a) => [a, hash(a)]);

const pages = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") walk(p); } else if (e.name.endsWith(".html")) pages.push(p);
  }
};
walk(OUT);

for (const file of pages) {
  let html = fs.readFileSync(file, "utf8");
  for (const [asset, v] of versions) {
    const re = new RegExp(`(${asset.replace(/[.]/g, "\\.")})(\\?v=[0-9a-f]+)?"`, "g");
    html = html.replace(re, `$1?v=${v}"`);
  }
  fs.writeFileSync(file, html);
}
console.log(`Stamped ${versions.length} assets in ${pages.length} pages.`);
