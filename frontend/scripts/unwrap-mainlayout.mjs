// scripts/unwrap-mainlayout.mjs
import fg from 'fast-glob';

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const pattern = 'app/**/page.tsx';

// Exact import path we care about
const IMPORT_PATH = "@/components/layout-components/MainLayout";

async function main() {
  const files = await fg(pattern, { cwd: root });

  console.log(`Found ${files.length} page.tsx files`);

  for (const rel of files) {
    const abs = path.join(root, rel);
    const code = fs.readFileSync(abs, 'utf8');

    // Only touch files that import MainLayout from the canonical path
    if (!code.includes(IMPORT_PATH)) continue;

    // If there is no <MainLayout ...> tag, nothing to unwrap
    if (!code.includes('<MainLayout')) continue;

    const backupPath = abs + '.bak';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, code, 'utf8');
    }

    let updated = code;

    // 1) Replace opening tags: <MainLayout ...> → <>
    //    - \b ensures we match the component name, not e.g. <MainLayoutFoo>
    //    - [^>]* eats any props inside the tag
    updated = updated.replace(/<MainLayout\b[^>]*>/g, '<>');

    // 2) Replace closing tags: </MainLayout> → </>
    updated = updated.replace(/<\/MainLayout>/g, '</>');

    // 3) If after replacement there is no 'MainLayout' identifier left,
    //    remove the import line as well.
    if (!updated.includes('MainLayout')) {
      // handles:
      //   import MainLayout from '...';
      //   import MainLayout, { Something } from '...';
      const importRegex =
        new RegExp(
          String.raw`import\s+MainLayout\s*(?:,\s*\{[^}]*\})?\s*from\s+['"]${IMPORT_PATH}['"];?\r?\n`,
          'g'
        );

      updated = updated.replace(importRegex, '');
    }

    fs.writeFileSync(abs, updated, 'utf8');
    console.log(`Unwrapped MainLayout in ${rel}`);
  }

  console.log('Done. Backups created as *.bak where changes were made.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
