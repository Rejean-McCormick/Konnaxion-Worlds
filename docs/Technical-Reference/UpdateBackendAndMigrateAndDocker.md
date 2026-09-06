# Reference: Backend Update & Database Migration Workflow

**Target Environment:** Docker (using `docker-compose.local.yml`)
**Framework:** Django
**Shell:** PowerShell (Windows)

This document outlines the required operational steps to apply changes to the backend data models and update the running environment.

### 1\. Build and Start Services

When backend code or dependencies change, the containers must be rebuilt to reflect the new state.

  * **Command:**
    ```powershell
    docker-compose -f docker-compose.local.yml up -d --build
    ```
  * **Purpose:** Rebuilds the Docker images (installing any new Python requirements) and starts the services in detached mode.

### 2\. Generate Migrations

Django must detect changes in `models.py` and create the corresponding migration files.

  * **Command:**
    ```powershell
    docker-compose -f docker-compose.local.yml run --rm django python manage.py makemigrations
    ```
  * **Purpose:** Scans the codebase for model changes and creates new files in the `migrations/` directories.

### 3\. Apply Migrations

The generated migration files must be applied to the PostgreSQL database to update the schema.

  * **Command:**
    ```powershell
    docker-compose -f docker-compose.local.yml run --rm django python manage.py migrate
    ```
  * **Purpose:** Executes the SQL required to synchronize the database schema with the current model state.

### 4\. Verify Service Status

Ensure the Django application is running correctly after updates.

  * **Command:**
    ```powershell
    docker-compose -f docker-compose.local.yml ps
    ```
  * **Purpose:** Lists running containers. The `django` container should have a status of `Up`.

### 5\. (Optional) Create Superuser

If the database was reset or a new admin is required.

  * **Command:**
    ```powershell
    docker-compose -f docker-compose.local.yml run --rm django python manage.py createsuperuser
    ```
  * **Purpose:** Creates an administrative user for accessing the Django Admin panel.