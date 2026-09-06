# Konnaxion Frontend Deployment Runbook

## Purpose
This runbook captures the deployment flow that was validated on the live Konnaxion VPS. It is intended for updating the Next.js frontend after pushing changes to GitHub.

## Verified environment
- Local repo root: `C:\mycode\Konnaxion\Konnaxion`
- Frontend app root: `C:\mycode\Konnaxion\Konnaxion\frontend`
- Live VPS checkout: `/home/deploy/apps/Konnaxion`
- Live frontend working directory: `/home/deploy/apps/Konnaxion/frontend`
- Frontend service name: `konnaxion-frontend`
- Systemd working directory verified: `/home/deploy/apps/Konnaxion/frontend`
- Systemd start command verified: `/usr/local/bin/pnpm start --port 3000`

## Standard deployment flow

### Local machine
```bash
git add .
git commit -m "your change"
git push origin main
```

### VPS deploy
SSH to the VPS, pull the latest code, rebuild the frontend, then restart the frontend service.

```bash
ssh deploy@159.198.41.96

cd /home/deploy/apps/Konnaxion
git pull

cd frontend
export NODE_OPTIONS="--max-old-space-size=4096"
rm -rf .next
pnpm install --frozen-lockfile
pnpm build

sudo systemctl restart konnaxion-frontend
journalctl -u konnaxion-frontend -n 50 --no-pager
```

### Verify the deploy
```bash
curl -I http://127.0.0.1:3000/
curl -I "http://127.0.0.1:3000/search?q=konnected"
curl -I https://konnaxion.com/
curl -I "https://konnaxion.com/search?q=konnected"
```

Expected result: HTTP 200 responses from both the local service on port 3000 and the public domain.

## Important operational notes
- Run `pnpm build` from the `frontend` directory, not from the repo root.
- Set `NODE_OPTIONS=--max-old-space-size=4096` on the VPS before building. This was needed to avoid Next.js heap out-of-memory failures.
- Do not restart the frontend service until the build has finished successfully.
- The frontend service uses the existing production build inside `.next`. If `.next` is missing or incomplete, `next start` will fail immediately.

## Troubleshooting

### Build fails with JavaScript heap out of memory
Symptoms:
- `next build` exits with V8 heap / Mark-Compact / Allocation failed messages.
- The VPS has limited RAM, so large production builds may fail without extra heap space.

Fix:
```bash
cd /home/deploy/apps/Konnaxion/frontend
export NODE_OPTIONS="--max-old-space-size=4096"
rm -rf .next
pnpm install --frozen-lockfile
pnpm build
```

### `next start` says it cannot find a production build
Symptoms:
- `Could not find a production build in the '.next' directory.`
- systemd restarts the service repeatedly and port 3000 does not stay up.

Check that the build output exists before restarting:
```bash
cd /home/deploy/apps/Konnaxion/frontend
ls -la .next
test -f .next/BUILD_ID && echo OK_BUILD
```

Only restart the service after `.next/BUILD_ID` exists.

### Service status checks
```bash
systemctl status konnaxion-frontend --no-pager -l
journalctl -u konnaxion-frontend -n 80 --no-pager
ss -ltnp | grep :3000 || true
```

When healthy, the service should be active (running), Next.js should log `Ready`, and port 3000 should be listening.

### Manual startup test
Run this only when the service is stopped, otherwise port 3000 will already be in use.

```bash
cd /home/deploy/apps/Konnaxion/frontend
NODE_ENV=production /usr/local/bin/pnpm start --port 3000
```

### Windows PowerShell notes
On Windows, `rm -rf` is not valid PowerShell syntax. Use:

```powershell
Remove-Item -Recurse -Force .next
```

Also remember that `pnpm build` must be run from the `frontend` folder, not from the repo root.

## Known caveats from this deployment
- The frontend build completed with warnings related to `@auth0/nextjs-auth0` being included in the Edge Runtime path.
- The frontend build also completed with warnings related to `@ant-design/plots` / `tslib` on `app/ethikos/insights/page.tsx`.
- Those warnings did not block the deploy, but the Ethikos Insights page should be tested explicitly after each release.

## Minimal copy/paste deploy recipe
```bash
ssh deploy@159.198.41.96
cd /home/deploy/apps/Konnaxion
git pull
cd frontend
export NODE_OPTIONS="--max-old-space-size=4096"
rm -rf .next
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart konnaxion-frontend
journalctl -u konnaxion-frontend -n 50 --no-pager
curl -I https://konnaxion.com/
```
