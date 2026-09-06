/* scripts/wrapModuleShells.ts
 *
 * Codemod pour envelopper les pages app/keenkonnect, app/ekoh, app/kreative
 * dans leurs shells respectifs.
 *
 * Utilise ts-morph pour rester relativement fiable :
 * - Ne modifie que les fichiers qui n'utilisent pas déjà le shell.
 * - Ne supprime aucun contenu existant.
 */

import { Project, SyntaxKind, Node, QuoteKind, JsxElement, JsxSelfClosingElement } from 'ts-morph';
import * as path from 'path';

type ModuleConfig = {
  name: 'keenkonnect' | 'ekoh' | 'kreative';
  glob: string;
  shellImportPath: string;
  shellComponent: string;
};

const ROOT = process.cwd(); // racine du repo
const FRONTEND_ROOT = path.join(ROOT, 'frontend');

const modules: ModuleConfig[] = [
  {
    name: 'keenkonnect',
    glob: path.join(FRONTEND_ROOT, 'app', 'keenkonnect', '**', 'page.tsx'),
    shellImportPath: '@/app/keenkonnect/KeenPageShell',
    shellComponent: 'KeenPage',
  },
  {
    name: 'ekoh',
    glob: path.join(FRONTEND_ROOT, 'app', 'ekoh', '**', 'page.tsx'),
    shellImportPath: '@/app/ekoh/EkohPageShell',
    shellComponent: 'EkohPageShell',
  },
  {
    name: 'kreative',
    glob: path.join(FRONTEND_ROOT, 'app', 'kreative', '**', 'page.tsx'),
    shellImportPath: '@/app/kreative/kreativePageShell',
    shellComponent: 'KreativePageShell',
  },
];

function deriveTitleFromPath(filePath: string, moduleName: string): string {
  // ex: /.../frontend/app/keenkonnect/projects/my-projects/page.tsx
  const parts = filePath.split(path.sep);
  const idx = parts.lastIndexOf(moduleName);
  if (idx === -1 || idx + 2 >= parts.length) {
    return 'Page';
  }
  // segments après le nom du module: ["projects", "my-projects", "page.tsx"]
  const subParts = parts.slice(idx + 1);
  // on prend l'avant-dernier segment (dossier) comme base du titre
  const lastDir = subParts.length >= 2 ? subParts[subParts.length - 2] : subParts[0];
  const slug = lastDir.replace(/\.[tj]sx?$/, '');
  const words = slug.split(/[-_]/g).filter(Boolean);
  if (!words.length) return 'Page';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function wrapFileWithShell(config: ModuleConfig, filePath: string, project: Project): boolean {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    console.warn(`⚠️  Impossible de charger ${filePath}`);
    return false;
  }

  // 1) déjà importé / déjà utilisé ?
  const hasShellImport = sourceFile
    .getImportDeclarations()
    .some((d) => d.getModuleSpecifierValue() === config.shellImportPath);

  const usesShellJSX = sourceFile
    .getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .some((el) => el.getTagNameNode().getText() === config.shellComponent);

  if (hasShellImport || usesShellJSX) {
    console.log(`↷  Skip (déjà shell) : ${sourceFile.getBaseName()}`);
    return false;
  }

  // 2) ajouter import si nécessaire
  sourceFile.addImportDeclaration({
    defaultImport: config.shellComponent,
    moduleSpecifier: config.shellImportPath,
  });

  // 3) trouver l'export par défaut
  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
  if (!defaultExportSymbol) {
    console.warn(`⚠️  Pas d'export par défaut dans ${sourceFile.getBaseName()}, skip`);
    return false;
  }

  const declarations = defaultExportSymbol.getDeclarations();
  if (!declarations.length) {
    console.warn(`⚠️  Pas de déclaration pour l'export par défaut dans ${sourceFile.getBaseName()}, skip`);
    return false;
  }

  let wrapped = false;

  for (const decl of declarations) {
    // cas 1 : export default function MyPage() { return (...) }
    if (Node.isFunctionDeclaration(decl)) {
      const body = decl.getBody();
      if (!body) continue;
      const returns = body.getDescendantsOfKind(SyntaxKind.ReturnStatement);
      if (!returns.length) continue;

      const ret = returns[0];
      const expr = ret.getExpression();
      if (!expr) continue;

      // on ne wrap que si l'expression est du JSX (ou parenthésée)
      const exprText = expr.getText();
      const title = deriveTitleFromPath(filePath, config.name);

      expr.replaceWithText(
        `<${config.shellComponent} title="${title}" description="">${exprText}</${config.shellComponent}>`,
      );
      wrapped = true;
      break;
    }

    // cas 2 : const MyPage = () => { return (...) }; export default MyPage;
    if (Node.isVariableDeclaration(decl)) {
      const init = decl.getInitializer();
      if (!init) continue;

      if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
        const body = init.getBody();

        // body sous forme "return (...)" ou directement "(...)" pour les arrow functions
        if (Node.isBlock(body)) {
          const returns = body.getDescendantsOfKind(SyntaxKind.ReturnStatement);
          if (!returns.length) continue;
          const ret = returns[0];
          const expr = ret.getExpression();
          if (!expr) continue;

          const exprText = expr.getText();
          const title = deriveTitleFromPath(filePath, config.name);

          expr.replaceWithText(
            `<${config.shellComponent} title="${title}" description="">${exprText}</${config.shellComponent}>`,
          );
          wrapped = true;
          break;
        } else {
          // arrow function "const Page = () => (<div>...</div>)"
          const exprText = body.getText();
          const title = deriveTitleFromPath(filePath, config.name);

          init.setBodyText(
            `(
  <${config.shellComponent} title="${title}" description="">
    ${exprText}
  </${config.shellComponent}>
)`,
          );
          wrapped = true;
          break;
        }
      }
    }
  }

  if (!wrapped) {
    console.warn(`⚠️  Pas de return JSX simple dans ${filePath}, aucune modif appliquée`);
    return false;
  }

  console.log(`✅  Wrapped with ${config.shellComponent}: ${path.relative(FRONTEND_ROOT, filePath)}`);
  return true;
}

async function main() {
  const project = new Project({
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });

  let modifiedCount = 0;

  for (const mod of modules) {
    console.log(`\n=== Module ${mod.name} ===`);
    // ts-morph supporte les globs natifs
    const sourceFiles = project.addSourceFilesAtPaths(mod.glob);

    for (const sf of sourceFiles) {
      const filePath = sf.getFilePath();
      const changed = wrapFileWithShell(mod, filePath, project);
      if (changed) {
        modifiedCount++;
      }
    }
  }

  if (modifiedCount > 0) {
    await project.save();
    console.log(`\n💾 Sauvegarde terminée. Fichiers modifiés : ${modifiedCount}`);
  } else {
    console.log('\nAucune modification appliquée.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
