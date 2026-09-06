# FILE: RUN_ETHIKOS_DELIVERY_WORKFLOW_ONECLICK.pyw
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from tkinter import Label, Tk, messagebox


ROOT = Path(r"C:\mycode\Konnaxion\Konnaxion")
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
WORKFLOW_PS1 = ROOT / "RUN_ETHIKOS_DELIVERY_WORKFLOW.ps1"

BACKEND_URL = "http://localhost:8000/admin/login/"
FRONTEND_URL = "http://localhost:3000/"

RUNTIME_DIR = ROOT / ".delivery-runtime"
BACKEND_LOG = RUNTIME_DIR / "backend.log"
FRONTEND_LOG = RUNTIME_DIR / "frontend.log"

CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
CREATE_NEW_CONSOLE = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)


class StatusWindow:
    def __init__(self) -> None:
        self.root = Tk()
        self.root.title("Konnaxion Delivery Workflow")
        self.root.geometry("620x150")
        self.root.resizable(False, False)
        self.label = Label(
            self.root,
            text="Initialisation...",
            justify="left",
            anchor="w",
            padx=20,
            pady=20,
            font=("Segoe UI", 11),
        )
        self.label.pack(fill="both", expand=True)
        self.root.update()

    def set(self, text: str) -> None:
        self.label.configure(text=text)
        self.root.update()

    def close(self) -> None:
        try:
            self.root.destroy()
        except Exception:
            pass


def show_error(title: str, message: str, window: StatusWindow | None = None) -> None:
    if window is not None:
        window.close()
    root = Tk()
    root.withdraw()
    try:
        messagebox.showerror(title, message)
    finally:
        root.destroy()


def http_ready(url: str) -> bool:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Konnaxion-Delivery-Launcher/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=2) as response:
            return response.status < 500
    except urllib.error.HTTPError as exc:
        # 4xx still proves that the HTTP server is alive.
        return exc.code < 500
    except Exception:
        return False


def tail(path: Path, max_chars: int = 5000) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        return text[-max_chars:]
    except Exception:
        return "(aucun log disponible)"


