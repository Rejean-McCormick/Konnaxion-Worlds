from __future__ import annotations

import os
import queue
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, ttk

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
BACKEND_URL = "http://127.0.0.1:8001/admin/login/"
HARVEST_FRONTEND_URL = "http://127.0.0.1:3001/"
CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)


class HarvestApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("Konnaxion — Targeted Bug Harvest")
        self.root.geometry("1080x720")
        self.root.minsize(900, 600)

        self.run_backend = tk.BooleanVar(value=False)
        self.run_frontend = tk.BooleanVar(value=True)
        self.status = tk.StringVar(value="Prêt — ciblé, aucun full suite.")
        self.log_dir_var = tk.StringVar(value="Logs : pas encore de run")

        self.stop_event = threading.Event()
        self.worker: threading.Thread | None = None
        self.current_process: subprocess.Popen | None = None
        self.managed: dict[str, tuple[subprocess.Popen, object]] = {}
        self.messages: queue.Queue[str] = queue.Queue()
        self.run_dir: Path | None = None

        self._build()
        self.root.after(100, self._drain)
        self.root.protocol("WM_DELETE_WINDOW", self._close)

    def _build(self) -> None:
        frame = ttk.Frame(self.root, padding=12)
        frame.pack(fill="both", expand=True)

        ttk.Label(
            frame,
            text="Konnaxion — Targeted Bug Harvest",
            font=("Segoe UI", 16, "bold"),
        ).pack(anchor="w")
        ttk.Label(
            frame,
            text=(
                "Rapide : nouveaux contrats KonnectED/TeamBuilder + parcours UI ciblés. "
                "Pas de pytest complet, pas de build, pas de 124-route smoke, pas de LevelUp full."
            ),
        ).pack(anchor="w", pady=(2, 10))

        opts = ttk.LabelFrame(frame, text="Tests", padding=8)
        opts.pack(fill="x")
        ttk.Checkbutton(
            opts,
            text="Backend ciblé — KonnectED API + TeamBuilder Problems",
            variable=self.run_backend,
        ).pack(anchor="w")
        ttk.Checkbutton(
            opts,
            text="Playwright ciblé — TeamBuilder + KonnectED (Next isolé sur :3001)",
            variable=self.run_frontend,
        ).pack(anchor="w")

        controls = ttk.Frame(frame)
        controls.pack(fill="x", pady=10)
        self.run_button = ttk.Button(controls, text="RUN BUG HARVEST", command=self.start)
        self.run_button.pack(side="left")
        self.stop_button = ttk.Button(controls, text="STOP", command=self.stop, state="disabled")
        self.stop_button.pack(side="left", padx=8)
        ttk.Button(controls, text="Ouvrir logs", command=self.open_logs).pack(side="right")

        ttk.Label(frame, textvariable=self.status, font=("Segoe UI", 10, "bold")).pack(anchor="w")
        ttk.Label(frame, textvariable=self.log_dir_var, font=("Consolas", 9)).pack(anchor="w", pady=(2, 8))

        self.progress = ttk.Progressbar(frame, mode="determinate", maximum=100)
        self.progress.pack(fill="x", pady=(0, 8))

        log_box = ttk.LabelFrame(frame, text="Live log", padding=5)
        log_box.pack(fill="both", expand=True)
        self.text = tk.Text(
            log_box,
            wrap="none",
            background="#111111",
            foreground="#eeeeee",
            insertbackground="#ffffff",
            font=("Consolas", 9),
        )
        self.text.pack(side="left", fill="both", expand=True)
        scrollbar = ttk.Scrollbar(log_box, orient="vertical", command=self.text.yview)
        scrollbar.pack(side="right", fill="y")
        self.text.configure(yscrollcommand=scrollbar.set)

    def emit(self, message: str) -> None:
        stamp = datetime.now().strftime("%H:%M:%S")
        line = f"[{stamp}] {message}\n"
        self.messages.put(line)
        if self.run_dir:
            try:
                with (self.run_dir / "harvest.log").open("a", encoding="utf-8") as f:
                    f.write(line)
            except OSError:
                pass

    def _drain(self) -> None:
        try:
            while True:
                line = self.messages.get_nowait()
                self.text.insert("end", line)
                self.text.see("end")
        except queue.Empty:
            pass
        self.root.after(100, self._drain)

    def start(self) -> None:
        if self.worker and self.worker.is_alive():
            return
        if not self.run_backend.get() and not self.run_frontend.get():
            messagebox.showinfo("Bug Harvest", "Sélectionne au moins un test.")
            return
        if not BACKEND.exists() or not FRONTEND.exists():
            messagebox.showerror("Bug Harvest", f"Repo invalide : {ROOT}")
            return

        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = ROOT / ".bug-harvest-runs" / stamp
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir_var.set(f"Logs : {self.run_dir}")
        self.text.delete("1.0", "end")
        self.progress["value"] = 0
        self.stop_event.clear()
        self.run_button.configure(state="disabled")
        self.stop_button.configure(state="normal")
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()

    def stop(self) -> None:
        self.stop_event.set()
        self.emit("STOP demandé.")
        if self.current_process and self.current_process.poll() is None:
            self._kill_tree(self.current_process)

    def _worker(self) -> None:
        selected = int(self.run_backend.get()) + int(self.run_frontend.get())
        completed = 0
        results: list[tuple[str, str, int | None]] = []
        self.emit("=== TARGETED BUG HARVEST ===")
        self.emit(f"Repo: {ROOT}")

        try:
            if self.run_backend.get() and not self.stop_event.is_set():
                self._set_status("Backend ciblé...")
                python = BACKEND / ".venv" / "Scripts" / "python.exe"
                if not python.exists():
                    raise RuntimeError(f"Python backend introuvable: {python}")
                code = self._run(
                    "backend-targeted",
                    [
                        str(python),
                        "-m",
                        "pytest",
                        r"konnaxion\konnected\test_api_surface.py",
                        r"konnaxion\teambuilder\tests\test_problems_api.py",
                        "--create-db",
                        "-q",
                    ],
                    BACKEND,
                    timeout=240,
                )
                results.append(("backend-targeted", "PASS" if code == 0 else "FAIL", code))
                completed += 1
                self._progress(completed, selected)

            if self.run_frontend.get() and not self.stop_event.is_set():
                self._set_status("Préparation runtime ciblé...")
                self._ensure_backend()
                self._start_isolated_frontend()
                self._wait_http(HARVEST_FRONTEND_URL, "Next harvest :3001", 120)

                self._set_status("Playwright ciblé...")
                pnpm = self._find_pnpm()
                env = {
                    "CI": "1",
                    "PLAYWRIGHT_AUTH_STATE": "storageState.harvest.json",
                    "SMOKE_BASE_URL": "http://127.0.0.1:3001",
                    "BACKEND_BASE_URL": "http://127.0.0.1:8001",
                    "API_PROXY_BASE": "http://127.0.0.1:8001/api",
                    "INTERNAL_API_BASE": "http://127.0.0.1:8001/api",
                    "ETHIKOS_TEST_USERNAME": "ethikos_seed_user",
                    "ETHIKOS_TEST_EMAIL": "ethikos-seed-user@example.com",
                    "ETHIKOS_TEST_PASSWORD": "test-password",
                    "HARVEST_ROUTE_PREWARM_TIMEOUT_MS": "120000",
                }
                code = self._run(
                    "frontend-harvest",
                    self._cmd_for_executable(
                        pnpm,
                        [
                            "exec",
                            "playwright",
                            "test",
                            "-c",
                            "playwright.harvest.config.ts",
                            "--project=platform-harvest",
                        ],
                    ),
                    FRONTEND,
                    timeout=420,
                    extra_env=env,
                )
                results.append(("frontend-harvest", "PASS" if code == 0 else "FAIL", code))
                completed += 1
                self._progress(completed, selected)

        except Exception as exc:
            self.emit(f"FATAL: {type(exc).__name__}: {exc}")
            results.append(("runner", "FAIL", None))
        finally:
            self._stop_managed()
            self._write_summary(results)
            failed = [r for r in results if r[1] != "PASS"]
            if self.stop_event.is_set():
                self._set_status("Arrêté.")
            elif failed:
                self._set_status(f"Terminé — {len(failed)} bloc(s) FAIL. Voir logs.")
            else:
                self._set_status("Terminé — TARGETED BUG HARVEST PASS.")
            self.root.after(0, lambda: self.run_button.configure(state="normal"))
            self.root.after(0, lambda: self.stop_button.configure(state="disabled"))

    def _run(
        self,
        name: str,
        command: list[str],
        cwd: Path,
        timeout: int,
        extra_env: dict[str, str] | None = None,
    ) -> int:
        assert self.run_dir is not None
        log_path = self.run_dir / f"{name}.log"
        env = os.environ.copy()
        env.update(extra_env or {})
        env["PYTHONUNBUFFERED"] = "1"
        env["FORCE_COLOR"] = "0"
        self.emit(f"RUN {name}: {subprocess.list2cmdline(command)}")

        proc = subprocess.Popen(
            command,
            cwd=str(cwd),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            creationflags=CREATE_NEW_PROCESS_GROUP,
        )
        self.current_process = proc
        q: queue.Queue[str | None] = queue.Queue()

        def reader() -> None:
            assert proc.stdout is not None
            for line in proc.stdout:
                q.put(line)
            q.put(None)

        threading.Thread(target=reader, daemon=True).start()
        started = time.monotonic()
        stream_done = False

        with log_path.open("w", encoding="utf-8", errors="replace") as log:
            while True:
                try:
                    line = q.get(timeout=0.2)
                    if line is None:
                        stream_done = True
                    else:
                        log.write(line)
                        log.flush()
                        self.emit(f"[{name}] {line.rstrip()}")
                except queue.Empty:
                    pass

                if self.stop_event.is_set() and proc.poll() is None:
                    self._kill_tree(proc)

                if time.monotonic() - started > timeout and proc.poll() is None:
                    self.emit(f"TIMEOUT {name} après {timeout}s — kill process tree.")
                    self._kill_tree(proc)

                if proc.poll() is not None and stream_done:
                    break

        code = proc.wait()
        self.current_process = None
        self.emit(f"RESULT {name}: exit={code}")
        return code

    def _ensure_backend(self) -> None:
        # Use an isolated backend on :8001 so the harvest run cannot accidentally
        # exercise a stale/reloader state from the developer's normal :8000 server.
        if self._http_ready(BACKEND_URL):
            raise RuntimeError(
                "Le port 8001 est déjà utilisé. Ferme ce process puis relance le harvest."
            )

        python = BACKEND / ".venv" / "Scripts" / "python.exe"
        if not python.exists():
            raise RuntimeError(f"Python backend introuvable: {python}")
        assert self.run_dir is not None
        handle = (self.run_dir / "runtime-backend-8001.log").open("w", encoding="utf-8")
        proc = subprocess.Popen(
            [str(python), "manage.py", "runserver", "127.0.0.1:8001", "--noreload"],
            cwd=str(BACKEND),
            stdout=handle,
            stderr=subprocess.STDOUT,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
            creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
        )
        self.managed["backend-8001"] = (proc, handle)
        self._wait_http(BACKEND_URL, "Django harvest :8001", 75, proc)

    def _start_isolated_frontend(self) -> None:
        # Always use a fresh dev server on :3001 so the harvest tests execute the
        # just-overlaid source instead of a stale production .next build on :3000.
        if self._http_ready(HARVEST_FRONTEND_URL):
            raise RuntimeError(
                "Le port 3001 est déjà utilisé. Ferme ce process puis relance le harvest."
            )
        assert self.run_dir is not None
        pnpm = self._find_pnpm()
        command = self._cmd_for_executable(
            pnpm, ["exec", "next", "dev", "--turbopack", "-H", "127.0.0.1", "-p", "3001"]
        )
        env = os.environ.copy()
        env.update(
            {
                "API_PROXY_BASE": "http://127.0.0.1:8001/api",
                "INTERNAL_API_BASE": "http://127.0.0.1:8001/api",
            }
        )
        handle = (self.run_dir / "runtime-frontend-3001.log").open(
            "w", encoding="utf-8", errors="replace"
        )
        proc = subprocess.Popen(
            command,
            cwd=str(FRONTEND),
            stdout=handle,
            stderr=subprocess.STDOUT,
            env=env,
            creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
        )
        self.managed["frontend-3001"] = (proc, handle)

    def _wait_http(
        self,
        url: str,
        label: str,
        timeout: int,
        process: subprocess.Popen | None = None,
    ) -> None:
        started = time.monotonic()
        while time.monotonic() - started < timeout:
            if self.stop_event.is_set():
                raise RuntimeError("Arrêt demandé.")
            if self._http_ready(url):
                self.emit(f"{label} READY")
                return
            if process is not None and process.poll() is not None:
                raise RuntimeError(f"{label} arrêté prématurément, exit={process.returncode}")
            time.sleep(0.75)
        raise RuntimeError(f"Timeout readiness {label} après {timeout}s")

    @staticmethod
    def _http_ready(url: str) -> bool:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Konnaxion-Harvest/1"})
            with urllib.request.urlopen(req, timeout=2) as response:
                return response.status < 500
        except urllib.error.HTTPError as exc:
            return exc.code < 500
        except Exception:
            return False

    @staticmethod
    def _find_pnpm() -> str:
        for candidate in (
            r"C:\Program Files\Volta\pnpm.exe",
            r"C:\Program Files\Volta\pnpm.cmd",
        ):
            if Path(candidate).exists():
                return candidate
        found = shutil.which("pnpm.exe") or shutil.which("pnpm.cmd") or shutil.which("pnpm")
        if not found:
            raise RuntimeError("pnpm introuvable.")
        return found

    @staticmethod
    def _cmd_for_executable(executable: str, args: list[str]) -> list[str]:
        if executable.lower().endswith((".cmd", ".bat")):
            return ["cmd.exe", "/d", "/s", "/c", subprocess.list2cmdline([executable, *args])]
        return [executable, *args]

    @staticmethod
    def _kill_tree(proc: subprocess.Popen) -> None:
        if proc.poll() is not None:
            return
        try:
            subprocess.run(
                ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=15,
                creationflags=CREATE_NO_WINDOW,
            )
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass

    def _stop_managed(self) -> None:
        for name, (proc, handle) in list(self.managed.items()):
            if proc.poll() is None:
                self.emit(f"Stop managed {name}...")
                self._kill_tree(proc)
            try:
                handle.close()
            except Exception:
                pass
        self.managed.clear()

    def _write_summary(self, results: list[tuple[str, str, int | None]]) -> None:
        if not self.run_dir:
            return
        lines = ["KONNAXION TARGETED BUG HARVEST", "=" * 60]
        for name, status, code in results:
            lines.append(f"[{status}] {name} exit={code}")
        (self.run_dir / "SUMMARY.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
        self.emit(f"Summary: {self.run_dir / 'SUMMARY.txt'}")

    def _progress(self, completed: int, total: int) -> None:
        value = 100 if total <= 0 else completed * 100 / total
        self.root.after(0, lambda: self.progress.configure(value=value))

    def _set_status(self, text: str) -> None:
        self.root.after(0, lambda: self.status.set(text))

    def open_logs(self) -> None:
        if self.run_dir and self.run_dir.exists():
            os.startfile(str(self.run_dir))
        else:
            messagebox.showinfo("Bug Harvest", "Aucun dossier de logs pour le moment.")

    def _close(self) -> None:
        if self.worker and self.worker.is_alive():
            if not messagebox.askyesno("Bug Harvest", "Un run est actif. Arrêter et fermer ?"):
                return
            self.stop_event.set()
            if self.current_process and self.current_process.poll() is None:
                self._kill_tree(self.current_process)
            self._stop_managed()
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    HarvestApp().run()
