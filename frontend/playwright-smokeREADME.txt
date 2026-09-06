Voici le **kit complet** pour maîtriser le smoke test. Clair. Exhaustif. Prêt à copier.

# 1) Principe

* On génère une **liste de routes** depuis `app/**/page.tsx`.
* On **sert** l’app (dev ou prod).
* Playwright **visite** chaque route, **loggue** HTTP, erreurs console, et **screenshot** si problème.
* Deux modes:

  * **Audit**: n’échoue jamais. Écrit des logs.
  * **Bloquant**: échoue si HTTP ≠ 2xx ou erreurs console (CI/CD).

# 2) Fichiers et structure

## 2.1 Config Playwright

`playwright.smoke.config.ts`

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  testMatch: ['routes.spec.ts'],      // pages réelles uniquement
  testIgnore: ['**/_e2e/**','_e2e/**','**/e2e/**','e2e/**'],
  reporter: 'list',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
```

## 2.2 Génération des routes

`scripts/find-routes.mjs`

```js
import { promises as fs } from 'fs'
import { join, relative } from 'path'

const APP = join(process.cwd(), 'app')
const isGroup = s => /^\(.*\)$/.test(s)
const isDyn   = s => /\[.+\]/.test(s)
const isTest  = s => s === 'index.test' || s.endsWith('.test')

async function walk(dir, acc = []) {
  const ents = await fs.readdir(dir, { withFileTypes: true })
  for (const e of ents) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, acc)
    if (e.isFile() && e.name === 'page.tsx') acc.push(p)
  }
  return acc
}

const files = await walk(APP)
const urls = Array.from(new Set(files
  .map(f => {
    const rel = relative(APP, f).replace(/\\/g, '/')
    return rel === 'page.tsx' ? '/' : '/' + rel.replace(/\/page\.tsx$/, '')
  })
  .filter(u => !u.includes('/api/'))
  .filter(u => !u.split('/').some(isGroup))
  .filter(u => !u.split('/').some(isDyn))
  .filter(u => !u.split('/').some(isTest))
)).sort()

await fs.writeFile('routes.json', JSON.stringify(urls, null, 2))
console.log(`found ${urls.length} routes`)
```

## 2.3 Test smoke des pages réelles

`tests/routes.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const routes: string[] = JSON.parse(fs.readFileSync('routes.json', 'utf8'))
const GATE   = process.env.SMOKE_GATE === '1'
const NAV_TMO = Number(process.env.NAV_TMO ?? 45_000)
const outDir = 'playwright-report'
const toSafe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, '_')

test.describe('Smoke all pages', () => {
  for (const p of routes) {
    test(`GET ${p}`, async ({ page }) => {
      page.setDefaultTimeout(NAV_TMO)
      page.setDefaultNavigationTimeout(NAV_TMO)

      const logs: {type:string;text:string}[] = []
      page.on('console', m => logs.push({ type: m.type(), text: m.text() }))
      page.on('pageerror', e => logs.push({ type: 'pageerror', text: String(e) }))

      let resp: any = null, navErr: string | null = null
      try {
        resp = await page.goto(`http://localhost:3000${p}`, { waitUntil: 'domcontentloaded', timeout: NAV_TMO })
      } catch (e: any) { navErr = String(e?.message ?? e) }

      const status = resp?.status()
      const ok = !!resp?.ok()
      const severe = logs.filter(l =>
        ['error','assert','pageerror'].includes(l.type) && !/favicon\.ico/i.test(l.text)
      )

      fs.mkdirSync(outDir, { recursive: true })
      if (navErr || !ok || severe.length) {
        const base = toSafe(p)
        try { await page.screenshot({ path: path.join(outDir, `smoke_${base}.png`), fullPage: true }) } catch {}
      }
      fs.appendFileSync(path.join(outDir, 'smoke.ndjson'),
        JSON.stringify({ path: p, status, ok, navErr, severe }) + '\n'
      )

      if (GATE) {
        expect(ok, `HTTP ${status} on ${p}`).toBeTruthy()
        expect(severe, `client errors on ${p}`).toHaveLength(0)
      }
    })
  }
})
```

# 3) Scripts package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",

    "routes:gen": "node scripts/find-routes.mjs",

    "smoke:dev": "playwright test -c playwright.smoke.config.ts",
    "smoke:gate": "cross-env SMOKE_GATE=1 playwright test -c playwright.smoke.config.ts",
    "pw:install": "playwright install",
    "postinstall": "playwright install"
  },
  "devDependencies": {
    "@playwright/test": "1.56.1"
  }
}
```