def find_powershell() -> str | None:
    candidates = [
        Path(r"C:\Program Files\PowerShell\7\pwsh.exe"),
        Path(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    for name in ("pwsh.exe", "powershell.exe"):
        found = shutil.which(name)
        if found:
            return found

    return None


def find_pnpm() -> str | None:
    for name in ("pnpm.cmd", "pnpm.exe", "pnpm"):
        found = shutil.which(name)
        if found:
            return found
    return None


def start_backend() -> subprocess.Popen:
    python_exe = BACKEND / ".venv" / "Scripts" / "python.exe"
    if not python_exe.exists():
        raise RuntimeError(
            "Environnement Python backend introuvable :\n"
            f"{python_exe}\n\n"
            "Lance une fois RUN_backend_local.bat pour créer l'environnement."
        )

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    log = open(BACKEND_LOG, "w", encoding="utf-8", buffering=1)
    try:
        process = subprocess.Popen(
            [
                str(python_exe),
                "manage.py",
                "runserver",
                "127.0.0.1:8000",
            ],
            cwd=str(BACKEND),
            env=env,
            stdout=log,
            stderr=subprocess.STDOUT,
            creationflags=CREATE_NO_WINDOW,
        )
    finally:
        log.close()

    return process


def start_frontend() -> subprocess.Popen:
    pnpm = find_pnpm()
    if not pnpm:
        raise RuntimeError(
            "pnpm est introuvable dans PATH.\n"
            "Le launcher ne peut pas démarrer Next.js."
        )

    env = os.environ.copy()
    env["API_PROXY_BASE"] = "http://localhost:8000/api"
    env["INTERNAL_API_BASE"] = "http://localhost:8000/api"

    log = open(FRONTEND_LOG, "w", encoding="utf-8", buffering=1)
    try:
        process = subprocess.Popen(
            [pnpm, "dev"],
            cwd=str(FRONTEND),
            env=env,
            stdout=log,
            stderr=subprocess.STDOUT,
            creationflags=CREATE_NO_WINDOW,
        )
    finally:
        log.close()

    return process


def wait_for_service(
    *,
    name: str,
    url: str,
    process: subprocess.Popen | None,
    log_path: Path,
    window: StatusWindow,
    attempts: int,
) -> None:
    for attempt in range(1, attempts + 1):
        if http_ready(url):
            window.set(
                f"{name}: prêt\n{url}\n\n"
                "Préparation de l'étape suivante..."
            )
            return

        if process is not None and process.poll() is not None:
            raise RuntimeError(
                f"{name} s'est arrêté avant d'être prêt.\n\n"
                f"Log:\n{tail(log_path)}"
            )

        window.set(
            f"{name}: démarrage en cours...\n{url}\n\n"
            f"Vérification {attempt}/{attempts}"
        )
        time.sleep(1)

    raise RuntimeError(
        f"{name} ne répond pas à {url}.\n\n"
        f"Log:\n{tail(log_path)}"
    )


def launch_workflow_console(powershell: str) -> None:
    # The installed workflow script calls `exit`, so invoke it in a CHILD
    # PowerShell. The outer PowerShell remains open and displays the exit code.
    child = (
        "& "
        + subprocess.list2cmdline(
            [
                powershell,
                "-NoLogo",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(WORKFLOW_PS1),
                "-Headed",
            ]
        )
        + "; "
        + "$code=$LASTEXITCODE; "
        + "Write-Host ''; "
        + "Write-Host ('DELIVERY WORKFLOW EXIT=' + $code) "
        + "-ForegroundColor $(if ($code -eq 0) {'Green'} else {'Red'}); "
        + "Write-Host 'La console reste ouverte. Fermez-la quand vous avez terminé.';"
    )

    subprocess.Popen(
        [
            powershell,
            "-NoLogo",
            "-NoProfile",
            "-NoExit",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            child,
        ],
        cwd=str(ROOT),
        creationflags=CREATE_NEW_CONSOLE,
    )


def main() -> int:
    window = StatusWindow()

    try:
        RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

        if not ROOT.exists():
            raise RuntimeError(f"Racine Konnaxion introuvable :\n{ROOT}")
        if not BACKEND.exists():
            raise RuntimeError(f"Backend introuvable :\n{BACKEND}")
        if not FRONTEND.exists():
            raise RuntimeError(f"Frontend introuvable :\n{FRONTEND}")
        if not WORKFLOW_PS1.exists():
            raise RuntimeError(
                "Workflow PowerShell introuvable :\n"
                f"{WORKFLOW_PS1}"
            )

        powershell = find_powershell()
        if not powershell:
            raise RuntimeError("PowerShell 7 / Windows PowerShell introuvable.")

        backend_process: subprocess.Popen | None = None
        frontend_process: subprocess.Popen | None = None

        if http_ready(BACKEND_URL):
            window.set(
                "Django backend: déjà prêt\n"
                f"{BACKEND_URL}\n\n"
                "Vérification du frontend..."
            )
        else:
            window.set(
                "Django backend: démarrage automatique\n"
                "http://localhost:8000\n\n"
                f"Log: {BACKEND_LOG}"
            )
            backend_process = start_backend()
            wait_for_service(
                name="Django backend",
                url=BACKEND_URL,
                process=backend_process,
                log_path=BACKEND_LOG,
                window=window,
                attempts=60,
            )

        if http_ready(FRONTEND_URL):
            window.set(
                "Next.js frontend: déjà prêt\n"
                f"{FRONTEND_URL}\n\n"
                "Lancement du workflow Playwright..."
            )
        else:
            window.set(
                "Next.js frontend: démarrage automatique\n"
                "http://localhost:3000\n\n"
                f"Log: {FRONTEND_LOG}"
            )
            frontend_process = start_frontend()
            wait_for_service(
                name="Next.js frontend",
                url=FRONTEND_URL,
                process=frontend_process,
                log_path=FRONTEND_LOG,
                window=window,
                attempts=120,
            )

        window.set(
            "Backend: prêt\n"
            "Frontend: prêt\n\n"
            "Ouverture de Playwright headed..."
        )
        time.sleep(0.5)

        launch_workflow_console(powershell)
        window.close()
        return 0

    except Exception as exc:
        show_error(
            "Konnaxion Delivery Workflow",
            str(exc),
            window,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
