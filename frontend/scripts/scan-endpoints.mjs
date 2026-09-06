import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
// Scan all likely places where network calls live
const SRC_DIRS = ["services","modules","hooks","shared","app","pages"];
const EXTS = new Set([".ts",".tsx",".js",".jsx"]);
const hits = [];

/** Recursively list files with allowed extensions */
async function walk(dir, acc=[]) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (EXTS.has(path.extname(p))) acc.push(p);
  }
  return acc;
}

/** Collect matches from file text */
function scanFile(file, text) {
  const rel = file.replace(/\\/g,"/");

  // 1) Calls through services/_request.ts helpers: get|post|put|patch|del(...)
  const reHelpers = /\b(get|post|put|patch|del)\s*(?:<[^>]*>)?\s*\(\s*([`'"])([^`'"]+)\2/g;

  // 2) Direct axios instance from shared/api.ts: api.get|post|put|patch|delete(...)
  const reAxios = /\bapi\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*([`'"])([^`'"]+)\2/g;

  // 3) Raw fetch(...) URLs
  const reFetch = /\bfetch\(\s*([`'"])([^`'"]+)\1/g;

  let m;
  while ((m = reHelpers.exec(text))) hits.push({ file: rel, method: m[1].toUpperCase(), url: m[3] });
  while ((m = reAxios.exec(text)))   hits.push({ file: rel, method: m[1].toUpperCase(), url: m[3] });
  while ((m = reFetch.exec(text)))   hits.push({ file: rel, method: "FETCH", url: m[2] });
}

(async () => {
  // Gather files
  const files = [];
  for (const d of SRC_DIRS) await walk(path.join(ROOT, d), files);

  // Scan files
  for (const f of files) {
    const s = await fs.readFile(f, "utf8").catch(() => null);
    if (s != null) scanFile(f, s);
  }

  // Aggregate by method+url with list of source files
  const agg = new Map();
  for (const h of hits) {
    const key = `${h.method} ${h.url}`;
    if (!agg.has(key)) agg.set(key, { method: h.method, url: h.url, files: new Set() });
    agg.get(key).files.add(h.file);
  }

  // Sort stable
  const rows = [...agg.values()]
    .map(x => ({ method: x.method, url: x.url, files: [...x.files].sort() }))
    .sort((a,b) => a.url.localeCompare(b.url) || a.method.localeCompare(b.method));

  // Write outputs
  await fs.writeFile("frontend_endpoints.json", JSON.stringify(rows, null, 2), "utf8");
  await fs.writeFile(
    "frontend_endpoints.csv",
    "method,url,files\n" + rows.map(r => `${r.method},${r.url},"${r.files.join(" | ")}"`).join("\n"),
    "utf8"
  );

  console.log(`Endpoints: ${rows.length} -> frontend_endpoints.{json,csv}`);
})();
