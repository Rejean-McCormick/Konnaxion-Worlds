from __future__ import annotations

import json
import os
import queue
import subprocess
import threading
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

APP_TITLE = "Konnaxion — World Manager"
ARCHITECTURE_LOCK = "KX-WORLDS-1"
BACKEND_REL = Path("backend")
MANAGE_REL = BACKEND_REL / "worlds_manage.py"
VENV_PY_REL = Path(".venv") / "Scripts" / "python.exe"
RESULT_MARKER = "__KX_RESULT__="

LIST_CODE = r'''
import json
from konnaxion.worlds.models import World
from konnaxion.worlds.services.seed_packs import discover_seed_packs
packs = discover_seed_packs(persist=True)
worlds = []
for world in World.objects.select_related("current_release").order_by("key"):
    release = world.current_release
    worlds.append({
        "id": world.id, "key": world.key, "title": world.title,
        "status": world.status, "visibility": world.visibility,
        "release": None if release is None else {
            "id": release.id, "number": release.release_number,
            "status": release.status, "dirty": release.is_dirty,
            "seed": release.seed_pack_key, "seed_version": release.seed_version,
        },
        "releases": [
            {
                "id": r.id, "number": r.release_number, "status": r.status,
                "dirty": r.is_dirty, "seed": r.seed_pack_key,
                "seed_version": r.seed_version, "reason": r.build_reason,
            }
            for r in world.releases.order_by("-release_number")
        ],
        "build_jobs": [
            {
                "id": j.id, "status": j.status, "release_id": j.release_id,
                "seed": j.seed_pack_key, "seed_version": j.seed_version,
            }
            for j in world.build_jobs.order_by("-created_at")[:5]
        ],
    })
print("__KX_RESULT__=" + json.dumps({
    "architecture_lock": "KX-WORLDS-1",
    "worlds": worlds,
    "packs": [{"key": p.world_key, "title": p.title, "version": p.version, "checksum": p.checksum} for p in packs],
}, default=str))
'''.strip()

CREATE_CODE = r'''
import json, sys
from django.core.exceptions import ValidationError
from konnaxion.worlds.models import World
payload = json.load(sys.stdin)
key = str(payload["key"]).strip().lower()
if World.objects.filter(key=key).exists():
    world = World.objects.get(key=key)
    created = False
else:
    world = World(
        key=key,
        title=payload.get("title") or key,
        description=payload.get("description", ""),
        visibility=payload.get("visibility", "private"),
    )
    world.full_clean()
    world.save()
    created = True
print("__KX_RESULT__=" + json.dumps({"ok": True, "created": created, "id": world.id, "key": world.key}))
'''.strip()

BUILD_CODE = r'''
import json, sys
from konnaxion.worlds.models import World
from konnaxion.worlds.services.builder import build_world_release
payload = json.load(sys.stdin)
world = World.objects.get(key=payload["world_key"])
release = build_world_release(
    world=world,
    seed_pack_key=payload["seed_pack_key"],
    seed_version=payload.get("seed_version") or None,
    promote=bool(payload.get("promote")),
)
print("__KX_RESULT__=" + json.dumps({
    "ok": True,
    "release_id": release.id,
    "release_number": release.release_number,
    "status": release.status,
    "promoted": bool(payload.get("promote")),
}))
'''.strip()

PROMOTE_CODE = r'''
import json, sys
from konnaxion.worlds.models import World
from konnaxion.worlds.services.builder import promote_release
payload = json.load(sys.stdin)
world = World.objects.get(key=payload["world_key"])
release = world.releases.get(pk=int(payload["release_id"]))
promote_release(world=world, release=release)
print("__KX_RESULT__=" + json.dumps({"ok": True, "release_id": release.id, "release_number": release.release_number}))
'''.strip()

PURGE_CODE = r'''
import json, sys
from konnaxion.worlds.models import World
from konnaxion.worlds.services.builder import purge_release
payload = json.load(sys.stdin)
world = World.objects.get(key=payload["world_key"])
release = world.releases.get(pk=int(payload["release_id"]))
purge_release(release=release)
print("__KX_RESULT__=" + json.dumps({"ok": True, "release_id": int(payload["release_id"])}))
'''.strip()

