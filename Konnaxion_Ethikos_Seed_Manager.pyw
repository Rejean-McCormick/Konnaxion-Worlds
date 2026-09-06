from __future__ import annotations

import json
import os
import queue
import shutil
import subprocess
import sys
import threading
import time
import traceback
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

APP_TITLE = "Konnaxion — Ethikos Seed Manager V3"
DEFAULT_SEED_REL = Path("seed-data") / "ethikos" / "canada_quebec_public_debates_2026.json"
DEFAULT_COMPOSE_REL = Path("backend") / "docker-compose.local.yml"
DEFAULT_BACKEND_REL = Path("backend")

PREVIEW_CODE = r'''
import json, sys
from konnaxion.ethikos.demo_import.importer import validate_and_preview_ethikos_demo_scenario
payload = json.load(sys.stdin)
result = validate_and_preview_ethikos_demo_scenario(payload)
print("__KX_RESULT__=" + json.dumps(result, ensure_ascii=False, default=str))
'''.strip()

IMPORT_CODE = r'''
import json, sys
from konnaxion.ethikos.demo_import.importer import import_ethikos_demo_scenario
payload = json.load(sys.stdin)
result = import_ethikos_demo_scenario(payload, imported_by=None, dry_run=False)
print("__KX_RESULT__=" + json.dumps(result, ensure_ascii=False, default=str))
'''.strip()

RESET_CODE = r'''
import json, sys
from konnaxion.ethikos.demo_import.importer import reset_ethikos_demo_scenario
payload = json.load(sys.stdin)
result = reset_ethikos_demo_scenario(payload["scenario_key"], reset_by=None)
print("__KX_RESULT__=" + json.dumps(result, ensure_ascii=False, default=str))
'''.strip()

CHECK_CODE = r'''
from konnaxion.ethikos.demo_import.schema import SUPPORTED_SCHEMA_VERSIONS
from konnaxion.ethikos.demo_import.importer import import_ethikos_demo_scenario
print("__KX_RESULT__=" + __import__("json").dumps({
    "ok": True,
    "supported_schema_versions": list(SUPPORTED_SCHEMA_VERSIONS),
    "importer": import_ethikos_demo_scenario.__name__,
}))
'''.strip()


class SeedManagerApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1000x720")
        self.minsize(820, 600)

        self.repo_var = tk.StringVar(value=str(self._detect_repo_root() or ""))
        self.seed_var = tk.StringVar(value="")
        self.status_var = tk.StringVar(value="Prêt.")
        self.summary_var = tk.StringVar(value="Aucun scénario chargé.")
        self._busy = False
        self._last_preview: dict | None = None
        self._ui_queue: queue.Queue[tuple[str, object]] = queue.Queue()

        self._build_ui()
        self.repo_var.trace_add("write", lambda *_: self._sync_seed_path())
        self._sync_seed_path()
        self.after(100, self._drain_ui_queue)

    # ------------------------------------------------------------------
    # UI
    # ------------------------------------------------------------------
    def _build_ui(self) -> None:
        root = ttk.Frame(self, padding=14)
        root.pack(fill="both", expand=True)

        title = ttk.Label(root, text=APP_TITLE, font=("Segoe UI", 16, "bold"))
        title.pack(anchor="w")
        ttk.Label(
            root,
            text=(
                "Gestion locale du scénario seed Ethikos V3 + EkoH via le service canonique "
                "konnaxion.ethikos.demo_import."
            ),
        ).pack(anchor="w", pady=(2, 12))

        paths = ttk.LabelFrame(root, text="Chemins", padding=10)
        paths.pack(fill="x")

        repo_row = ttk.Frame(paths)
        repo_row.pack(fill="x", pady=3)
        ttk.Label(repo_row, text="Racine Konnaxion", width=18).pack(side="left")
        ttk.Entry(repo_row, textvariable=self.repo_var).pack(side="left", fill="x", expand=True, padx=6)
        ttk.Button(repo_row, text="Parcourir…", command=self._browse_repo).pack(side="left")

        seed_row = ttk.Frame(paths)
        seed_row.pack(fill="x", pady=3)
        ttk.Label(seed_row, text="JSON seed", width=18).pack(side="left")
        ttk.Entry(seed_row, textvariable=self.seed_var).pack(side="left", fill="x", expand=True, padx=6)
        ttk.Button(seed_row, text="Choisir…", command=self._browse_seed).pack(side="left")

        summary_box = ttk.LabelFrame(root, text="Scénario", padding=10)
        summary_box.pack(fill="x", pady=(10, 0))
        ttk.Label(summary_box, textvariable=self.summary_var).pack(anchor="w")

        actions = ttk.LabelFrame(root, text="Actions", padding=10)
        actions.pack(fill="x", pady=(10, 0))

        row1 = ttk.Frame(actions)
        row1.pack(fill="x")
        self.btn_verify = ttk.Button(row1, text="1. Vérifier", command=lambda: self._run_async(self._verify_all))
        self.btn_verify.pack(side="left", padx=(0, 6))
        self.btn_start = ttk.Button(row1, text="2. Démarrer backend", command=lambda: self._run_async(self._start_backend))
        self.btn_start.pack(side="left", padx=6)
        self.btn_preview = ttk.Button(row1, text="3. Preview", command=lambda: self._run_async(self._preview))
        self.btn_preview.pack(side="left", padx=6)
        self.btn_import = ttk.Button(row1, text="4. Importer", command=self._confirm_import)
        self.btn_import.pack(side="left", padx=6)
        self.btn_reset = ttk.Button(row1, text="Reset scénario", command=self._confirm_reset)
        self.btn_reset.pack(side="left", padx=6)

        row2 = ttk.Frame(actions)
        row2.pack(fill="x", pady=(8, 0))
        ttk.Button(row2, text="Tests Demo Importer", command=lambda: self._run_async(self._run_tests)).pack(side="left", padx=(0, 6))
        ttk.Button(row2, text="Ouvrir Demo Importer", command=self._open_demo_importer).pack(side="left", padx=6)
        ttk.Button(row2, text="Ouvrir dossier seed", command=self._open_seed_folder).pack(side="left", padx=6)
        ttk.Button(row2, text="Effacer journal", command=self._clear_log).pack(side="right")

        status_frame = ttk.Frame(root)
        status_frame.pack(fill="x", pady=(10, 4))
        self.progress = ttk.Progressbar(status_frame, mode="indeterminate", length=180)
        self.progress.pack(side="left")
        ttk.Label(status_frame, textvariable=self.status_var).pack(side="left", padx=10)

        log_box = ttk.LabelFrame(root, text="Journal", padding=6)
        log_box.pack(fill="both", expand=True)
        self.log = tk.Text(log_box, wrap="word", font=("Consolas", 9), state="disabled")
        scroll = ttk.Scrollbar(log_box, orient="vertical", command=self.log.yview)
        self.log.configure(yscrollcommand=scroll.set)
        self.log.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

    # ------------------------------------------------------------------
    # Path helpers
    # ------------------------------------------------------------------
    def _detect_repo_root(self) -> Path | None:
        candidates: list[Path] = []
        try:
            here = Path(__file__).resolve().parent
            candidates.extend([here, *here.parents])
        except Exception:
            pass
        candidates.extend([
            Path.cwd(),
            Path(r"C:\mycode\Konnaxion"),
            Path.home() / "Konnaxion",
        ])
        seen: set[str] = set()
        for candidate in candidates:
            key = str(candidate).lower()
            if key in seen:
                continue
            seen.add(key)
            if (candidate / DEFAULT_COMPOSE_REL).is_file() and (candidate / "backend" / "konnaxion" / "ethikos").is_dir():
                return candidate
        return None

    def _repo(self) -> Path:
        value = self.repo_var.get().strip().strip('"')
        if not value:
            raise RuntimeError("Sélectionne la racine du dépôt Konnaxion.")
        return Path(value).expanduser().resolve()

    def _backend(self) -> Path:
        return self._repo() / DEFAULT_BACKEND_REL

    def _compose_file(self) -> Path:
        return self._repo() / DEFAULT_COMPOSE_REL

    def _seed_file(self) -> Path:
        value = self.seed_var.get().strip().strip('"')
        if not value:
            raise RuntimeError("Sélectionne le fichier JSON seed.")
        return Path(value).expanduser().resolve()

    def _sync_seed_path(self) -> None:
        try:
            repo_text = self.repo_var.get().strip().strip('"')
            if repo_text:
                expected = Path(repo_text).expanduser() / DEFAULT_SEED_REL
                if expected.exists() or not self.seed_var.get().strip():
                    self.seed_var.set(str(expected))
                self._update_local_summary()
        except Exception:
            pass

    def _browse_repo(self) -> None:
        selected = filedialog.askdirectory(title="Sélectionner la racine Konnaxion")
        if selected:
            self.repo_var.set(selected)

    def _browse_seed(self) -> None:
        selected = filedialog.askopenfilename(
            title="Sélectionner le scénario Ethikos",
            filetypes=[("JSON", "*.json"), ("Tous les fichiers", "*.*")],
        )
        if selected:
            self.seed_var.set(selected)
            self._update_local_summary()

    # ------------------------------------------------------------------
    # Local validation
    # ------------------------------------------------------------------
    def _load_seed(self) -> dict:
        path = self._seed_file()
        if not path.is_file():
            raise RuntimeError(f"JSON seed introuvable : {path}")
        try:
            with path.open("r", encoding="utf-8-sig") as fh:
                payload = json.load(fh)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"JSON invalide ({exc.lineno}:{exc.colno}) : {exc.msg}") from exc
        if not isinstance(payload, dict):
            raise RuntimeError("Le JSON seed doit être un objet JSON.")
        return payload

    def _update_local_summary(self) -> None:
        try:
            data = self._load_seed()
            self.summary_var.set(self._format_seed_summary(data))
        except Exception as exc:
            self.summary_var.set(f"Seed non chargé : {exc}")

    @staticmethod
    def _format_seed_summary(data: dict) -> str:
        return (
            f"{data.get('schema_version', '?')}  |  scénario: {data.get('scenario_key', '?')}  |  "
            f"acteurs {len(data.get('actors', []))} · catégories {len(data.get('categories', []))} · "
            f"débats {len(data.get('topics', []))} · positions {len(data.get('stances', []))} · "
            f"arguments {len(data.get('arguments', []))} · sources-liens {len(data.get('argument_sources', []))} · "
            f"EkoH {len(data.get('ekoh_profiles', []))} · pertinence {len(data.get('topic_relevance', []))}"
        )

    def _validate_repo_files(self) -> None:
        repo = self._repo()
        compose = self._compose_file()
        if not repo.is_dir():
            raise RuntimeError(f"Racine Konnaxion introuvable : {repo}")
        if not compose.is_file():
            raise RuntimeError(f"Compose local introuvable : {compose}")

        schema = repo / "backend" / "konnaxion" / "ethikos" / "demo_import" / "schema.py"
        importer = repo / "backend" / "konnaxion" / "ethikos" / "demo_import" / "importer.py"
        if not schema.is_file() or not importer.is_file():
            raise RuntimeError("Les fichiers demo_import Ethikos sont introuvables.")

        schema_text = schema.read_text(encoding="utf-8", errors="replace")
        importer_text = importer.read_text(encoding="utf-8", errors="replace")
        if "ethikos-demo-scenario/v3" not in schema_text or "topic_relevance" not in schema_text:
            raise RuntimeError("schema.py ne semble pas contenir le support Ethikos V3 / EkoH / topic_relevance.")
        if "_import_argument_sources" not in importer_text or "_import_topic_reading_context" not in importer_text:
            raise RuntimeError("importer.py ne semble pas contenir les imports V3 requis.")

        binding = repo / "backend" / "konnaxion" / "smart_vote" / "models" / "source_binding.py"
        binding_migration = repo / "backend" / "konnaxion" / "smart_vote" / "migrations" / "0004_source_consultation_binding.py"
        if not binding.is_file() or not binding_migration.is_file():
            raise RuntimeError(
                "Le binding canonique Ethikos topic → Smart Vote consultation n'est pas installé."
            )

    # ------------------------------------------------------------------
    # Docker helpers
    # ------------------------------------------------------------------
    def _docker_exe(self) -> str:
        found = shutil.which("docker")
        if found:
            return found
        common = Path(r"C:\Program Files\Docker\Docker\resources\bin\docker.exe")
        if common.is_file():
            return str(common)
        raise RuntimeError("Docker CLI introuvable. Démarre/installe Docker Desktop et vérifie le PATH.")

    def _docker_cmd(self, *args: str) -> list[str]:
        return [self._docker_exe(), "compose", "-f", str(self._compose_file()), *args]

    def _run_process(
        self,
        args: list[str],
        *,
        cwd: Path | None = None,
        stdin_text: str | None = None,
        timeout: int = 300,
        log_output: bool = True,
    ) -> tuple[int, str]:
        self._log("$ " + subprocess.list2cmdline(args))
        creationflags = 0
        if os.name == "nt" and hasattr(subprocess, "CREATE_NO_WINDOW"):
            creationflags = subprocess.CREATE_NO_WINDOW

        proc = subprocess.Popen(
            args,
            cwd=str(cwd) if cwd else None,
            stdin=subprocess.PIPE if stdin_text is not None else subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            creationflags=creationflags,
        )
        try:
            output, _ = proc.communicate(stdin_text, timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            output, _ = proc.communicate()
            raise RuntimeError(f"Commande expirée après {timeout}s.\n{output}")

        output = output or ""
        if log_output and output.strip():
            self._log(output.rstrip())
        return proc.returncode, output

    def _is_django_running(self) -> bool:
        code, out = self._run_process(
            self._docker_cmd("ps", "--services", "--status", "running"),
            cwd=self._backend(),
            timeout=30,
            log_output=False,
        )
        return code == 0 and "django" in {line.strip() for line in out.splitlines()}

    def _ensure_backend_running(self) -> None:
        if self._is_django_running():
            self._log("Django est déjà démarré.")
            return
        self._log("Démarrage du service Django et de ses dépendances…")
        code, _ = self._run_process(
            self._docker_cmd("up", "-d", "django"),
            cwd=self._backend(),
            timeout=300,
        )
        if code != 0:
            raise RuntimeError("Échec du démarrage Docker Compose.")

        deadline = time.time() + 90
        while time.time() < deadline:
            if self._is_django_running():
                break
            time.sleep(2)
        else:
            raise RuntimeError("Le service django n'est pas passé à l'état running.")

        code, out = self._run_process(
            self._docker_cmd("exec", "-T", "django", "python", "manage.py", "check"),
            cwd=self._backend(),
            timeout=120,
        )
        if code != 0:
            raise RuntimeError("Django est démarré mais `manage.py check` a échoué.\n" + out)

    def _django_service_call(self, code_text: str, payload: dict) -> dict:
        self._ensure_backend_running()
        args = self._docker_cmd(
            "exec", "-T", "django",
            "python", "manage.py", "shell", "-c", code_text,
        )
        return_code, output = self._run_process(
            args,
            cwd=self._backend(),
            stdin_text=json.dumps(payload, ensure_ascii=False),
            timeout=300,
        )
        if return_code != 0:
            raise RuntimeError("L'appel au service Ethikos a échoué.\n" + output)

        marker = "__KX_RESULT__="
        result_line = None
        for line in output.splitlines():
            if line.startswith(marker):
                result_line = line[len(marker):]
        if not result_line:
            raise RuntimeError("Aucun résultat structuré reçu du service Ethikos.\n" + output)
        try:
            return json.loads(result_line)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Résultat Ethikos illisible.\n" + result_line) from exc

    def _prepare_v3_runtime(self) -> None:
        """Apply local migrations and load the canonical demo taxonomy."""
        self._ensure_backend_running()
        self._log("Application des migrations requises pour EkoH / Smart Vote…")
        code, out = self._run_process(
            self._docker_cmd(
                "exec", "-T", "django",
                "python", "manage.py", "migrate", "--noinput",
            ),
            cwd=self._backend(),
            timeout=300,
        )
        if code != 0:
            raise RuntimeError("Échec des migrations Django.\n" + out)

        self._log("Chargement / synchronisation de la taxonomie ISCED-F…")
        code, out = self._run_process(
            self._docker_cmd(
                "exec", "-T", "django",
                "python", "manage.py", "load_isced",
            ),
            cwd=self._backend(),
            timeout=180,
        )
        if code != 0:
            raise RuntimeError("Échec du chargement ISCED-F.\n" + out)

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------
    def _verify_all(self) -> None:
        self._set_status("Vérification…")
        self._validate_repo_files()
        payload = self._load_seed()
        self._log("Seed local : " + self._format_seed_summary(payload))

        if payload.get("schema_version") != "ethikos-demo-scenario/v3":
            raise RuntimeError(
                "Ce gestionnaire attend le scénario final `ethikos-demo-scenario/v3`. "
                f"Reçu : {payload.get('schema_version')!r}"
            )

        code, out = self._run_process([self._docker_exe(), "compose", "version"], timeout=30)
        if code != 0:
            raise RuntimeError("Docker Compose n'est pas disponible.\n" + out)

        self._ensure_backend_running()
        runtime = self._django_service_call(CHECK_CODE, {})
        if "ethikos-demo-scenario/v3" not in runtime.get("supported_schema_versions", []):
            raise RuntimeError("Le conteneur Django actif ne charge pas encore le support du schéma V3.")

        self._prepare_v3_runtime()
        preview = self._django_service_call(PREVIEW_CODE, payload)
        self._last_preview = preview
        self._log_result("PREVIEW", preview)
        if not preview.get("ok"):
            raise RuntimeError("Le Preview Ethikos retourne des erreurs de validation.")
        self._set_status("Vérification réussie. Seed prêt à importer.")

    def _start_backend(self) -> None:
        self._set_status("Démarrage backend…")
        self._validate_repo_files()
        self._ensure_backend_running()
        self._set_status("Backend Django prêt.")

    def _preview(self) -> None:
        self._set_status("Preview Ethikos…")
        self._validate_repo_files()
        payload = self._load_seed()
        self._prepare_v3_runtime()
        result = self._django_service_call(PREVIEW_CODE, payload)
        self._last_preview = result
        self._log_result("PREVIEW", result)
        if result.get("ok"):
            self._set_status("Preview réussi.")
        else:
            self._set_status("Preview échoué — voir le journal.")

    def _confirm_import(self) -> None:
        if self._busy:
            return
        try:
            payload = self._load_seed()
        except Exception as exc:
            messagebox.showerror(APP_TITLE, str(exc), parent=self)
            return

        mode = payload.get("mode", "replace_scenario")
        scenario_key = payload.get("scenario_key", "?")
        msg = (
            f"Importer le scénario `{scenario_key}` ?\n\n"
            f"Mode : {mode}\n"
            f"Débats : {len(payload.get('topics', []))}\n"
            f"Arguments : {len(payload.get('arguments', []))}\n"
            f"Sources-liens : {len(payload.get('argument_sources', []))}\n"
            f"Profils EkoH : {len(payload.get('ekoh_profiles', []))}\n"
            f"Pertinence topics : {len(payload.get('topic_relevance', []))}\n\n"
        )
        if mode == "replace_scenario":
            msg += "Le scénario déjà suivi sous la même clé sera remplacé proprement avant réimport."
        else:
            msg += "Le scénario sera ajouté selon le mode déclaré dans le JSON."

        if messagebox.askyesno(APP_TITLE, msg, parent=self):
            self._run_async(self._import_seed)

    def _import_seed(self) -> None:
        self._set_status("Validation avant import…")
        self._validate_repo_files()
        payload = self._load_seed()
        self._prepare_v3_runtime()

        preview = self._django_service_call(PREVIEW_CODE, payload)
        self._last_preview = preview
        self._log_result("PREVIEW AVANT IMPORT", preview)
        if not preview.get("ok"):
            raise RuntimeError("Import bloqué : le Preview contient des erreurs.")

        self._set_status("Import Ethikos…")
        result = self._django_service_call(IMPORT_CODE, payload)
        self._log_result("IMPORT", result)
        if not result.get("ok"):
            raise RuntimeError("L'import Ethikos a échoué. Voir les erreurs dans le journal.")

        created = result.get("created") or []
        source_created = sum(1 for row in created if row.get("object_type") == "argument_source")
        self._log(f"ArgumentSource créés : {source_created}")
        self._set_status("Import terminé avec succès.")
        self._ui_queue.put(("info", "Import Ethikos terminé avec succès."))

    def _confirm_reset(self) -> None:
        if self._busy:
            return
        try:
            payload = self._load_seed()
            scenario_key = payload.get("scenario_key")
            if not scenario_key:
                raise RuntimeError("scenario_key absent du JSON.")
        except Exception as exc:
            messagebox.showerror(APP_TITLE, str(exc), parent=self)
            return

        if messagebox.askyesno(
            APP_TITLE,
            f"Reset du scénario `{scenario_key}` ?\n\nSeuls les objets suivis pour cette clé seront supprimés.",
            parent=self,
        ):
            self._run_async(self._reset_seed)

    def _reset_seed(self) -> None:
        payload = self._load_seed()
        scenario_key = payload.get("scenario_key")
        if not scenario_key:
            raise RuntimeError("scenario_key absent du JSON.")
        self._set_status("Reset Ethikos…")
        result = self._django_service_call(RESET_CODE, {"scenario_key": scenario_key})
        self._log_result("RESET", result)
        if not result.get("ok"):
            raise RuntimeError("Le reset Ethikos a échoué.")
        self._set_status("Reset terminé.")
        self._ui_queue.put(("info", "Reset Ethikos terminé."))

    def _run_tests(self) -> None:
        self._set_status("Tests Demo Importer…")
        self._validate_repo_files()
        self._ensure_backend_running()
        args = self._docker_cmd(
            "exec", "-T", "django", "pytest", "-q",
            "konnaxion/ethikos/tests/test_demo_import_schema.py",
            "konnaxion/ethikos/tests/test_demo_importer.py",
            "konnaxion/ethikos/tests/test_demo_import_api.py",
            "konnaxion/smart_vote/tests/test_reading_service.py",
        )
        code, out = self._run_process(args, cwd=self._backend(), timeout=600)
        if code != 0:
            raise RuntimeError("Les tests Demo Importer ont échoué.\n" + out)
        self._set_status("Tests Demo Importer réussis.")

    # ------------------------------------------------------------------
    # Misc UI helpers
    # ------------------------------------------------------------------
    def _open_demo_importer(self) -> None:
        webbrowser.open("http://localhost:3000/ethikos/admin/demo-importer")

    def _open_seed_folder(self) -> None:
        try:
            folder = self._seed_file().parent
            if os.name == "nt":
                os.startfile(str(folder))  # type: ignore[attr-defined]
            else:
                subprocess.Popen(["xdg-open", str(folder)])
        except Exception as exc:
            messagebox.showerror(APP_TITLE, str(exc), parent=self)

    def _clear_log(self) -> None:
        self.log.configure(state="normal")
        self.log.delete("1.0", "end")
        self.log.configure(state="disabled")

    def _log_result(self, title: str, result: dict) -> None:
        self._log(f"\n===== {title} =====")
        self._log(json.dumps(result, ensure_ascii=False, indent=2, default=str))

    def _log(self, text: str) -> None:
        self._ui_queue.put(("log", text))

    def _set_status(self, text: str) -> None:
        self._ui_queue.put(("status", text))

    def _set_busy(self, busy: bool) -> None:
        self._busy = busy
        state = "disabled" if busy else "normal"
        for btn in (self.btn_verify, self.btn_start, self.btn_preview, self.btn_import, self.btn_reset):
            btn.configure(state=state)
        if busy:
            self.progress.start(10)
        else:
            self.progress.stop()

    def _run_async(self, func) -> None:
        if self._busy:
            return
        self._set_busy(True)

        def worker() -> None:
            try:
                func()
            except Exception as exc:
                self._log("\nERREUR: " + str(exc))
                self._log(traceback.format_exc())
                self._ui_queue.put(("error", str(exc)))
                self._ui_queue.put(("status", "Échec — voir le journal."))
            finally:
                self._ui_queue.put(("busy", False))

        threading.Thread(target=worker, daemon=True).start()

    def _drain_ui_queue(self) -> None:
        try:
            while True:
                kind, payload = self._ui_queue.get_nowait()
                if kind == "log":
                    self.log.configure(state="normal")
                    self.log.insert("end", str(payload) + "\n")
                    self.log.see("end")
                    self.log.configure(state="disabled")
                elif kind == "status":
                    self.status_var.set(str(payload))
                elif kind == "error":
                    messagebox.showerror(APP_TITLE, str(payload), parent=self)
                elif kind == "info":
                    messagebox.showinfo(APP_TITLE, str(payload), parent=self)
                elif kind == "busy":
                    self._set_busy(bool(payload))
        except queue.Empty:
            pass
        self.after(100, self._drain_ui_queue)


def main() -> None:
    app = SeedManagerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
