# FILE: KONNAXION_MEGA_TEST_CAMPAIGN.pyw
from __future__ import annotations

import json
import os
import queue
import shutil
import signal
import subprocess
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from tkinter import (
    BOTH,
    END,
    LEFT,
    RIGHT,
    X,
    Y,
    BooleanVar,
    Button,
    Checkbutton,
    Frame,
    Label,
    StringVar,
    Text,
    Tk,
    Toplevel,
    messagebox,
)
from tkinter import ttk
from tkinter.filedialog import askdirectory


# ---------------------------------------------------------------------------
# Canonical local paths
# ---------------------------------------------------------------------------

DEFAULT_ROOT = Path(r"C:\mycode\Konnaxion\Konnaxion")
DEFAULT_LEVELUP = Path(r"C:\mycode\Konnaxion\LevelUpDiag")

BACKEND_URL = "http://localhost:8000/admin/login/"
FRONTEND_URL = "http://localhost:3000/"

CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)


# ---------------------------------------------------------------------------
# Result model
# ---------------------------------------------------------------------------

@dataclass
class StepResult:
    key: str
    name: str
    status: str
    exit_code: int | None
    started_at: str
    ended_at: str
    duration_seconds: float
    command: str
    cwd: str
    log_file: str
    note: str = ""


# ---------------------------------------------------------------------------
# Main application
# ---------------------------------------------------------------------------

