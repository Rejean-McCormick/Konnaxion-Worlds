// scripts/find-unstyled-pages.mjs
import fg from 'fast-glob';

import fs from 'fs';
import path from 'path';

const root = process.cwd();

// Segments produits
const patterns = [
  'app/ekoh/**/page.tsx',
  'app/ethikos/**/page.tsx',
  'app/keenkonnect/**/page.tsx',
  'app/konnected/**/page.tsx',
  'app/kreative/**/page.tsx',
];

async function main() {
  const files = await fg(patterns, { cwd: root });

  const candidates = [];

  for (const rel of files) {
    const abs = path.join(root, rel);
    const code = fs.readFileSync(abs, 'utf8');

    // 1) déjà habillés -> on skip
    if (
      code.includes('PageContainer') ||
      code.includes('className="container') ||
      code.includes("className='container") ||
      code.includes('container mx-auto') ||
      code.includes('AppShell')
    ) {
      continue;
    }

    // 2) pages sans JSX évident -> on ignore (ex: redirections, simples wrappers)
    if (!code.includes('return (')) {
      continue;
    }

    candidates.push(rel);
  }

  if (!candidates.length) {
    console.log('Aucune page suspecte trouvée.');
    return;
  }

  console.log('Pages probablement sans padding/titre standard:\n');
  for (const file of candidates) {
    console.log(' -', file);
  }

  console.log('\nTotal:', candidates.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