SNAPSHOT_CODE = r'''
import json, sys
from konnaxion.worlds.models import World
from konnaxion.worlds.services.snapshots import create_snapshot
payload = json.load(sys.stdin)
world = World.objects.get(key=payload["world_key"])
snapshot = create_snapshot(world=world, label=payload["label"])
print("__KX_RESULT__=" + json.dumps({"ok": True, "snapshot_id": snapshot.id, "frozen_release_id": snapshot.frozen_release_id}))
'''.strip()

ROLLBACK_CODE = r'''
import json, sys
from konnaxion.worlds.models import World, WorldRelease
from konnaxion.worlds.services.builder import clone_release_state, promote_release
payload = json.load(sys.stdin)
world = World.objects.get(key=payload["world_key"])
source = world.releases.get(pk=int(payload["release_id"]))
restored = clone_release_state(source=source, target_world=world, reason="rollback", target_status=WorldRelease.STATUS_READY)
promote_release(world=world, release=restored)
print("__KX_RESULT__=" + json.dumps({"ok": True, "release_id": restored.id, "release_number": restored.release_number}))
'''.strip()

CLONE_CODE = r'''
import json, sys
from konnaxion.worlds.models import World
from konnaxion.worlds.services.builder import clone_release_state, promote_release
payload = json.load(sys.stdin)
source = World.objects.select_related("current_release").get(key=payload["source_key"])
if source.current_release is None:
    raise RuntimeError("Source World has no current release")
target_key = str(payload["target_key"]).strip().lower()
if World.objects.filter(key=target_key).exists():
    raise RuntimeError(f"World already exists: {target_key}")
target = World(
    key=target_key, title=payload.get("title") or target_key,
    description=source.description, visibility=source.visibility, parent_world=source,
)
target.full_clean()
target.save()
release = clone_release_state(source=source.current_release, target_world=target, reason="fork")
promote_release(world=target, release=release)
print("__KX_RESULT__=" + json.dumps({"ok": True, "world_id": target.id, "release_number": release.release_number}))
'''.strip()

ARCHIVE_CODE = r'''
import json, sys
from django.utils import timezone
from konnaxion.worlds.models import World
payload = json.load(sys.stdin)
world = World.objects.get(key=payload["world_key"])
world.status = World.STATUS_ARCHIVED
world.archived_at = timezone.now()
world.save(update_fields=["status", "archived_at", "updated_at"])
print("__KX_RESULT__=" + json.dumps({"ok": True, "world_id": world.id, "status": world.status}))
'''.strip()

RESTORE_WORLD_CODE = r'''
import json, sys
from konnaxion.worlds.models import World, WorldRelease
from konnaxion.worlds.services.schema import validate_release_schemas
payload = json.load(sys.stdin)
world = World.objects.select_related("current_release").get(key=payload["world_key"])
release = world.current_release
if release is not None and release.status == WorldRelease.STATUS_CURRENT:
    report = validate_release_schemas(release)
    world.status = World.STATUS_ACTIVE if report.get("ok") else World.STATUS_MAINTENANCE
else:
    report = {"ok": False, "reason": "no valid current release"}
    world.status = World.STATUS_MAINTENANCE
world.archived_at = None
world.save(update_fields=["status", "archived_at", "updated_at"])
print("__KX_RESULT__=" + json.dumps({"ok": bool(report.get("ok")), "world_id": world.id, "status": world.status, "validation": report}, default=str))
'''.strip()

HEALTH_CODE = r'''
import json
from konnaxion.worlds.services.health import world_system_health
print("__KX_RESULT__=" + json.dumps(world_system_health(), default=str))
'''.strip()


