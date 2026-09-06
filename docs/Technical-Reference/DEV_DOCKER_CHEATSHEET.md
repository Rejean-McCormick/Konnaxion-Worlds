Here is a compact cheat sheet tailored to your project (Docker + Django + migrations).

Assumptions:

* Services: `django`, `celeryworker`, `celerybeat`, `flower`, `postgres`, `redis`, `nginx`
* Compose files: `docker-compose.local.yml`, `docker-compose.production.yml`, `docker-compose.docs.yml`
* Stack is Cookiecutter‑Django style with Postgres + Redis. 

---

## 1. Local Docker (docker-compose.local.yml)

### Start / stop

```bash
# Start whole stack (foreground)
docker compose -f docker-compose.local.yml up

# Start whole stack (background)
docker compose -f docker-compose.local.yml up -d

# Stop and remove containers
docker compose -f docker-compose.local.yml down
```

### Common operations

```bash
# Restart only Django
docker compose -f docker-compose.local.yml restart django

# See logs
docker compose -f docker-compose.local.yml logs -f django
docker compose -f docker-compose.local.yml logs -f celeryworker

# Open a shell in the django container
docker compose -f docker-compose.local.yml run --rm django bash

# Run any Django management command
docker compose -f docker-compose.local.yml run --rm django python manage.py <command>
# Example:
docker compose -f docker-compose.local.yml run --rm django python manage.py createsuperuser
```

### Rebuild (when needed)

Local code is mounted via volume, so:

* Change only Python / templates → usually no rebuild, just restart if needed:

  ```bash
  docker compose -f docker-compose.local.yml restart django
  ```

* Change dependencies (`requirements*.txt`, system libs, Dockerfile) → rebuild:

  ```bash
  docker compose -f docker-compose.local.yml build django celeryworker celerybeat flower
  docker compose -f docker-compose.local.yml up -d django celeryworker celerybeat flower
  ```

---

## 2. Production Docker (docker-compose.production.yml)

### Start / stop

```bash
# Start or update in background
docker compose -f docker-compose.production.yml up -d

# Stop everything
docker compose -f docker-compose.production.yml down
```

### Rebuild after backend changes

After you pull new code (including migrations):

```bash
# Rebuild backend images
docker compose -f docker-compose.production.yml build django celeryworker celerybeat flower

# Bring them up with the new images
docker compose -f docker-compose.production.yml up -d django celeryworker celerybeat flower
```

### Logs and commands

```bash
# Logs
docker compose -f docker-compose.production.yml logs -f django
docker compose -f docker-compose.production.yml logs -f celeryworker

# Management commands (run once, then container exits)
docker compose -f docker-compose.production.yml run --rm django python manage.py <command>
# examples:
docker compose -f docker-compose.production.yml run --rm django python manage.py migrate
docker compose -f docker-compose.production.yml run --rm django python manage.py collectstatic --noinput
```

---

## 3. Django migrations: concept + commands

### What migration files are

* Located in each app: `app_name/migrations/0001_initial.py`, `0002_*.py`, etc.
* Each file describes a change to the database schema:

  * create / delete tables
  * add / remove / rename fields
  * data migrations (`RunPython`)
* Django stores which ones were applied in the `django_migrations` table.
* Normal workflow:

  1. Edit `models.py`
  2. Generate migration files with `makemigrations`
  3. Apply them to the DB with `migrate`

### Local: generate + apply migrations

From project root:

```bash
# 1) Create migrations from your model changes
docker compose -f docker-compose.local.yml run --rm django python manage.py makemigrations

# 2) Apply them to the local database
docker compose -f docker-compose.local.yml run --rm django python manage.py migrate
```

Useful inspections:

```bash
# See migration plan
docker compose -f docker-compose.local.yml run --rm django python manage.py showmigrations

# Only for one app
docker compose -f docker-compose.local.yml run --rm django python manage.py showmigrations your_app_name
```

### Production: apply existing migrations

Best practice:

* Generate migrations locally → commit to git → deploy → then migrate in production.

On the server:

```bash
# Apply all new migrations
docker compose -f docker-compose.production.yml run --rm django python manage.py migrate
```

Run this after you’ve rebuilt and updated the containers with the new code.

---

## 4. “When do I run what?” quick matrix

### Code changes only (views, serializers, templates, etc.)

* Local:

  * `up` already running → Django auto‑reload usually enough
  * If needed: `docker compose -f docker-compose.local.yml restart django`
* Production:

  * Pull code → rebuild backend images → `up -d` → no extra migrate (unless models changed)

### Model changes (fields, new models)

1. Local:

   ```bash
   docker compose -f docker-compose.local.yml run --rm django python manage.py makemigrations
   docker compose -f docker-compose.local.yml run --rm django python manage.py migrate
   ```

2. Commit and push migrations.

3. Production:

   ```bash
   docker compose -f docker-compose.production.yml build django celeryworker celerybeat flower
   docker compose -f docker-compose.production.yml up -d django celeryworker celerybeat flower
   docker compose -f docker-compose.production.yml run --rm django python manage.py migrate
   ```

### You edited an existing migration file

* If that migration is already applied in a DB (especially production):

  * Prefer: create a **new** migration that fixes things instead of editing the old one.
* If it is not applied yet (e.g. new branch, fresh DB):

  * Just run `migrate`:

    ```bash
    # local
    docker compose -f docker-compose.local.yml run --rm django python manage.py migrate
    # production
    docker compose -f docker-compose.production.yml run --rm django python manage.py migrate
    ```

---

## 5. Docs container (optional)

If you want to run the docs stack:

```bash
docker compose -f docker-compose.docs.yml up    # foreground
docker compose -f docker-compose.docs.yml up -d # background
docker compose -f docker-compose.docs.yml down
```

---

If you want, I can turn this into a `docs/DEV_DOCKER_CHEATSHEET.md` you can drop directly into your repo.
