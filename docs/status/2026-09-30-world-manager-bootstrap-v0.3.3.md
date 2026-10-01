# World Manager bootstrap v0.3.3

The standalone Windows manager now owns its first-run bootstrap UX. A fresh checkout no longer requires manually launching the PowerShell setup script before opening the `.pyw`.

Changes:

- `Konnaxion_World_Manager.pyw` detects a missing `.venv\Scripts\python.exe`;
- it automatically launches the repository's `SETUP_KONNAXION_WORLDS.ps1`;
- `pwsh` is preferred, with Windows PowerShell as fallback;
- the setup process runs with `-ExecutionPolicy Bypass`, hidden behind the GUI, while output is streamed into the Manager log;
- after setup succeeds, registry loading continues automatically;
- database URL discovery includes the common sibling checkout `../Konnaxion/backend/.env`;
- if credentials are still absent, the Manager remains usable and tells the operator to paste the URL in the masked Database field and press Refresh.

The PowerShell script remains the canonical standalone setup recipe and can still be run manually for diagnostics, but normal Windows use is now simply double-clicking `Konnaxion_World_Manager.pyw`.
