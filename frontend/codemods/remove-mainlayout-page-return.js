// FILE: frontend/codemods/remove-mainlayout-page-return.js
// Supprime le dernier "return <MainLayout>{page}</MainLayout>;" OU "return page;"
// UNIQUEMENT s'il existe déjà un return avant (sécurité) et que 'page' n'est pas déclarée.
module.exports = function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  const isWhitespace = (n) => n && n.type === 'JSXText' && /^\s*$/.test(n.value ?? n.raw ?? '');
  const unwrapParen = (e) => { let x = e; while (x && x.type === 'ParenthesizedExpression') x = x.expression; return x; };

  const isMainLayoutPage = (arg) => {
    const node = unwrapParen(arg);
    if (!node || node.type !== 'JSXElement') return false;
    const name = node.openingElement?.name;
    if (!name || name.type !== 'JSXIdentifier' || name.name !== 'MainLayout') return false;
    const kids = (node.children || []).filter((c) => !isWhitespace(c));
    if (kids.length !== 1) return false;
    const only = kids[0];
    return only.type === 'JSXExpressionContainer'
      && only.expression?.type === 'Identifier'
      && only.expression.name === 'page';
  };

  const hasEarlierReturn = (stmts) => stmts.slice(0, -1).some((s) => s.type === 'ReturnStatement');

  const fnDeclaresPage = (fn) => {
    const hasParam = (fn.params || []).some((p) => p && p.type === 'Identifier' && p.name === 'page');
    const hasVar = j(fn).find(j.VariableDeclarator, { id: { type: 'Identifier', name: 'page' } }).size() > 0;
    return hasParam || hasVar;
  };

  const processFn = (path) => {
    const fn = path.node;
    if (!fn.body || fn.body.type !== 'BlockStatement') return;
    const body = fn.body.body || [];
    if (body.length < 2) return; // on veut au moins un return plus un "résiduel" potentiel

    const last = body[body.length - 1];
    if (last.type !== 'ReturnStatement') return;
    if (!hasEarlierReturn(body)) return;

    // Cas 1: return <MainLayout>{page}</MainLayout>;
    if (isMainLayoutPage(last.argument)) {
      body.pop();
      changed = true;
      return;
    }

    // Cas 2: return page; si 'page' n'est pas déclarée dans la fonction
    if (last.argument && last.argument.type === 'Identifier' && last.argument.name === 'page' && !fnDeclaresPage(fn)) {
      body.pop();
      changed = true;
    }
  };

  root.find(j.FunctionDeclaration).forEach(processFn);
  root.find(j.FunctionExpression).forEach(processFn);
  root.find(j.ArrowFunctionExpression).forEach((p) => { if (!p.node.expression) processFn(p); });

  return changed ? root.toSource({ quote: 'single', trailingComma: true }) : null;
};