class WorldManager(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1120x760")
        self.minsize(900, 620)
        detected_repo = self._detect_repo()
        self.repo_var = tk.StringVar(value=str(detected_repo or ""))
        detected_db, db_source = self._detect_database_url(detected_repo)
        self.db_var = tk.StringVar(value=detected_db or "")
        self.db_source = db_source or "not configured"
        self.status_var = tk.StringVar(value=f"{ARCHITECTURE_LOCK} — standalone venv — DB: {self.db_source}")
        self._queue: queue.Queue[tuple[str, object]] = queue.Queue()
        self._busy = False
        self._registry: dict = {"worlds": [], "packs": []}
        self._build_ui()
        self.after(100, self._drain)
        self.after(250, lambda: self._run_async(self.refresh))

    def _build_ui(self) -> None:
        root = ttk.Frame(self, padding=12)
        root.pack(fill="both", expand=True)
        ttk.Label(root, text="Konnaxion World Manager", font=("Segoe UI", 17, "bold")).pack(anchor="w")
        ttk.Label(root, text="standalone · Neon/PostgreSQL · isolated WorldReleases · KX-WORLDS-1").pack(anchor="w", pady=(2, 10))

        path_row = ttk.Frame(root)
        path_row.pack(fill="x")
        ttk.Label(path_row, text="Repository", width=12).pack(side="left")
        ttk.Entry(path_row, textvariable=self.repo_var).pack(side="left", fill="x", expand=True, padx=6)
        ttk.Button(path_row, text="Refresh", command=lambda: self._run_async(self.refresh)).pack(side="left")

        db_row = ttk.Frame(root)
        db_row.pack(fill="x", pady=(6, 0))
        ttk.Label(db_row, text="Database", width=12).pack(side="left")
        ttk.Entry(db_row, textvariable=self.db_var, show="*").pack(side="left", fill="x", expand=True, padx=6)
        ttk.Label(db_row, text="Neon/PostgreSQL — secret masked").pack(side="left")

        panes = ttk.Panedwindow(root, orient="horizontal")
        panes.pack(fill="both", expand=True, pady=10)
        left = ttk.LabelFrame(panes, text="Worlds", padding=6)
        middle = ttk.LabelFrame(panes, text="Releases", padding=6)
        right = ttk.LabelFrame(panes, text="Seed Packs", padding=6)
        panes.add(left, weight=3)
        panes.add(middle, weight=3)
        panes.add(right, weight=2)

        self.world_tree = ttk.Treeview(left, columns=("status", "release", "seed"), show="tree headings", selectmode="browse")
        self.world_tree.heading("#0", text="World")
        self.world_tree.heading("status", text="Status")
        self.world_tree.heading("release", text="Release")
        self.world_tree.heading("seed", text="Seed")
        self.world_tree.column("#0", width=210)
        self.world_tree.column("status", width=145)
        self.world_tree.column("release", width=90)
        self.world_tree.column("seed", width=160)
        self.world_tree.pack(fill="both", expand=True)
        self.world_tree.bind("<<TreeviewSelect>>", lambda _event: self._refresh_release_tree())

        self.release_tree = ttk.Treeview(
            middle, columns=("status", "seed", "reason"), show="tree headings", selectmode="browse"
        )
        self.release_tree.heading("#0", text="Release")
        self.release_tree.heading("status", text="Status")
        self.release_tree.heading("seed", text="Seed")
        self.release_tree.heading("reason", text="Reason")
        self.release_tree.column("#0", width=90)
        self.release_tree.column("status", width=95)
        self.release_tree.column("seed", width=155)
        self.release_tree.column("reason", width=90)
        self.release_tree.pack(fill="both", expand=True)

        self.pack_tree = ttk.Treeview(right, columns=("version",), show="tree headings", selectmode="browse")
        self.pack_tree.heading("#0", text="Seed Pack")
        self.pack_tree.heading("version", text="Version")
        self.pack_tree.column("#0", width=220)
        self.pack_tree.column("version", width=90)
        self.pack_tree.pack(fill="both", expand=True)

        actions = ttk.LabelFrame(root, text="World lifecycle", padding=8)
        actions.pack(fill="x")
        for label, command in (
            ("Create World", self.create_world),
            ("Build Release", self.build_release),
            ("Build + Promote", lambda: self.build_release(promote=True)),
            ("Promote Release", self.promote_selected_release),
            ("Snapshot", self.snapshot),
            ("Restore Release", self.rollback),
            ("Purge Release", self.purge_selected_release),
            ("Clone / Fork", self.clone_world),
            ("Archive", self.archive_world),
            ("Restore", self.restore_world),
            ("Health", self.health),
        ):
            # Tk widgets/dialogs must always run on Tk's main thread.
            # Each action collects UI input here, then offloads only DB/subprocess work.
            ttk.Button(actions, text=label, command=command).pack(side="left", padx=4)

        status = ttk.Frame(root)
        status.pack(fill="x", pady=(8, 4))
        self.progress = ttk.Progressbar(status, mode="indeterminate", length=160)
        self.progress.pack(side="left")
        ttk.Label(status, textvariable=self.status_var).pack(side="left", padx=8)

        self.log = tk.Text(root, height=10, wrap="word", state="disabled", font=("Consolas", 9))
        self.log.pack(fill="both", expand=False)

    def _detect_repo(self) -> Path | None:
        candidates = [
            Path(__file__).resolve().parent,
            Path.cwd(),
            Path(r"C:\mycode\Konnaxion\Konnaxion_Worlds"),
        ]
        for candidate in candidates:
            if (candidate / MANAGE_REL).is_file():
                return candidate
        return None

    @staticmethod
    def _read_env_value(path: Path, key: str) -> str | None:
        if not path.is_file():
            return None
        try:
            for raw in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                name, value = line.split("=", 1)
                if name.strip() == key:
                    return value.strip().strip('"').strip("'") or None
        except OSError:
            return None
        return None

    def _detect_database_url(self, repo: Path | None) -> tuple[str | None, str | None]:
        for name in ("KONNAXION_WORLDS_DATABASE_URL", "DATABASE_URL"):
            value = os.environ.get(name, "").strip()
            if value:
                return value, name

        if repo:
            for rel in (Path(".env"),):
                for key in ("KONNAXION_WORLDS_DATABASE_URL", "DATABASE_URL"):
                    value = self._read_env_value(repo / rel, key)
                    if value:
                        return value, f"{rel}:{key}"

        return None, None

    def _repo(self) -> Path:
        root = Path(self.repo_var.get().strip().strip('"')).resolve()
        if not (root / MANAGE_REL).is_file():
            raise RuntimeError("Invalid Konnaxion Worlds root: backend/worlds_manage.py not found.")
        return root

    def _python(self) -> Path:
        python = self._repo() / VENV_PY_REL
        if not python.is_file():
            raise RuntimeError(
                "Konnaxion Worlds .venv is missing. Run SETUP_KONNAXION_WORLDS.ps1 first."
            )
        return python

    def _runtime_env(self) -> dict[str, str]:
        database_url = self.db_var.get().strip()
        if not database_url:
            raise RuntimeError(
                "Konnaxion Worlds database URL is empty. Set KONNAXION_WORLDS_DATABASE_URL, "
                ".env, or paste the Neon/PostgreSQL URL in the masked Database field."
            )
        env = os.environ.copy()
        env["DATABASE_URL"] = database_url
        env["KONNAXION_WORLDS_DATABASE_URL"] = database_url
        env["USE_DOCKER"] = "no"
        env["DJANGO_SETTINGS_MODULE"] = "worlds_config.settings"
        return env

    def _manage(self, *args: str, input_text: str | None = None, timeout: int = 900) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [str(self._python()), "worlds_manage.py", *args],
            cwd=self._repo() / BACKEND_REL,
            env=self._runtime_env(),
            input=input_text,
            text=True,
            capture_output=True,
            timeout=timeout,
        )

    def _ensure_backend(self) -> None:
        # Apply the standalone control-plane migrations. Release-local schemas are
        # provisioned separately by the Worlds builder.
        proc = self._manage("migrate", "--noinput", timeout=300)
        if proc.returncode:
            raise RuntimeError("World control-plane migrations failed:\n" + proc.stdout + proc.stderr)

    def _call(self, code: str, payload: dict | None = None) -> dict:
        self._ensure_backend()
        proc = self._manage(
            "shell", "-c", code,
            input_text=json.dumps(payload or {}, ensure_ascii=False),
            timeout=1800,
        )
        output = proc.stdout + proc.stderr
        if proc.returncode:
            raise RuntimeError(output)
        result = None
        for line in output.splitlines():
            if line.startswith(RESULT_MARKER):
                result = json.loads(line[len(RESULT_MARKER):])
        if result is None:
            raise RuntimeError("No structured World result returned.\n" + output)
        return result

    def _selected_world(self) -> str:
        items = self.world_tree.selection()
        if not items:
            raise RuntimeError("Select a World first.")
        return items[0]

    def _selected_pack(self) -> tuple[str, str | None]:
        items = self.pack_tree.selection()
        if not items:
            raise RuntimeError("Select a Seed Pack first.")
        value = items[0]
        if "@" not in value:
            return value, None
        key, version = value.rsplit("@", 1)
        return key, version or None

    def _selected_release_id(self) -> int:
        items = self.release_tree.selection()
        if not items:
            raise RuntimeError("Select a Release first.")
        return int(items[0])

    def refresh(self) -> None:
        self._set_status("Loading registry…")
        data = self._call(LIST_CODE)
        self._queue.put(("registry", data))
        self._set_status(f"standalone ready — DB: {self.db_source}")

    def create_world(self) -> None:
        if self._busy:
            return
        key = simpledialog.askstring(APP_TITLE, "World key (slug):", parent=self)
        if not key:
            return
        title = simpledialog.askstring(APP_TITLE, "Title:", initialvalue=key, parent=self) or key
        payload = {"key": key.strip(), "title": title.strip(), "visibility": "private"}

        def work() -> None:
            self._call(CREATE_CODE, payload)
            self._log(f"Created World {payload['key']}")
            self.refresh()

        self._run_async(work)

    def build_release(self, promote: bool = False) -> None:
        if self._busy:
            return
        world = self._selected_world()
        pack, version = self._selected_pack()
        pack_label = f"{pack}@{version}" if version else pack
        if not messagebox.askyesno(APP_TITLE, f"Build {pack_label} into {world}?\nPromote: {promote}", parent=self):
            return
        payload = {"world_key": world, "seed_pack_key": pack, "seed_version": version, "promote": promote}

        def work() -> None:
            self._set_status("Building immutable release synchronously in local venv…")
            result = self._call(BUILD_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def snapshot(self) -> None:
        if self._busy:
            return
        world = self._selected_world()
        label = simpledialog.askstring(APP_TITLE, "Snapshot label:", initialvalue="before-demo", parent=self)
        if not label:
            return
        payload = {"world_key": world, "label": label}

        def work() -> None:
            result = self._call(SNAPSHOT_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def promote_selected_release(self) -> None:
        if self._busy:
            return
        world = self._selected_world()
        release_id = self._selected_release_id()
        if not messagebox.askyesno(APP_TITLE, "Promote selected READY release?", parent=self):
            return
        payload = {"world_key": world, "release_id": release_id}

        def work() -> None:
            result = self._call(PROMOTE_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def rollback(self) -> None:
        if self._busy:
            return
        world = self._selected_world()
        release_id = self._selected_release_id()
        if not messagebox.askyesno(
            APP_TITLE,
            "Restore selected release by cloning it into a NEW release and promoting the clone?",
            parent=self,
        ):
            return
        payload = {"world_key": world, "release_id": release_id}

        def work() -> None:
            result = self._call(ROLLBACK_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def purge_selected_release(self) -> None:
        if self._busy:
            return
        world = self._selected_world()
        release_id = self._selected_release_id()
        if not messagebox.askyesno(
            APP_TITLE,
            "Permanently purge selected non-current release and its schemas?",
            icon="warning",
            parent=self,
        ):
            return
        payload = {"world_key": world, "release_id": release_id}

        def work() -> None:
            result = self._call(PURGE_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def clone_world(self) -> None:
        if self._busy:
            return
        source = self._selected_world()
        target = simpledialog.askstring(APP_TITLE, "New World key:", parent=self)
        if not target:
            return
        title = simpledialog.askstring(APP_TITLE, "New World title:", initialvalue=target, parent=self) or target
        payload = {"source_key": source, "target_key": target.strip(), "title": title.strip()}

        def work() -> None:
            result = self._call(CLONE_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def archive_world(self) -> None:
        if self._busy:
            return
        world = self._selected_world()
        if not messagebox.askyesno(
            APP_TITLE, "Archive this World? Runtime access will be disabled.", icon="warning", parent=self
        ):
            return
        payload = {"world_key": world}

        def work() -> None:
            result = self._call(ARCHIVE_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def restore_world(self) -> None:
        if self._busy:
            return
        world = self._selected_world()
        payload = {"world_key": world}

        def work() -> None:
            result = self._call(RESTORE_WORLD_CODE, payload)
            self._log(json.dumps(result, indent=2))
            self.refresh()

        self._run_async(work)

    def health(self) -> None:
        if self._busy:
            return

        def work() -> None:
            result = self._call(HEALTH_CODE)
            self._log(json.dumps(result, indent=2))
            if not result.get("ok"):
                raise RuntimeError("World health check reports an isolation failure.")

        self._run_async(work)

    def _run_async(self, fn) -> None:
        if self._busy:
            return
        self._busy = True
        self.progress.start(10)
        threading.Thread(target=self._worker, args=(fn,), daemon=True).start()

    def _worker(self, fn) -> None:
        try:
            fn()
        except Exception as exc:
            self._queue.put(("error", str(exc)))
        finally:
            self._queue.put(("done", None))

    def _apply_registry(self, data: dict) -> None:
        selected_world = self.world_tree.selection()[0] if self.world_tree.selection() else None
        self._registry = data
        for item in self.world_tree.get_children():
            self.world_tree.delete(item)
        for world in data.get("worlds", []):
            release = world.get("release") or {}
            rel = "—" if not release else f"r{release.get('number')}" + (" *" if release.get("dirty") else "")
            seed = "—" if not release else f"{release.get('seed') or ''}@{release.get('seed_version') or ''}"
            active_jobs = [
                job for job in world.get("build_jobs", [])
                if job.get("status") in {"queued", "building", "validating"}
            ]
            status_text = world["status"]
            if active_jobs:
                status_text = f"{status_text} / {active_jobs[0]['status']}"
            self.world_tree.insert("", "end", iid=world["key"], text=world["title"], values=(status_text, rel, seed))
        for item in self.pack_tree.get_children():
            self.pack_tree.delete(item)
        for pack in data.get("packs", []):
            iid = f"{pack['key']}@{pack['version']}"
            self.pack_tree.insert("", "end", iid=iid, text=pack["title"], values=(pack["version"],))
        if selected_world and self.world_tree.exists(selected_world):
            self.world_tree.selection_set(selected_world)
        elif self.world_tree.get_children():
            self.world_tree.selection_set(self.world_tree.get_children()[0])
        self._refresh_release_tree()

    def _refresh_release_tree(self) -> None:
        for item in self.release_tree.get_children():
            self.release_tree.delete(item)
        selected = self.world_tree.selection()
        if not selected:
            return
        key = selected[0]
        world = next((w for w in self._registry.get("worlds", []) if w.get("key") == key), None)
        if not world:
            return
        for release in world.get("releases", []):
            seed = f"{release.get('seed') or ''}@{release.get('seed_version') or ''}".strip("@") or "—"
            label = f"r{release['number']}" + (" *" if release.get("dirty") else "")
            self.release_tree.insert(
                "", "end", iid=str(release["id"]), text=label,
                values=(release.get("status"), seed, release.get("reason") or "—"),
            )

    def _set_status(self, text: str) -> None:
        self._queue.put(("status", text)) if threading.current_thread() is not threading.main_thread() else self.status_var.set(text)

    def _log(self, text: str) -> None:
        if threading.current_thread() is not threading.main_thread():
            self._queue.put(("log", text))
            return
        self.log.configure(state="normal")
        self.log.insert("end", text.rstrip() + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    # Extend drain for status/log messages without mutating Tk from workers.
    def _drain(self) -> None:
        try:
            while True:
                kind, payload = self._queue.get_nowait()
                if kind == "registry":
                    self._apply_registry(payload)
                elif kind == "status":
                    self.status_var.set(str(payload))
                elif kind == "log":
                    self._log(str(payload))
                elif kind == "error":
                    self._log(f"ERROR: {payload}")
                    messagebox.showerror(APP_TITLE, str(payload), parent=self)
                elif kind == "done":
                    self._busy = False
                    self.progress.stop()
        except queue.Empty:
            pass
        self.after(100, self._drain)


if __name__ == "__main__":
    WorldManager().mainloop()
