// FILE: frontend/scripts/find-routes.mjs
import { promises as fs } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Config / CLI args
// ---------------------------------------------------------------------------
//
// Usage (from frontend root):
//   node scripts/find-routes.mjs
//   node scripts/find-routes.mjs --root app --out routes.json
//
// Defaults are kept compatible with the previous version.
//

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const APP = path.resolve(getArg('--root', 'app'));
const out = path.resolve(getArg('--out', 'routes.json'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isGroup = (s) => s.startsWith('(') && s.endsWith(')');
const isDyn = (s) => s.startsWith('[') && s.endsWith(']');
const isTest = (s) => /(^|\.)(test|spec)(\.|$)/i.test(s);

// We usually don’t want technical / error-only pages in the "public" routes list
const isErrorOrSystemSegment = (s) =>
  s === 'not-found' ||
  s === 'error' ||
  s === '_debug' ||
  s === '_internal';

// Recursively walk the app/ tree and collect all file paths
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      return p;
    }),
  );

  return files.flat();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const all = await walk(APP);

// Only Next.js app-router page files
const pages = all.filter((f) =>
  /[\\/](page\.(tsx|ts|jsx|js))$/.test(f),
);

const urls = Array.from(
  new Set(
    pages
      .map((f) => {
        const rel = path
          .relative(APP, f)
          .replace(/\\/g, '/');

        // Root page: app/page.tsx -> '/'
        if (rel === 'page.tsx' || rel === 'page.ts') {
          return '/';
        }

        // Strip trailing /page.(tsx|ts|jsx|js)
        return (
          '/' +
          rel.replace(
            /\/page\.(tsx|ts|jsx|js)$/,
            '',
          )
        );
      })
      // Exclude API routes (even if someone misplaces a page.tsx in api/)
      .filter((u) => !u.includes('/api/'))
      // Exclude route groups like (marketing), (auth), etc.
      .filter((u) => !u.split('/').some(isGroup))
      // Exclude dynamic segments [slug], [id], etc.
      .filter((u) => !u.split('/').some(isDyn))
      // Exclude test/spec-only folders if any slipped in
      .filter((u) => !u.split('/').some(isTest))
      // Exclude error / system-only pages from the generic route list
      .filter(
        (u) =>
          !u
            .split('/')
            .some(isErrorOrSystemSegment),
      ),
  ),
).sort();

await fs.writeFile(out, JSON.stringify(urls, null, 2));
console.log(
  `found ${urls.length} routes -> ${path.relative(
    process.cwd(),
    out,
  )}`,
);