class MegaCampaignApp:
    def __init__(self) -> None:
        self.root = Tk()
        self.root.title("Konnaxion — Mega Test Campaign")
        self.root.geometry("1180x820")
        self.root.minsize(980, 680)

        self.root_path = StringVar(value=str(DEFAULT_ROOT))
        self.levelup_path = StringVar(value=str(DEFAULT_LEVELUP))

        self.run_pytest = BooleanVar(value=True)
        self.run_fullscan = BooleanVar(value=True)
        self.run_smoke = BooleanVar(value=True)
        self.run_delivery = BooleanVar(value=True)
        self.run_levelup = BooleanVar(value=True)

        self.continue_on_failure = BooleanVar(value=True)
        self.auto_runtime = BooleanVar(value=True)
        self.stop_runtime_after = BooleanVar(value=True)
        self.headed_playwright = BooleanVar(value=False)

        self.status_text = StringVar(value="Prêt.")
        self.run_dir_text = StringVar(value="Logs : pas encore de campagne")

        self.log_queue: queue.Queue[tuple[str, str]] = queue.Queue()
        self.worker: threading.Thread | None = None
        self.stop_requested = threading.Event()
        self.current_process: subprocess.Popen | None = None
        self.managed_processes: dict[str, subprocess.Popen] = {}
        self.managed_logs: dict[str, object] = {}
        self.results: list[StepResult] = []
        self.run_dir: Path | None = None
        self.summary_path: Path | None = None
        self.config: dict[str, object] = {}

        self.rows: dict[str, str] = {}
        self._build_ui()
        self.root.after(100, self._drain_log_queue)
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    # ------------------------------------------------------------------
    # UI
    # ------------------------------------------------------------------

    def _build_ui(self) -> None:
        top = Frame(self.root, padx=12, pady=10)
        top.pack(fill=X)

        Label(
            top,
            text="Konnaxion — Mega Test Campaign",
            font=("Segoe UI", 16, "bold"),
        ).pack(anchor="w")

        Label(
            top,
            text=(
                "Capture massive : pytest + full-scan + Playwright broad + "
                "delivery golden path + LevelUpDiag N00–N11"
            ),
            font=("Segoe UI", 10),
        ).pack(anchor="w", pady=(2, 8))

        paths = ttk.LabelFrame(top, text="Paths", padding=8)
        paths.pack(fill=X)

        self._path_row(paths, 0, "Konnaxion", self.root_path, self._choose_root)
        self._path_row(paths, 1, "LevelUpDiag", self.levelup_path, self._choose_levelup)

        middle = Frame(self.root, padx=12)
        middle.pack(fill=X)

        runners = ttk.LabelFrame(middle, text="Runners", padding=8)
        runners.pack(side=LEFT, fill=BOTH, expand=True, padx=(0, 6))

        Checkbutton(
            runners,
            text="1. Backend pytest complet  (--create-db)",
            variable=self.run_pytest,
        ).pack(anchor="w")
        Checkbutton(
            runners,
            text="2. Frontend full-scan  (TypeScript / ESLint / build / Jest / smoke)",
            variable=self.run_fullscan,
        ).pack(anchor="w")
        Checkbutton(
            runners,
            text="3. Playwright broad  (playwright.smoke.config.ts)",
            variable=self.run_smoke,
        ).pack(anchor="w")
        Checkbutton(
            runners,
            text="4. Playwright delivery  (ethiKos → EkoH → Smart Vote)",
            variable=self.run_delivery,
        ).pack(anchor="w")
        Checkbutton(
            runners,
            text="5. LevelUpDiag FULL  (N00 → N11)",
            variable=self.run_levelup,
        ).pack(anchor="w")

        options = ttk.LabelFrame(middle, text="Options", padding=8)
        options.pack(side=RIGHT, fill=BOTH, expand=True, padx=(6, 0))

        Checkbutton(
            options,
            text="Continuer après un FAIL",
            variable=self.continue_on_failure,
        ).pack(anchor="w")
        Checkbutton(
            options,
            text="Démarrer Django / Next automatiquement si requis",
            variable=self.auto_runtime,
        ).pack(anchor="w")
        Checkbutton(
            options,
            text="Arrêter seulement les services démarrés par ce runner",
            variable=self.stop_runtime_after,
        ).pack(anchor="w")
        Checkbutton(
            options,
            text="Playwright visible (headed)",
            variable=self.headed_playwright,
        ).pack(anchor="w")

        controls = Frame(self.root, padx=12, pady=8)
        controls.pack(fill=X)

        self.start_button = Button(
            controls,
            text="RUN MEGA CAMPAIGN",
            command=self.start_campaign,
            width=22,
            font=("Segoe UI", 10, "bold"),
        )
        self.start_button.pack(side=LEFT)

        self.stop_button = Button(
            controls,
            text="STOP",
            command=self.request_stop,
            width=12,
            state="disabled",
        )
        self.stop_button.pack(side=LEFT, padx=(8, 0))

        Button(
            controls,
            text="Ouvrir logs",
            command=self.open_logs,
            width=14,
        ).pack(side=RIGHT)

        Button(
            controls,
            text="Ouvrir résumé",
            command=self.open_summary,
            width=14,
        ).pack(side=RIGHT, padx=(0, 8))

        status_frame = Frame(self.root, padx=12)
        status_frame.pack(fill=X)

        Label(
            status_frame,
            textvariable=self.status_text,
            font=("Segoe UI", 10, "bold"),
        ).pack(anchor="w")
        Label(
            status_frame,
            textvariable=self.run_dir_text,
            font=("Consolas", 9),
        ).pack(anchor="w", pady=(2, 6))

        self.progress = ttk.Progressbar(
            status_frame,
            orient="horizontal",
            mode="determinate",
            maximum=100,
        )
        self.progress.pack(fill=X, pady=(0, 8))

        table_frame = Frame(self.root, padx=12)
        table_frame.pack(fill=X)

        columns = ("runner", "status", "duration", "exit")
        self.tree = ttk.Treeview(
            table_frame,
            columns=columns,
            show="headings",
            height=7,
        )
        self.tree.heading("runner", text="Runner")
        self.tree.heading("status", text="Status")
        self.tree.heading("duration", text="Durée")
        self.tree.heading("exit", text="Exit")
        self.tree.column("runner", width=580)
        self.tree.column("status", width=110, anchor="center")
        self.tree.column("duration", width=110, anchor="center")
        self.tree.column("exit", width=70, anchor="center")
        self.tree.pack(fill=X)

        for key, label in [
            ("pytest", "Backend pytest complet"),
            ("fullscan", "Frontend full-scan"),
            ("smoke", "Playwright broad"),
            ("delivery", "Playwright delivery"),
            ("levelup", "LevelUpDiag FULL N00–N11"),
        ]:
            item = self.tree.insert("", END, values=(label, "PENDING", "", ""))
            self.rows[key] = item

        log_frame = ttk.LabelFrame(self.root, text="Live log", padding=6)
        log_frame.pack(fill=BOTH, expand=True, padx=12, pady=(8, 12))

        self.log_text = Text(
            log_frame,
            wrap="none",
            font=("Consolas", 9),
            background="#111111",
            foreground="#e8e8e8",
            insertbackground="#ffffff",
        )
        self.log_text.pack(side=LEFT, fill=BOTH, expand=True)

        yscroll = ttk.Scrollbar(
            log_frame,
            orient="vertical",
            command=self.log_text.yview,
        )
        yscroll.pack(side=RIGHT, fill=Y)
        self.log_text.configure(yscrollcommand=yscroll.set)

    def _path_row(self, parent, row: int, label: str, variable: StringVar, command) -> None:
        Label(parent, text=label, width=12, anchor="w").grid(
            row=row, column=0, sticky="w", padx=(0, 6), pady=2
        )
        entry = ttk.Entry(parent, textvariable=variable)
        entry.grid(row=row, column=1, sticky="ew", pady=2)
        Button(parent, text="...", width=4, command=command).grid(
            row=row, column=2, padx=(6, 0), pady=2
        )
        parent.columnconfigure(1, weight=1)

    def _choose_root(self) -> None:
        chosen = askdirectory(initialdir=self.root_path.get())
        if chosen:
            self.root_path.set(chosen)

    def _choose_levelup(self) -> None:
        chosen = askdirectory(initialdir=self.levelup_path.get())
        if chosen:
            self.levelup_path.set(chosen)

    # ------------------------------------------------------------------
    # Campaign lifecycle
    # ------------------------------------------------------------------

    def start_campaign(self) -> None:
        if self.worker and self.worker.is_alive():
            return

        root = Path(self.root_path.get())
        if not (root / "backend").exists() or not (root / "frontend").exists():
            messagebox.showerror(
                "Konnaxion Mega Test Campaign",
                f"Repo Konnaxion invalide :\n{root}",
            )
            return

        if not any([
            self.run_pytest.get(),
            self.run_fullscan.get(),
            self.run_smoke.get(),
            self.run_delivery.get(),
            self.run_levelup.get(),
        ]):
            messagebox.showwarning(
                "Konnaxion Mega Test Campaign",
                "Sélectionne au moins un runner.",
            )
            return

        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = root / ".mega-test-campaign" / stamp
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self.summary_path = self.run_dir / "SUMMARY.txt"

        self.config = {
            "run_pytest": self.run_pytest.get(),
            "run_fullscan": self.run_fullscan.get(),
            "run_smoke": self.run_smoke.get(),
            "run_delivery": self.run_delivery.get(),
            "run_levelup": self.run_levelup.get(),
            "continue_on_failure": self.continue_on_failure.get(),
            "auto_runtime": self.auto_runtime.get(),
            "stop_runtime_after": self.stop_runtime_after.get(),
            "headed_playwright": self.headed_playwright.get(),
            "root": str(root),
            "levelup": self.levelup_path.get(),
        }

        self.results = []
        self.stop_requested.clear()
        self.log_text.delete("1.0", END)
        self.start_button.configure(state="disabled")
        self.stop_button.configure(state="normal")
        self.progress["value"] = 0
        self.run_dir_text.set(f"Logs : {self.run_dir}")

        for key, item in self.rows.items():
            selected = {
                "pytest": self.run_pytest.get(),
                "fullscan": self.run_fullscan.get(),
                "smoke": self.run_smoke.get(),
                "delivery": self.run_delivery.get(),
                "levelup": self.run_levelup.get(),
            }[key]
            self.tree.item(
                item,
                values=(
                    self.tree.item(item, "values")[0],
                    "PENDING" if selected else "SKIP",
                    "",
                    "",
                ),
            )

        self.worker = threading.Thread(target=self._campaign_worker, daemon=True)
        self.worker.start()

    def request_stop(self) -> None:
        if not (self.worker and self.worker.is_alive()):
            return

        self.stop_requested.set()
        self.status_text.set("Arrêt demandé...")
        self._emit("SYSTEM", "STOP demandé par l'utilisateur.")

        process = self.current_process
        if process and process.poll() is None:
            self._kill_process_tree(process)

    def _campaign_worker(self) -> None:
        root = Path(str(self.config["root"]))
        frontend = root / "frontend"
        backend = root / "backend"
        levelup = Path(str(self.config["levelup"]))

        selected = [
            ("pytest", bool(self.config["run_pytest"])),
            ("fullscan", bool(self.config["run_fullscan"])),
            ("smoke", bool(self.config["run_smoke"])),
            ("delivery", bool(self.config["run_delivery"])),
            ("levelup", bool(self.config["run_levelup"])),
        ]
        selected_count = sum(1 for _, enabled in selected if enabled)
        completed = 0

        self._emit("SYSTEM", "=" * 78)
        self._emit("SYSTEM", "KONNAXION MEGA TEST CAMPAIGN")
        self._emit("SYSTEM", f"Started : {datetime.now().isoformat(timespec='seconds')}")
        self._emit("SYSTEM", f"Repo    : {root}")
        self._emit("SYSTEM", f"LevelUp : {levelup}")
        self._emit("SYSTEM", "=" * 78)

        try:
            steps: list[tuple[str, str, list[str], Path, dict[str, str], bool]] = []

            if bool(self.config["run_pytest"]):
                python_exe = self._find_python(backend / ".venv" / "Scripts" / "python.exe")
                steps.append((
                    "pytest",
                    "Backend pytest complet",
                    [str(python_exe), "-m", "pytest", "--create-db"],
                    backend,
                    {},
                    False,
                ))

            if bool(self.config["run_fullscan"]):
                pwsh = self._find_pwsh()
                steps.append((
                    "fullscan",
                    "Frontend full-scan",
                    [
                        pwsh,
                        "-NoLogo",
                        "-NoProfile",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-File",
                        str(frontend / "tools" / "full-scan.ps1"),
                    ],
                    frontend,
                    {
                        "API_PROXY_BASE": "http://localhost:8000/api",
                        "INTERNAL_API_BASE": "http://localhost:8000/api",
                        "BACKEND_BASE_URL": "http://localhost:8000",
                        "SMOKE_BASE_URL": "http://localhost:3000",
                    },
                    True,
                ))

            if bool(self.config["run_smoke"]):
                pnpm = self._find_pnpm()
                cmd = [
                    pnpm,
                    "exec",
                    "playwright",
                    "test",
                    "-c",
                    "playwright.smoke.config.ts",
                ]
                if bool(self.config["headed_playwright"]):
                    cmd.append("--headed")
                steps.append((
                    "smoke",
                    "Playwright broad",
                    cmd,
                    frontend,
                    {
                        "CI": "1",
                        "SMOKE_GATE": "1",
                        "API_PROXY_BASE": "http://localhost:8000/api",
                        "INTERNAL_API_BASE": "http://localhost:8000/api",
                        "BACKEND_BASE_URL": "http://localhost:8000",
                        "SMOKE_BASE_URL": "http://localhost:3000",
                    },
                    True,
                ))

            if bool(self.config["run_delivery"]):
                pnpm = self._find_pnpm()
                cmd = [
                    pnpm,
                    "exec",
                    "playwright",
                    "test",
                    "-c",
                    "playwright.delivery.config.ts",
                    "--project=ethikos-delivery",
                ]
                if bool(self.config["headed_playwright"]):
                    cmd.append("--headed")
                steps.append((
                    "delivery",
                    "Playwright delivery",
                    cmd,
                    frontend,
                    {
                        "CI": "1",
                        "PLAYWRIGHT_AUTH_STATE": "storageState.mega.json",
                        "API_PROXY_BASE": "http://localhost:8000/api",
                        "INTERNAL_API_BASE": "http://localhost:8000/api",
                        "BACKEND_BASE_URL": "http://localhost:8000",
                        "SMOKE_BASE_URL": "http://localhost:3000",
                        "ETHIKOS_TEST_USERNAME": "ethikos_seed_user",
                        "ETHIKOS_TEST_EMAIL": "ethikos-seed-user@example.com",
                        "ETHIKOS_TEST_PASSWORD": "test-password",
                    },
                    True,
                ))

            if bool(self.config["run_levelup"]):
                levelup_python = self._find_python(levelup / ".venv" / "Scripts" / "python.exe")
                script = levelup / "scripts" / "run_konnaxion.py"
                steps.append((
                    "levelup",
                    "LevelUpDiag FULL N00–N11",
                    [str(levelup_python), str(script), "full"],
                    levelup,
                    {},
                    True,
                ))

            for key, name, command, cwd, extra_env, needs_runtime in steps:
                if self.stop_requested.is_set():
                    break

                if needs_runtime:
                    try:
                        self._ensure_runtime(
                            root=root,
                            frontend=frontend,
                            backend=backend,
                            need_frontend=(key != "fullscan"),
                        )
                    except Exception as exc:
                        self._emit("RUNTIME", f"Runtime preparation failed: {exc}")
                        result = self._synthetic_result(
                            key=key,
                            name=name,
                            status="FAIL",
                            note=f"Runtime preparation failed: {exc}",
                            cwd=cwd,
                            command=command,
                        )
                        self.results.append(result)
                        self._set_row(key, result)
                        completed += 1
                        self._set_progress(completed, selected_count)

                        if not bool(self.config["continue_on_failure"]):
                            break
                        continue

                result = self._run_step(
                    key=key,
                    name=name,
                    command=command,
                    cwd=cwd,
                    extra_env=extra_env,
                )
                self.results.append(result)
                self._set_row(key, result)

                completed += 1
                self._set_progress(completed, selected_count)

                if result.status == "FAIL" and not bool(self.config["continue_on_failure"]):
                    self._emit("SYSTEM", "Arrêt après FAIL (option continue désactivée).")
                    break

            if self.stop_requested.is_set():
                self._emit("SYSTEM", "Campagne arrêtée par l'utilisateur.")

        except Exception as exc:
            self._emit("SYSTEM", f"FATAL runner error: {type(exc).__name__}: {exc}")
        finally:
            if bool(self.config["stop_runtime_after"]):
                self._stop_managed_runtime()

            self._write_summary()
            self.root.after(0, self._campaign_finished)

    # ------------------------------------------------------------------
    # Step execution
    # ------------------------------------------------------------------

    def _run_step(
        self,
        *,
        key: str,
        name: str,
        command: list[str],
        cwd: Path,
        extra_env: dict[str, str],
    ) -> StepResult:
        assert self.run_dir is not None

        log_file = self.run_dir / f"{key}.log"
        started = datetime.now()
        command_text = subprocess.list2cmdline(command)

        self.root.after(0, lambda: self.status_text.set(f"RUNNING — {name}"))
        self.root.after(0, lambda: self._set_row_raw(key, "RUNNING", "", ""))
        self._emit(key.upper(), "")
        self._emit(key.upper(), "=" * 78)
        self._emit(key.upper(), name)
        self._emit(key.upper(), f"CWD : {cwd}")
        self._emit(key.upper(), f"CMD : {command_text}")
        self._emit(key.upper(), "=" * 78)

        if not cwd.exists():
            return self._synthetic_result(
                key=key,
                name=name,
                status="FAIL",
                note=f"CWD introuvable: {cwd}",
                cwd=cwd,
                command=command,
            )

        executable = Path(command[0])
        if (
            (str(executable).lower().endswith((".exe", ".cmd", ".bat", ".py")))
            and os.path.isabs(str(executable))
            and not executable.exists()
        ):
            return self._synthetic_result(
                key=key,
                name=name,
                status="FAIL",
                note=f"Executable/script introuvable: {executable}",
                cwd=cwd,
                command=command,
            )

        env = os.environ.copy()
        env.update(extra_env)
        env["PYTHONUNBUFFERED"] = "1"
        env["FORCE_COLOR"] = "0"
        env["NO_COLOR"] = "1"

        with log_file.open("w", encoding="utf-8", errors="replace", buffering=1) as log:
            log.write(f"RUNNER: {name}\n")
            log.write(f"START : {started.isoformat(timespec='seconds')}\n")
            log.write(f"CWD   : {cwd}\n")
            log.write(f"CMD   : {command_text}\n")
            log.write("=" * 78 + "\n\n")

            try:
                process = subprocess.Popen(
                    command,
                    cwd=str(cwd),
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    bufsize=1,
                    creationflags=CREATE_NEW_PROCESS_GROUP,
                )
                self.current_process = process

                assert process.stdout is not None
                for line in iter(process.stdout.readline, ""):
                    if not line:
                        break
                    log.write(line)
                    self._emit(key.upper(), line.rstrip("\r\n"))

                    if self.stop_requested.is_set():
                        self._kill_process_tree(process)
                        break

                process.stdout.close()
                exit_code = process.wait()
            except Exception as exc:
                exit_code = 9001
                message = f"Runner exception: {type(exc).__name__}: {exc}"
                log.write("\n" + message + "\n")
                self._emit(key.upper(), message)
            finally:
                self.current_process = None

        ended = datetime.now()
        duration = (ended - started).total_seconds()

        if self.stop_requested.is_set() and exit_code != 0:
            status = "STOPPED"
        else:
            status = "PASS" if exit_code == 0 else "FAIL"

        result = StepResult(
            key=key,
            name=name,
            status=status,
            exit_code=exit_code,
            started_at=started.isoformat(timespec="seconds"),
            ended_at=ended.isoformat(timespec="seconds"),
            duration_seconds=round(duration, 2),
            command=command_text,
            cwd=str(cwd),
            log_file=str(log_file),
        )

        self._emit(
            key.upper(),
            f"RESULT: {status}  exit={exit_code}  duration={self._fmt_duration(duration)}",
        )
        return result

    def _synthetic_result(
        self,
        *,
        key: str,
        name: str,
        status: str,
        note: str,
        cwd: Path,
        command: list[str],
    ) -> StepResult:
        now = datetime.now().isoformat(timespec="seconds")
        log_file = ""
        if self.run_dir:
            path = self.run_dir / f"{key}.log"
            path.write_text(note + "\n", encoding="utf-8")
            log_file = str(path)

        self._emit(key.upper(), note)
        return StepResult(
            key=key,
            name=name,
            status=status,
            exit_code=None,
            started_at=now,
            ended_at=now,
            duration_seconds=0.0,
            command=subprocess.list2cmdline(command),
            cwd=str(cwd),
            log_file=log_file,
            note=note,
        )

    # ------------------------------------------------------------------
    # Runtime management
    # ------------------------------------------------------------------

    def _ensure_runtime(
        self,
        *,
        root: Path,
        frontend: Path,
        backend: Path,
        need_frontend: bool,
    ) -> None:
        if not bool(self.config["auto_runtime"]):
            if not self._http_ready(BACKEND_URL):
                raise RuntimeError(f"Django non prêt: {BACKEND_URL}")
            if need_frontend and not self._http_ready(FRONTEND_URL):
                raise RuntimeError(f"Next.js non prêt: {FRONTEND_URL}")
            return

        if not self._http_ready(BACKEND_URL):
            self._start_backend(backend)

        self._wait_http(
            name="Django backend",
            url=BACKEND_URL,
            process=self.managed_processes.get("backend"),
            timeout_seconds=75,
        )

        if not need_frontend:
            return

        if not self._http_ready(FRONTEND_URL):
            self._start_frontend(frontend)

        self._wait_http(
            name="Next.js frontend",
            url=FRONTEND_URL,
            process=self.managed_processes.get("frontend"),
            timeout_seconds=140,
        )

    def _start_backend(self, backend: Path) -> None:
        if "backend" in self.managed_processes:
            process = self.managed_processes["backend"]
            if process.poll() is None:
                return

        python_exe = backend / ".venv" / "Scripts" / "python.exe"
        if not python_exe.exists():
            raise RuntimeError(f"Backend venv introuvable: {python_exe}")

        assert self.run_dir is not None
        log_path = self.run_dir / "runtime_backend.log"
        log_handle = log_path.open("w", encoding="utf-8", errors="replace", buffering=1)

        self._emit("RUNTIME", f"Starting Django → {BACKEND_URL}")
        process = subprocess.Popen(
            [
                str(python_exe),
                "manage.py",
                "runserver",
                "127.0.0.1:8000",
                "--noreload",
            ],
            cwd=str(backend),
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
        )
        self.managed_processes["backend"] = process
        self.managed_logs["backend"] = log_handle

    def _start_frontend(self, frontend: Path) -> None:
        if "frontend" in self.managed_processes:
            process = self.managed_processes["frontend"]
            if process.poll() is None:
                return

        pnpm = self._find_pnpm()
        env = os.environ.copy()
        env["API_PROXY_BASE"] = "http://localhost:8000/api"
        env["INTERNAL_API_BASE"] = "http://localhost:8000/api"

        # Prefer production start when a valid build exists; otherwise dev.
        if (frontend / ".next" / "BUILD_ID").exists():
            command = [pnpm, "start"]
            mode = "production"
        else:
            command = [pnpm, "dev"]
            mode = "development"

        assert self.run_dir is not None
        log_path = self.run_dir / "runtime_frontend.log"
        log_handle = log_path.open("w", encoding="utf-8", errors="replace", buffering=1)

        self._emit("RUNTIME", f"Starting Next.js ({mode}) → {FRONTEND_URL}")
        process = subprocess.Popen(
            command,
            cwd=str(frontend),
            env=env,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
        )
        self.managed_processes["frontend"] = process
        self.managed_logs["frontend"] = log_handle

    def _stop_managed_runtime(self) -> None:
        for name, process in list(self.managed_processes.items()):
            if process.poll() is None:
                self._emit("RUNTIME", f"Stopping managed {name} process tree...")
                self._kill_process_tree(process)

        self.managed_processes.clear()

        for handle in self.managed_logs.values():
            try:
                handle.close()
            except Exception:
                pass
        self.managed_logs.clear()

    def _http_ready(self, url: str) -> bool:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Konnaxion-Mega-Test-Campaign/1.0"},
        )
        try:
            with urllib.request.urlopen(request, timeout=2) as response:
                return response.status < 500
        except urllib.error.HTTPError as exc:
            return exc.code < 500
        except Exception:
            return False

    def _wait_http(
        self,
        *,
        name: str,
        url: str,
        process: subprocess.Popen | None,
        timeout_seconds: int,
    ) -> None:
        started = time.time()
        while time.time() - started < timeout_seconds:
            if self.stop_requested.is_set():
                raise RuntimeError("Arrêt demandé.")

            if self._http_ready(url):
                self._emit("RUNTIME", f"{name}: READY")
                return

            if process is not None and process.poll() is not None:
                raise RuntimeError(
                    f"{name} s'est arrêté avant readiness (exit={process.returncode})."
                )

            time.sleep(1)

        raise RuntimeError(f"{name} timeout après {timeout_seconds}s: {url}")

    # ------------------------------------------------------------------
    # Executable discovery
    # ------------------------------------------------------------------

    def _find_python(self, preferred: Path) -> Path:
        if preferred.exists():
            return preferred

        found = shutil.which("python.exe") or shutil.which("python")
        if found:
            return Path(found)

        raise RuntimeError("Python introuvable.")

    def _find_pwsh(self) -> str:
        candidates = [
            Path(r"C:\Program Files\PowerShell\7\pwsh.exe"),
            Path(r"C:\Program Files\PowerShell\7-preview\pwsh.exe"),
        ]
        for candidate in candidates:
            if candidate.exists():
                return str(candidate)

        found = shutil.which("pwsh.exe") or shutil.which("pwsh")
        if found:
            return found

        # Last-resort compatibility fallback.
        found = shutil.which("powershell.exe")
        if found:
            return found

        raise RuntimeError("PowerShell introuvable.")

    def _find_pnpm(self) -> str:
        candidates = [
            Path(r"C:\Program Files\Volta\pnpm.exe"),
            Path(r"C:\Program Files\Volta\pnpm.cmd"),
        ]
        for candidate in candidates:
            if candidate.exists():
                return str(candidate)

        found = shutil.which("pnpm.exe") or shutil.which("pnpm.cmd") or shutil.which("pnpm")
        if found:
            return found

        raise RuntimeError("pnpm introuvable.")

    # ------------------------------------------------------------------
    # Summary / files
    # ------------------------------------------------------------------

    def _write_summary(self) -> None:
        if not self.run_dir:
            return

        selected_status = {result.key: result.status for result in self.results}
        failed = [r for r in self.results if r.status == "FAIL"]
        stopped = [r for r in self.results if r.status == "STOPPED"]

        if stopped:
            overall = "STOPPED"
        elif failed:
            overall = "FAIL"
        elif self.results:
            overall = "PASS"
        else:
            overall = "NO_RESULTS"

        summary_json = {
            "schema": "konnaxion-mega-test-campaign/v1",
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "overall": overall,
            "repo_root": str(self.config.get("root", self.root_path.get())),
            "levelup_root": str(self.config.get("levelup", self.levelup_path.get())),
            "continue_on_failure": bool(self.config["continue_on_failure"]),
            "auto_runtime": bool(self.config["auto_runtime"]),
            "headed_playwright": bool(self.config["headed_playwright"]),
            "results": [asdict(r) for r in self.results],
        }

        json_path = self.run_dir / "SUMMARY.json"
        json_path.write_text(
            json.dumps(summary_json, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        lines = [
            "KONNAXION MEGA TEST CAMPAIGN",
            "=" * 78,
            f"Overall : {overall}",
            f"Generated: {summary_json['generated_at']}",
            f"Repo    : {summary_json['repo_root']}",
            f"LevelUp : {summary_json['levelup_root']}",
            "",
            "RESULTS",
            "-" * 78,
        ]

        for result in self.results:
            exit_text = "-" if result.exit_code is None else str(result.exit_code)
            lines.append(
                f"[{result.status:<7}] {result.name:<34} "
                f"exit={exit_text:<5} duration={self._fmt_duration(result.duration_seconds)}"
            )
            lines.append(f"          log: {result.log_file}")
            if result.note:
                lines.append(f"          note: {result.note}")

        lines += [
            "",
            "FILES",
            "-" * 78,
            f"SUMMARY.json : {json_path}",
            f"SUMMARY.txt  : {self.summary_path}",
        ]

        assert self.summary_path is not None
        self.summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        self._emit("SYSTEM", "")
        self._emit("SYSTEM", "=" * 78)
        self._emit("SYSTEM", f"MEGA CAMPAIGN OVERALL: {overall}")
        self._emit("SYSTEM", f"Summary: {self.summary_path}")
        self._emit("SYSTEM", "=" * 78)

    def open_logs(self) -> None:
        if not self.run_dir or not self.run_dir.exists():
            messagebox.showinfo(
                "Konnaxion Mega Test Campaign",
                "Aucun dossier de logs disponible.",
            )
            return
        os.startfile(str(self.run_dir))

    def open_summary(self) -> None:
        if not self.summary_path or not self.summary_path.exists():
            messagebox.showinfo(
                "Konnaxion Mega Test Campaign",
                "Aucun résumé disponible.",
            )
            return
        os.startfile(str(self.summary_path))

    # ------------------------------------------------------------------
    # Process helpers
    # ------------------------------------------------------------------

    def _kill_process_tree(self, process: subprocess.Popen) -> None:
        if process.poll() is not None:
            return

        if os.name == "nt":
            try:
                subprocess.run(
                    [
                        "taskkill",
                        "/PID",
                        str(process.pid),
                        "/T",
                        "/F",
                    ],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=CREATE_NO_WINDOW,
                    timeout=15,
                )
                return
            except Exception:
                pass

        try:
            process.terminate()
            process.wait(timeout=5)
        except Exception:
            try:
                process.kill()
            except Exception:
                pass

    # ------------------------------------------------------------------
    # UI-thread-safe output
    # ------------------------------------------------------------------

    def _emit(self, source: str, message: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_queue.put(("log", f"[{timestamp}] [{source}] {message}\n"))

        if self.run_dir:
            master = self.run_dir / "campaign.log"
            try:
                with master.open("a", encoding="utf-8", errors="replace") as fh:
                    fh.write(f"[{timestamp}] [{source}] {message}\n")
            except Exception:
                pass

    def _drain_log_queue(self) -> None:
        try:
            while True:
                kind, payload = self.log_queue.get_nowait()
                if kind == "log":
                    self.log_text.insert(END, payload)
                    self.log_text.see(END)
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self._drain_log_queue)

    def _set_row(self, key: str, result: StepResult) -> None:
        self.root.after(
            0,
            lambda: self._set_row_raw(
                key,
                result.status,
                self._fmt_duration(result.duration_seconds),
                "-" if result.exit_code is None else str(result.exit_code),
            ),
        )

    def _set_row_raw(self, key: str, status: str, duration: str, exit_code: str) -> None:
        item = self.rows[key]
        name = self.tree.item(item, "values")[0]
        self.tree.item(item, values=(name, status, duration, exit_code))

    def _set_progress(self, completed: int, total: int) -> None:
        value = 100 if total <= 0 else (completed / total) * 100
        self.root.after(0, lambda: self.progress.configure(value=value))

    def _campaign_finished(self) -> None:
        self.start_button.configure(state="normal")
        self.stop_button.configure(state="disabled")

        if self.stop_requested.is_set():
            self.status_text.set("Campagne arrêtée.")
            return

        failed = [r for r in self.results if r.status == "FAIL"]
        if failed:
            self.status_text.set(
                f"Terminé — {len(failed)} runner(s) en FAIL. Voir SUMMARY.txt."
            )
        else:
            self.status_text.set("Terminé — tous les runners sélectionnés sont PASS.")

    @staticmethod
    def _fmt_duration(seconds: float) -> str:
        seconds = int(round(seconds))
        hours, rem = divmod(seconds, 3600)
        minutes, secs = divmod(rem, 60)

        if hours:
            return f"{hours}h {minutes:02d}m {secs:02d}s"
        if minutes:
            return f"{minutes}m {secs:02d}s"
        return f"{secs}s"

    def _on_close(self) -> None:
        if self.worker and self.worker.is_alive():
            if not messagebox.askyesno(
                "Konnaxion Mega Test Campaign",
                "Une campagne est active. Arrêter les processus et fermer ?",
            ):
                return
            self.stop_requested.set()
            if self.current_process and self.current_process.poll() is None:
                self._kill_process_tree(self.current_process)
            self._stop_managed_runtime()

        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    MegaCampaignApp().run()
