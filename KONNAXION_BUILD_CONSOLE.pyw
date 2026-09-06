# -*- coding: utf-8 -*-
r"""
KONNAXION_BUILD_CONSOLE.pyw

GUI Windows pour builder et lancer le frontend Konnaxion.

Par défaut:
- frontend: C:\mycode\Konnaxion\Konnaxion\frontend
- API locale: http://localhost:8000/api
- NODE_OPTIONS=--max-old-space-size=4096
- NEXT_TELEMETRY_DISABLED=1

Le programme ne modifie pas les sources.
Il peut supprimer .next lorsque l'option "Nettoyer .next" est cochée.
"""

from __future__ import annotations

import os
import queue
import shutil
import subprocess
import threading
import time
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

DEFAULT_FRONTEND = Path(r"C:\mycode\Konnaxion\Konnaxion\frontend")
DEFAULT_API = "http://localhost:8000/api"
DEFAULT_URL = "http://localhost:3000"


class BuildConsole(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Konnaxion Build Console")
        self.geometry("980x730")
        self.minsize(840, 620)

        self.frontend_var = tk.StringVar(value=str(DEFAULT_FRONTEND))
        self.api_var = tk.StringVar(value=DEFAULT_API)

        self.clean_var = tk.BooleanVar(value=True)
        self.install_var = tk.BooleanVar(value=False)
        self.typecheck_var = tk.BooleanVar(value=True)

        self.status_var = tk.StringVar(value="Prêt")
        self.proc: subprocess.Popen | None = None
        self.server_proc: subprocess.Popen | None = None
        self.q: queue.Queue = queue.Queue()

        self._build_ui()
        self.after(100, self._drain_queue)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    # ------------------------------------------------------------------
    # UI
    # ------------------------------------------------------------------

    def _build_ui(self):
        ttk.Label(
            self,
            text="Konnaxion Build Console",
            font=("Segoe UI", 16, "bold"),
        ).pack(anchor="w", padx=14, pady=(14, 4))

        ttk.Label(
            self,
            text=(
                "Build production local du frontend Next.js. "
                "Le proxy API local est explicitement injecté dans l'environnement du build."
            ),
            wraplength=930,
        ).pack(anchor="w", padx=14, pady=(0, 10))

        root_box = ttk.LabelFrame(self, text="Frontend")
        root_box.pack(fill="x", padx=12, pady=5)

        ttk.Entry(root_box, textvariable=self.frontend_var).pack(
            side="left", fill="x", expand=True, padx=8, pady=8
        )
        ttk.Button(root_box, text="Choisir...", command=self._choose_frontend).pack(
            side="right", padx=8, pady=8
        )

        api_box = ttk.LabelFrame(self, text="Backend API utilisé par le build")
        api_box.pack(fill="x", padx=12, pady=5)

        ttk.Entry(api_box, textvariable=self.api_var).pack(
            side="left", fill="x", expand=True, padx=8, pady=8
        )
        ttk.Button(
            api_box,
            text="Localhost",
            command=lambda: self.api_var.set(DEFAULT_API),
        ).pack(side="right", padx=8, pady=8)

        opts = ttk.LabelFrame(self, text="Étapes")
        opts.pack(fill="x", padx=12, pady=5)

        ttk.Checkbutton(
            opts,
            text="Nettoyer .next avant build",
            variable=self.clean_var,
        ).pack(side="left", padx=10, pady=8)

        ttk.Checkbutton(
            opts,
            text="pnpm install --frozen-lockfile",
            variable=self.install_var,
        ).pack(side="left", padx=10, pady=8)

        ttk.Checkbutton(
            opts,
            text="TypeScript: tsc --noEmit",
            variable=self.typecheck_var,
        ).pack(side="left", padx=10, pady=8)

        buttons = ttk.Frame(self)
        buttons.pack(fill="x", padx=12, pady=(8, 5))

        self.build_btn = ttk.Button(
            buttons,
            text="BUILD LOCAL",
            command=lambda: self._start_build(start_after=False),
        )
        self.build_btn.pack(side="left")

        self.build_start_btn = ttk.Button(
            buttons,
            text="BUILD + START",
            command=lambda: self._start_build(start_after=True),
        )
        self.build_start_btn.pack(side="left", padx=(8, 0))

        self.start_btn = ttk.Button(
            buttons,
            text="START SEULEMENT",
            command=self._start_server,
        )
        self.start_btn.pack(side="left", padx=(8, 0))

        self.stop_btn = ttk.Button(
            buttons,
            text="STOP",
            command=self._stop_processes,
        )
        self.stop_btn.pack(side="left", padx=(8, 0))

        ttk.Button(
            buttons,
            text="OUVRIR http://localhost:3000",
            command=lambda: webbrowser.open(DEFAULT_URL),
        ).pack(side="left", padx=(16, 0))

        self.progress = ttk.Progressbar(self, mode="indeterminate")
        self.progress.pack(fill="x", padx=12, pady=(6, 3))

        ttk.Label(
            self,
            textvariable=self.status_var,
            font=("Segoe UI", 10, "bold"),
        ).pack(anchor="w", padx=14, pady=(0, 6))

        log_box = ttk.LabelFrame(self, text="Journal")
        log_box.pack(fill="both", expand=True, padx=12, pady=(0, 12))

        self.log = tk.Text(log_box, wrap="none", font=("Consolas", 10))
        self.log.pack(side="left", fill="both", expand=True)

        sb_y = ttk.Scrollbar(log_box, orient="vertical", command=self.log.yview)
        sb_y.pack(side="right", fill="y")
        self.log.configure(yscrollcommand=sb_y.set)

        self._log("Prêt.")
        self._log(f"Frontend : {DEFAULT_FRONTEND}")
        self._log(f"API locale : {DEFAULT_API}")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _log(self, text=""):
        self.log.insert("end", text + "\n")
        self.log.see("end")

    def _post(self, kind, payload=None):
        self.q.put((kind, payload))

    def _drain_queue(self):
        try:
            while True:
                kind, payload = self.q.get_nowait()

                if kind == "log":
                    self._log(str(payload))
                elif kind == "status":
                    self.status_var.set(str(payload))
                elif kind == "busy":
                    self._set_busy(bool(payload))
                elif kind == "build_ok":
                    self._build_finished(True, bool(payload))
                elif kind == "build_fail":
                    self._build_finished(False, False)
                elif kind == "server_stopped":
                    self.server_proc = None
                    self.status_var.set("Serveur arrêté")
        except queue.Empty:
            pass

        self.after(100, self._drain_queue)

    def _set_busy(self, busy: bool):
        state = "disabled" if busy else "normal"
        self.build_btn.configure(state=state)
        self.build_start_btn.configure(state=state)
        if busy:
            self.progress.start(10)
        else:
            self.progress.stop()

    def _choose_frontend(self):
        chosen = filedialog.askdirectory(
            title="Choisir le dossier frontend Konnaxion",
            initialdir=self.frontend_var.get(),
        )
        if chosen:
            self.frontend_var.set(chosen)

    def _frontend(self) -> Path | None:
        path = Path(self.frontend_var.get().strip())

        if not path.exists() or not path.is_dir():
            messagebox.showerror("Frontend invalide", f"Dossier introuvable :\n{path}")
            return None

        if not (path / "package.json").exists():
            messagebox.showerror(
                "Frontend invalide",
                f"package.json introuvable dans :\n{path}",
            )
            return None

        return path.resolve()

    def _find_pnpm(self) -> str | None:
        candidates = [
            shutil.which("pnpm"),
            shutil.which("pnpm.cmd"),
            r"C:\Program Files\Volta\pnpm.cmd",
            str(Path.home() / "AppData" / "Local" / "pnpm" / "pnpm.cmd"),
            str(Path.home() / "AppData" / "Roaming" / "npm" / "pnpm.cmd"),
        ]

        for candidate in candidates:
            if candidate and Path(candidate).exists():
                return str(candidate)

        return None

    def _env(self):
        env = os.environ.copy()

        api = self.api_var.get().strip().rstrip("/")
        if not api:
            api = DEFAULT_API

        env["API_PROXY_BASE"] = api
        env["INTERNAL_API_BASE"] = api
        env["NODE_OPTIONS"] = "--max-old-space-size=4096"
        env["NEXT_TELEMETRY_DISABLED"] = "1"

        return env

    def _run_command(self, args, cwd: Path, env, title: str) -> bool:
        self._post("status", title)
        self._post("log", "")
        self._post("log", "=" * 76)
        self._post("log", title)
        self._post("log", "> " + subprocess.list2cmdline([str(x) for x in args]))
        self._post("log", "=" * 76)

        creationflags = 0
        if os.name == "nt":
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

        try:
            self.proc = subprocess.Popen(
                args,
                cwd=str(cwd),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                creationflags=creationflags,
            )

            assert self.proc.stdout is not None

            for line in self.proc.stdout:
                self._post("log", line.rstrip())

            code = self.proc.wait()
            self.proc = None

            self._post("log", f"[code sortie : {code}]")
            return code == 0

        except Exception as exc:
            self.proc = None
            self._post("log", f"ERREUR : {type(exc).__name__}: {exc}")
            return False

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def _start_build(self, start_after: bool):
        frontend = self._frontend()
        if frontend is None:
            return

        pnpm = self._find_pnpm()
        if not pnpm:
            messagebox.showerror(
                "pnpm introuvable",
                "pnpm n'a pas été trouvé dans PATH, Volta ou les emplacements Windows usuels.",
            )
            return

        self.log.delete("1.0", "end")
        self._set_busy(True)

        thread = threading.Thread(
            target=self._build_worker,
            args=(frontend, pnpm, start_after),
            daemon=True,
        )
        thread.start()

    def _build_worker(self, frontend: Path, pnpm: str, start_after: bool):
        env = self._env()

        self._post("log", "KONNAXION BUILD LOCAL")
        self._post("log", f"Frontend       : {frontend}")
        self._post("log", f"pnpm           : {pnpm}")
        self._post("log", f"API_PROXY_BASE : {env['API_PROXY_BASE']}")
        self._post("log", f"NODE_OPTIONS   : {env['NODE_OPTIONS']}")
        self._post("log", "")

        # 1. Clean
        if self.clean_var.get():
            self._post("status", "Nettoyage .next")
            next_dir = frontend / ".next"

            if next_dir.exists():
                try:
                    shutil.rmtree(next_dir)
                    self._post("log", f"[OK] .next supprimé : {next_dir}")
                except Exception as exc:
                    self._post("log", f"[FAIL] Impossible de supprimer .next : {exc}")
                    self._post("build_fail")
                    return
            else:
                self._post("log", "[OK] .next absent, rien à nettoyer.")

        # 2. Install
        if self.install_var.get():
            if not self._run_command(
                [pnpm, "install", "--frozen-lockfile"],
                frontend,
                env,
                "pnpm install --frozen-lockfile",
            ):
                self._post("build_fail")
                return

        # 3. Typecheck
        if self.typecheck_var.get():
            if not self._run_command(
                [pnpm, "exec", "tsc", "--noEmit", "--pretty", "false"],
                frontend,
                env,
                "TypeScript typecheck",
            ):
                self._post("build_fail")
                return

        # 4. Build
        if not self._run_command(
            [pnpm, "build"],
            frontend,
            env,
            "Next.js production build",
        ):
            self._post("build_fail")
            return

        build_id = frontend / ".next" / "BUILD_ID"

        if build_id.exists():
            try:
                build_value = build_id.read_text(encoding="utf-8", errors="replace").strip()
            except Exception:
                build_value = "(présent)"

            self._post("log", "")
            self._post("log", f"[PASS] .next/BUILD_ID : {build_value}")
        else:
            self._post("log", "")
            self._post("log", "[WARN] Build terminé mais .next/BUILD_ID est absent.")

        self._post("build_ok", start_after)

    def _build_finished(self, ok: bool, start_after: bool):
        self._set_busy(False)

        if not ok:
            self.status_var.set("BUILD ÉCHOUÉ")
            messagebox.showerror(
                "Build échoué",
                "Le build a échoué. Consulte le journal dans la fenêtre.",
            )
            return

        self.status_var.set("BUILD PASS")

        if start_after:
            self._start_server()
        else:
            messagebox.showinfo(
                "Build terminé",
                "Build production Konnaxion terminé avec succès.",
            )

    # ------------------------------------------------------------------
    # Start / stop
    # ------------------------------------------------------------------

    def _start_server(self):
        frontend = self._frontend()
        if frontend is None:
            return

        if self.server_proc and self.server_proc.poll() is None:
            messagebox.showinfo(
                "Serveur déjà lancé",
                "Le frontend est déjà lancé par cet outil.",
            )
            return

        build_id = frontend / ".next" / "BUILD_ID"
        if not build_id.exists():
            messagebox.showerror(
                "Build absent",
                "Aucun .next/BUILD_ID trouvé.\n\nFais d'abord BUILD LOCAL.",
            )
            return

        pnpm = self._find_pnpm()
        if not pnpm:
            messagebox.showerror("pnpm introuvable", "pnpm est introuvable.")
            return

        env = self._env()

        self._log("")
        self._log("=" * 76)
        self._log("START FRONTEND PRODUCTION")
        self._log(f"API_PROXY_BASE : {env['API_PROXY_BASE']}")
        self._log(f"URL            : {DEFAULT_URL}")
        self._log("=" * 76)

        thread = threading.Thread(
            target=self._server_worker,
            args=(frontend, pnpm, env),
            daemon=True,
        )
        thread.start()

    def _server_worker(self, frontend: Path, pnpm: str, env):
        creationflags = 0
        if os.name == "nt":
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

        try:
            self.server_proc = subprocess.Popen(
                [pnpm, "start"],
                cwd=str(frontend),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                creationflags=creationflags,
            )

            self._post("status", "Frontend démarré sur http://localhost:3000")

            assert self.server_proc.stdout is not None

            opened = False

            for line in self.server_proc.stdout:
                clean = line.rstrip()
                self._post("log", clean)

                lower = clean.lower()
                if not opened and ("ready" in lower or "localhost:3000" in lower):
                    opened = True
                    try:
                        webbrowser.open(DEFAULT_URL)
                    except Exception:
                        pass

            code = self.server_proc.wait()
            self._post("log", f"[pnpm start terminé — code {code}]")
            self._post("server_stopped")

        except Exception as exc:
            self._post("log", f"ERREUR START : {type(exc).__name__}: {exc}")
            self._post("server_stopped")

    def _terminate(self, proc: subprocess.Popen | None):
        if proc is None or proc.poll() is not None:
            return

        try:
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
            else:
                proc.terminate()
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass

    def _stop_processes(self):
        self._terminate(self.proc)
        self._terminate(self.server_proc)
        self.proc = None
        self.server_proc = None
        self._set_busy(False)
        self.status_var.set("Arrêt demandé")
        self._log("[STOP] Processus lancés par le Build Console arrêtés.")

    def _on_close(self):
        running = (
            (self.proc is not None and self.proc.poll() is None)
            or (self.server_proc is not None and self.server_proc.poll() is None)
        )

        if running:
            if not messagebox.askyesno(
                "Fermer",
                "Un processus est encore actif.\n\nL'arrêter et fermer ?",
            ):
                return
            self._stop_processes()

        self.destroy()


if __name__ == "__main__":
    BuildConsole().mainloop()
