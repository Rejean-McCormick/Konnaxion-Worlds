// scripts/scan-layout-anomalies.mjs
import fg from 'fast-glob';

import fs from 'fs';
import path from 'path';

const root = process.cwd();

// Heuristiques de wrapper "correct"
const WRAPPER_MARKERS = [
  'PageContainer',
  'container mx-auto p-5',
];

const MAINLAYOUT_IMPORTS = [
  'import MainLayout from "@/components/layout-components/MainLayout"',
  'import MainLayout from "@/shared/layout/MainLayout"',
];

async function main() {
  // 1) Modules qui rendent leur propre layout
  const moduleFiles = await fg(['modules/**/*.tsx'], { cwd: root });

  const moduleOwnLayout = [];

  for (const rel of moduleFiles) {
    const abs = path.join(root, rel);
    const code = fs.readFileSync(abs, 'utf8');

    if (MAINLAYOUT_IMPORTS.some((s) => code.includes(s))) {
      moduleOwnLayout.push(rel);
    }
  }

  // 2) Pages app/** sans wrapper standard ou avec MainLayout direct
  const appPages = await fg(['app/**/page.tsx'], { cwd: root });

  const appWithMainLayout = [];
  const appWithoutStandardWrapper = [];

  for (const rel of appPages) {
    const abs = path.join(root, rel);
    const code = fs.readFileSync(abs, 'utf8');

    // a) Page qui importe encore MainLayout
    if (MAINLAYOUT_IMPORTS.some((s) => code.includes(s))) {
      appWithMainLayout.push(rel);
    }

    // b) Page sans wrapper standard
    const hasWrapper = WRAPPER_MARKERS.some((m) => code.includes(m));
    if (!hasWrapper) {
      appWithoutStandardWrapper.push(rel);
    }
  }

  console.log('=== Modules avec MainLayout (shell complet dans modules/**) ===');
  moduleOwnLayout.forEach((f) => console.log('  -', f));

  console.log('\n=== app/**/page.tsx qui importent MainLayout (double shell potentiel) ===');
  appWithMainLayout.forEach((f) => console.log('  -', f));

  console.log('\n=== app/**/page.tsx sans wrapper standard (ni PageContainer ni container mx-auto p-5) ===');
  appWithoutStandardWrapper.forEach((f) => console.log('  -', f));

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
