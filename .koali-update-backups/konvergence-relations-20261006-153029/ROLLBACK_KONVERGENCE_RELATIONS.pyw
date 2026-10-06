# -*- coding: utf-8 -*-
from pathlib import Path
import hashlib, shutil, tkinter as tk
from tkinter import messagebox

ROOT = Path(r"C:\mycode\Konnaxion\Konnaxion_Worlds")
TARGET = ROOT / r"seed-data/universes/konvergence-koali/universe.yaml"
BACKUP = Path(r"C:\mycode\Konnaxion\Konnaxion_Worlds\.koali-update-backups\konvergence-relations-20261006-153029\seed-data\universes\konvergence-koali\universe.yaml")
EXPECTED = "12e293bdb1b07ecb0d6a971a2fa8b8b1c7b664d03a6c8b87c9022771e1726316"

def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()

app = tk.Tk()
app.withdraw()

if not TARGET.exists() or digest(TARGET) != EXPECTED:
    messagebox.showerror(
        "Rollback Konnaxion Worlds",
        "Rollback refusé : universe.yaml a été modifié après le hotfix."
    )
    raise SystemExit(2)

shutil.copy2(BACKUP, TARGET)
messagebox.showinfo("Rollback Konnaxion Worlds", "Rollback terminé.")
