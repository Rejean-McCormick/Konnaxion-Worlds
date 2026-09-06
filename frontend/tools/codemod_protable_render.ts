#!/usr/bin/env ts-node
// FILE: frontend/tools/codemod_protable_render.ts
// Codemod ProTable: normalize render(...) -> render(dom, entity, index, action, schema)
// Safe-by-default. Rebind "v" -> row[dataIndex] uniquement si dataIndex est littéral.
// Run:
//   pnpm ts-node tools/codemod_protable_render.ts --include "app/**/*.tsx,modules/**/*.tsx,components/**/*.tsx" --dry
//   pnpm ts-node tools/codemod_protable_render.ts --include "app/**/*.tsx,modules/**/*.tsx,components/**/*.tsx" --apply
// Optionnel: --tsconfig apps/frontend/tsconfig.json

import {
  ArrowFunction,
  FunctionExpression,
  Node,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  SyntaxKind,
} from 'ts-morph';

import * as fs from 'fs';

type Options = {
  dry: boolean;
  apply: boolean;
  include: string[];
  exclude: string[];
  tsconfig?: string;
};

type Note = { file: string; line: number; message: string };

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = { dry: true, apply: false, include: [], exclude: [], tsconfig: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry') opts.dry = true;
    else if (a === '--apply') { opts.apply = true; opts.dry = false; }
    else if (a === '--tsconfig') { const next = args[i + 1]; if (next) { opts.tsconfig = next; i++; } }
    else if (a === '--include') { const next = args[i + 1]; if (next) { opts.include = next.split(',').map(s => s.trim()).filter(Boolean); i++; } }
    else if (a === '--exclude') { const next = args[i + 1]; if (next) { opts.exclude = next.split(',').map(s => s.trim()).filter(Boolean); i++; } }
  }
  if (opts.include.length === 0) opts.include = ['app/**/*.tsx', 'modules/**/*.tsx', 'components/**/*.tsx'];
  if (opts.exclude.length === 0) opts.exclude = ['**/node_modules/**', '**/.next/**', '**/*.d.ts'];
  return opts;
}

function hasProp(obj: ObjectLiteralExpression, name: string) {
  return !!obj.getProperty(name);
}
function getProp(obj: ObjectLiteralExpression, name: string): PropertyAssignment | undefined {
  const p = obj.getProperty(name);
  if (!p) return undefined;
  return Node.isPropertyAssignment(p) ? p : undefined;
}
function getStringLiteralValue(pa: PropertyAssignment): string | undefined {
  const init = pa.getInitializer();
  if (!init) return undefined;
  if (Node.isStringLiteral(init)) return init.getLiteralText();
  return undefined;
}
function getArrayOfStringLiterals(pa: PropertyAssignment): string[] | undefined {
  const init = pa.getInitializer();
  if (!init || !Node.isArrayLiteralExpression(init)) return undefined;
  const out: string[] = [];
  for (const el of init.getElements()) {
    if (Node.isStringLiteral(el)) out.push(el.getLiteralText());
    else return undefined;
  }
  return out;
}
function buildAccess(rowName: string, pathParts: string[]): string {
  if (pathParts.length === 0) return rowName;
  const dotSafe = pathParts.every(p => /^[A-Za-z_$][\w$]*$/.test(p));
  if (dotSafe) return rowName + '?.' + pathParts.join('?.');
  return pathParts.reduce((acc, seg) => acc + `[${JSON.stringify(seg)}]`, rowName);
}
function idUsedIn(fn: ArrowFunction | FunctionExpression, name?: string): boolean {
  if (!name) return false;
  const body = fn.getBody();
  const ids = body.getDescendantsOfKind(SyntaxKind.Identifier);
  return ids.some(id => id.getText() === name);
}
function setParams(fn: ArrowFunction | FunctionExpression, names: string[]) {
  for (const p of fn.getParameters()) p.remove();
  for (const n of names) fn.addParameter({ name: n });
}
function addHoistToBlock(fn: ArrowFunction | FunctionExpression, varName: string, exprText: string) {
  const body = fn.getBody();
  if (!Node.isBlock(body)) return;
  const decl = `const ${varName} = ${exprText};`;
  const stmts = body.getStatements();
  if (stmts.length > 0) body.insertStatements(0, decl);
  else body.addStatements(decl);
}
function replaceArrowWithBlock(fn: ArrowFunction, params: string[], hoists: string[], returnExpr: string) {
  const newText =
    `(${params.join(', ')}) => {\n` +
    (hoists.length ? '  ' + hoists.join('\n  ') + '\n' : '') +
    `  return ${returnExpr};\n` +
    `}`;
  fn.replaceWithText(newText);
}
function isLikelyColumnObject(obj: ObjectLiteralExpression): boolean {
  if (obj.wasForgotten()) return false;
  if (!hasProp(obj, 'render')) return false;
  if (hasProp(obj, 'dataIndex') || hasProp(obj, 'title') || hasProp(obj, 'valueType') || hasProp(obj, 'valueEnum')) return true;
  return false;
}

const opts = parseArgs();
const tsconfig =
  opts.tsconfig && fs.existsSync(opts.tsconfig)
    ? opts.tsconfig
    : fs.existsSync('tsconfig.json') ? 'tsconfig.json' : undefined;

const project = new Project(
  tsconfig ? { tsConfigFilePath: tsconfig } : { useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true }
);

// Ajout fichiers
for (const pattern of opts.include) project.addSourceFilesAtPaths(pattern);

// Exclusions
const filePaths = project.getSourceFiles()
  .filter(sf => !opts.exclude.some(ex => sf.getFilePath().includes(ex.replace('**/', ''))))
  .map(sf => sf.getFilePath());