# 4) Exécution standard

## 4.1 Générer les routes

```powershell
node .\scripts\find-routes.mjs
type .\routes.json
```

## 4.2 Lancer l’app

**Prod recommandé** pour stabilité:

```powershell
pnpm build
pnpm start
```

(ou dev: `pnpm dev`)

## 4.3 Lancer les tests

* **Audit (non-bloquant)**:

```powershell
pnpm smoke:dev
```

* **Bloquant (CI)**:

```powershell
$env:SMOKE_GATE="1"
pnpm smoke:dev
```

# 5) Résultats et analyse

## 5.1 Emplacement des artefacts

* Logs NDJSON: `playwright-report/smoke.ndjson`
* Screenshots: `playwright-report/smoke_*.png`

## 5.2 Filtres rapides

```powershell
Select-String -Path .\playwright-report\smoke.ndjson -Pattern '"ok":false|"navErr"|Module not found|Build Error'
```

## 5.3 Lecture NDJSON (exemple)

```json
{"path":"/keenkonnect/dashboard","status":500,"ok":false,"navErr":null,"severe":[{"type":"pageerror","text":"Module not found: Can't resolve 'recharts'"}]}
```

Interprétation:

* `status` ≠ 200 → problème serveur/rendu.
* `navErr` non vide → timeout/navigation interrompue.
* `severe[]` → erreurs console collectées.

# 6) Bonnes pratiques

* **Toujours** lancer les tests avec le serveur **déjà démarré**.
* Préférer **prod** (`build/start`) pour éviter les faux timeouts liés à HMR.
* Exclure les **pages tests** du build et du smoke principal:

  * Renommer `app/**/index.test/page.tsx` → `page.test.tsx` **ou**
  * `playwright.smoke.config.ts` avec `testMatch: ['routes.spec.ts']`.
* **Dependencies manquantes**: installer avant le run (`recharts`, `@ant-design/plots`, etc.).
* **Client Components**: si une page utilise `recharts`, `@ant-design/plots`, `next/navigation`, hooks client → ajouter `'use client'`.

# 7) Troubleshooting

| Symptôme                       | Cause                                   | Action                                                                    |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `No tests found`               | Mauvais `testMatch` ou fichier manquant | Vérifier `tests/routes.spec.ts` et `playwright.smoke.config.ts`           |
| `did not expect test()`        | Versions Playwright différentes         | Utiliser `pnpm exec playwright ...` et fixer `@playwright/test` en devDep |
| Timeouts fréquents             | HMR en dev                              | Tester en prod et réduire `waitUntil` à `domcontentloaded`                |
| Beaucoup de `Module not found` | Paquets non installés                   | `pnpm add …` puis relancer                                                |
| `Functions cannot be passed…`  | UI AntD dans Server Component           | Ajouter `'use client'` ou wrapper client                                  |
| Build bloqué par ESLint        | Règles strictes                         | Temporaire: `eslint.ignoreDuringBuilds:true`, `.eslintignore` pour tests  |

# 8) Mode “scan étendu” (optionnel)

* Générer routes de test: `find-routes-tests.mjs`.
* Test dédié qui **collecte** sans échouer, écrit HTML/PNG: `tests/routes-tests.spec.ts`.
* À utiliser quand tu veux inventorier les `index.test` encore présents, **pas** pour le build.

# 9) Variables utiles

* `SMOKE_GATE=1`: active les `expect(...)` → **bloquant**.
* `NAV_TMO=60000`: override timeout de navigation.

# 10) Séquence type (prod, non-bloquant)

```powershell
node scripts/find-routes.mjs
pnpm build
pnpm start
pnpm smoke:dev
```

# 11) Séquence CI (bloquant)

```bash
node scripts/find-routes.mjs
pnpm build
pnpm start &                    # ou via un job/service
SMOKE_GATE=1 pnpm smoke:dev
```

Ce kit te donne 100% du contrôle: génération des routes, exécution, logs, artefacts, et intégration CI.
