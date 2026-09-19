# Konnaxion Worlds standalone bootstrap

This repository owns its Django bootstrap. It does not import or execute the main Konnaxion application.

- Setup: `SETUP_KONNAXION_WORLDS.ps1`
- Manager: `Konnaxion_World_Manager.pyw`
- Django CLI: `.venv\Scripts\python.exe backend\worlds_manage.py ...`
- Settings: `backend/worlds_config/settings.py`
- Database: `KONNAXION_WORLDS_DATABASE_URL` (PostgreSQL required for World schema operations)