const notes: Note[] = [];
let changedCount = 0;

function processFile(filePath: string, notes: Note[]): boolean {
  const sf = project.getSourceFile(filePath);
  if (!sf) return false;

  let fileChanged = false;

  // Passes successives pour éviter les nœuds oubliés
  outer: while (true) {
    let mutatedThisPass = false;

    const objects = sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
    for (const obj of objects) {
      if (obj.wasForgotten()) continue;

      let looksLikeColumn = false;
      try { looksLikeColumn = isLikelyColumnObject(obj); } catch { continue; }
      if (!looksLikeColumn) continue;

      const renderProp = getProp(obj, 'render');
      if (!renderProp) continue;
      if (renderProp.wasForgotten()) continue;

      const init = renderProp.getInitializer();
      if (!init) continue;

      const fnArrow = Node.isArrowFunction(init) ? (init as ArrowFunction) : undefined;
      const fnFunc  = Node.isFunctionExpression(init) ? (init as FunctionExpression) : undefined;
      const fn: ArrowFunction | FunctionExpression | undefined = fnArrow ?? fnFunc;
      if (!fn) {
        notes.push({ file: sf.getFilePath(), line: renderProp.getStartLineNumber(), message: 'SKIP render: not an arrow/function expression' });
        continue;
      }

      // Capture état avant modif
      const params0 = fn.getParameters();
      const p0 = params0[0];
      const p1 = params0[1];
      const p0Name = p0 ? p0.getName() : undefined;
      const p1Name = p1 ? p1.getName() : 'row';

      const diProp = getProp(obj, 'dataIndex');
      let diParts: string[] | undefined;
      if (diProp) {
        const s = getStringLiteralValue(diProp);
        const arr = getArrayOfStringLiterals(diProp);
        diParts = s ? [s] : arr;
      }

      const usesP0 = idUsedIn(fn, p0Name);
      const needHoist = !!(usesP0 && diParts && p0Name);
      const file = sf.getFilePath();
      const line = fn.getStartLineNumber();

      try {
        // Si arrow à corps expression: reconstruire en bloc
        if (fnArrow && !Node.isBlock(fnArrow.getBody())) {
          const bodyExpr = fnArrow.getBody().getText();
          const newParams = ['_dom', 'row', 'index', 'action', 'schema'];
          const hoists = needHoist ? [`const ${p0Name} = ${buildAccess(p1Name || 'row', diParts!)};`] : [];
          replaceArrowWithBlock(fnArrow, newParams, hoists, bodyExpr);
          notes.push({ file, line, message: needHoist ? 'render(expr): rebuilt with hoist' : 'render(expr): rebuilt as block' });
          mutatedThisPass = true; fileChanged = true;
          continue outer;
        }

        // Arrow bloc ou function expression
        // Cas sans paramètre initial
        if (!p0) {
          setParams(fn, ['_dom', 'row', 'index', 'action', 'schema']);
          notes.push({ file, line, message: 'render(): normalized (no params)' });
          mutatedThisPass = true; fileChanged = true;
          continue outer;
        }

        // Cas 1 seul param
        if (params0.length === 1) {
          if (!usesP0) {
            setParams(fn, ['_dom', 'row', 'index', 'action', 'schema']);
            notes.push({ file, line, message: 'render(v): v unused -> normalized signature' });
            mutatedThisPass = true; fileChanged = true;
            continue outer;
          }
          if (needHoist) {
            setParams(fn, ['_dom', 'row', 'index', 'action', 'schema']);
            addHoistToBlock(fn, p0Name!, buildAccess('row', diParts!));
            notes.push({ file, line, message: 'render(v): hoisted v=row[dataIndex]' });
            mutatedThisPass = true; fileChanged = true;
            continue outer;
          } else {
            notes.push({ file, line, message: 'SKIP render(v): no literal dataIndex -> manual review' });
            continue;
          }
        }

        // Cas 2+ params
        if (!usesP0) {
          setParams(fn, ['_dom', 'row', 'index', 'action', 'schema']);
          notes.push({ file, line, message: 'render(v, row): v unused -> normalized signature' });
          mutatedThisPass = true; fileChanged = true;
          continue outer;
        }
        if (needHoist) {
          setParams(fn, ['_dom', 'row', 'index', 'action', 'schema']);
          addHoistToBlock(fn, p0Name!, buildAccess(p1Name || 'row', diParts!));
          notes.push({ file, line, message: `render(v, ${p1Name || 'row'}): hoisted v=${p1Name || 'row'}[dataIndex]` });
          mutatedThisPass = true; fileChanged = true;
          continue outer;
        } else {
          notes.push({ file, line, message: 'SKIP render(v, row): no literal dataIndex -> manual review' });
          continue;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        notes.push({ file, line, message: `SKIP (transform error): ${msg}` });
        continue;
      }
    }

    if (!mutatedThisPass) break;
  }

  return fileChanged;
}

for (const fp of filePaths) {
  const changed = processFile(fp, notes);
  if (changed) changedCount++;
}

if (!opts.dry) project.saveSync();

const summary = {
  filesScanned: filePaths.length,
  filesChanged: changedCount,
  dryRun: opts.dry,
  tsconfig: tsconfig || '(none)',
  include: opts.include,
  exclude: opts.exclude,
};

console.log('--- ProTable render codemod summary ---');
console.log(JSON.stringify(summary, null, 2));
if (notes.length) {
  const grouped = notes.reduce<Record<string, Note[]>>((acc, n) => {
    (acc[n.file] ??= []).push(n);
    return acc;
  }, {});
  for (const [file, list] of Object.entries(grouped)) {
    console.log('\n' + file);
    for (const n of list) console.log(`  L${n.line}: ${n.message}`);
  }
}
