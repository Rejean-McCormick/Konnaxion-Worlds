# Konnaxion Deployment Guide — Namecheap VPS

## Scope

This guide documents the current production deployment shape used for Konnaxion on the Namecheap VPS.

```text
/home/deploy/apps/Konnaxion/
├── backend/
└── frontend/
```

Runtime shape:

```text
Backend   Django / DRF in Docker Compose
Frontend  Next.js with Node.js / pnpm
Database  PostgreSQL in Docker
Queue     Redis in Docker
Workers   Celery in Docker
Proxy     Traefik in Docker
```

Public routing:

```text
https://konnaxion.com/       -> Next.js frontend :3000
https://konnaxion.com/api/   -> Django
https://konnaxion.com/admin/ -> Django admin
https://konnaxion.com/media/ -> media service
https://konnaxion.com:5555/  -> Flower when enabled
```

## Backend configuration

Required production files:

```text
backend/docker-compose.production.yml
backend/.envs/.production/.django
backend/.envs/.production/.postgres
```

Minimum `.django` shape:

```env
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY='CHANGE_ME'
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=159.198.41.96,localhost,127.0.0.1,konnaxion.com,www.konnaxion.com
USE_DOCKER=yes
DATABASE_URL=postgres://konnaxion:CHANGE_ME_POSTGRES_PASSWORD@postgres:5432/konnaxion
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
DJANGO_ADMIN_URL=admin/
SENTRY_DSN=
ETHIKOS_DEMO_IMPORTER_ENABLED=true
```

Quote `DJANGO_SECRET_KEY` when it contains `$` so Docker Compose does not interpolate parts of the value.

Minimum `.postgres` shape:

```env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=konnaxion
POSTGRES_USER=konnaxion
POSTGRES_PASSWORD=CHANGE_ME_POSTGRES_PASSWORD
```

`backend/requirements/production.txt` must provide the PostgreSQL driver required by the current Django configuration. The current deployment reference uses:

```text
psycopg[binary]==3.2.12
```

## Start and migrate backend

```bash
cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml run --rm django python manage.py migrate
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=100 django
```

Create an administrative user when required:

```bash
docker compose -f docker-compose.production.yml run --rm django python manage.py createsuperuser
```

## Frontend production configuration

Production environment file:

```text
frontend/.env.production
```

Expected public endpoints:

```env
NEXT_PUBLIC_API_BASE=https://konnaxion.com/api
NEXT_PUBLIC_BACKEND_BASE=https://konnaxion.com
```

Next.js embeds public environment variables during the build, so changing these values requires a rebuild.

```bash
cd /home/deploy/apps/Konnaxion/frontend
pnpm install --frozen-lockfile
rm -rf .next
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
pnpm build
```

Start the production frontend:

```bash
cd /home/deploy/apps/Konnaxion/frontend
pkill -f "next start" || true
pkill -f "pnpm start" || true
nohup pnpm start --hostname 0.0.0.0 --port 3000 > frontend.log 2>&1 &
sleep 4
tail -n 60 frontend.log
```

## Traefik routing

Traefik owns the public HTTP/HTTPS entry points. The production routing must preserve these boundaries:

```text
/        -> frontend
/api/    -> Django
/admin/  -> Django
/media/  -> media service
```

After changing Traefik configuration:

```bash
cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml build --no-cache traefik
docker compose -f docker-compose.production.yml up -d --force-recreate traefik
docker compose -f docker-compose.production.yml logs --tail=200 traefik
```

DNS for `konnaxion.com` and `www.konnaxion.com` must resolve to the VPS before certificate issuance. Certificate configuration must contain public DNS names only.

## Worker lifecycle

Celery workers can be stopped while a resource-intensive frontend build runs and restarted afterward.

```bash
cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml stop celeryworker celerybeat flower || true
```

After the build:

```bash
cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml up -d celeryworker celerybeat flower
```

## Deployment sequence

Build locally before upload:

```powershell
cd C:\mycode\Konnaxion\Konnaxion\frontend
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit --pretty false
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm build
```

Deploy a clean source archive to `/home/deploy/apps/Konnaxion`, provision the production environment files outside the archive, then run:

```bash
cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml run --rm django python manage.py migrate

cd /home/deploy/apps/Konnaxion/frontend
pnpm install --frozen-lockfile
rm -rf .next
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
pnpm build
nohup pnpm start --hostname 0.0.0.0 --port 3000 > frontend.log 2>&1 &

cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml up -d --force-recreate traefik celeryworker celerybeat flower
```

## Validation

Backend and platform status:

```bash
cd /home/deploy/apps/Konnaxion/backend
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=100 django
docker compose -f docker-compose.production.yml logs --tail=100 traefik
```

Frontend:

```bash
cd /home/deploy/apps/Konnaxion/frontend
tail -n 100 frontend.log
```

Ports:

```bash
sudo ss -tulnp | grep -E ':80|:443|:3000|:5555'
```

External validation:

```powershell
curl.exe -I https://konnaxion.com
curl.exe -I https://www.konnaxion.com
```

The root response should be served by Next.js; `/api/` and `/admin/` should resolve through the Django route.

## Security baseline

- never commit production `.env` files;
- never paste `DATABASE_URL`, `POSTGRES_PASSWORD`, `DJANGO_SECRET_KEY`, API tokens or private keys into logs or documentation;
- SSH uses keys only;
- root SSH login is disabled;
- public ingress is limited to SSH as administratively required plus HTTP/HTTPS;
- port 3000 is not exposed publicly;
- only expected Docker images and containers run on the host;
- privileged actions and deployment credentials follow least privilege.
