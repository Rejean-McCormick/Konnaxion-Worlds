#!/usr/bin/env python3
# FILE: frontend/concat_frontend.py
# -*- coding: utf-8 -*-
"""
concat_frontend.py

Concatène les fichiers texte du frontend en sorties .txt par domaine, avec TOC en tête :
  - frontend_core_<ts>.txt
  - frontend_app_<ts>.txt
  - frontend_components_<ts>.txt
  - frontend_modules_<ts>.txt
  - frontend_shared_<ts>.txt
  - frontend_services_<ts>.txt
  - frontend_routes_<ts>.txt
  - frontend_hooks_context_<ts>.txt
  - frontend_theme_styles_<ts>.txt
  - frontend_tests_e2e_<ts>.txt
  - frontend_types_<ts>.txt
  - frontend_misc_<ts>.txt
  - frontend_small_<ts>.txt   <= nouveaux: fusion des petits groupes (≤ seuil)

Par défaut : multi-sorties. Avec options (--out/--include/--exclude/--ext) : mono-fichier.
"""

from __future__ import annotations
import argparse
import fnmatch
import os
from pathlib import Path
from typing import Set, List, Optional, Dict, Tuple
from datetime import datetime

# ====== Extensions et noms pris en charge ======
DEFAULT_EXTS: Set[str] = {
    ".txt", ".tx", ".md", ".markdown",
    ".json", ".yaml", ".yml", ".xml", ".toml", ".ini", ".cfg", ".conf", ".properties",
    ".html", ".htm", ".css", ".scss", ".less",
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".py", ".pyi",
    ".java", ".kt", ".swift", ".rb", ".php", ".go", ".rs",
    ".c", ".h", ".cpp", ".cc", ".hpp", ".cs",
    ".sql",
    ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat",
    ".graphql", ".gql",
    ".gradle",
    ".pl", ".lua", ".r",
    ".env",
    ".svg",
    ".ndjson",
}
NAMES_WITHOUT_EXT: Set[str] = {
    "Dockerfile", "Makefile", "CMakeLists.txt",
    ".gitignore", ".gitattributes", ".editorconfig",
    ".all-contributorsrc", ".prettierignore", ".releaserc", "LICENSE",
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "tsconfig.json", "eslint.config.js", "eslint.config.mjs", ".eslintrc",
    ".prettierrc", "prettier.config.js", "postcss.config.js",
    "routes.json",
}

# ====== Exclusions ======
DEFAULT_EXCLUDE_DIRS: Set[str] = {
    ".git", ".hg", ".svn",
    "node_modules", ".next",
    "dist", "build", "out", "coverage", ".cache",
    ".venv", "venv", "__pycache__",
    "target", "bin", "obj",
}
BINARY_EXTS: Set[str] = {
    ".zip", ".gz", ".bz2", ".xz", ".7z", ".rar",
    ".png", ".jpg", ".jpeg", ".webp", ".ico", ".gif", ".pdf", ".ttf", ".woff", ".woff2"
}
OUT_EXCLUDES: List[str] = [
    "Code_*.txt",
    "frontend_*_*.txt",
    "app/Code_*.txt",
    "components/Code_*.txt",
    "modules/Code_*.txt",
    "src/Code_*.txt",
]
TEST_DIRS = ["tests/**", "_e2e/**"]

# ====== CLI ======
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Concatène les fichiers texte du frontend.")
    p.add_argument("-o", "--out", default=None, help="Fichier de sortie (mode mono-fichier)")
    p.add_argument("--ext", help="Extensions additionnelles ou personnalisées, CSV")
    p.add_argument("--include", action="append", default=[], help="Glob d'inclusion relatif (répétable)")
    p.add_argument("--exclude", action="append", default=[], help="Glob d'exclusion relatif (répétable)")
    p.add_argument("--max-size", type=int, default=2_000_000, help="Taille max par fichier en octets")
    p.add_argument("--no-headers", action="store_true", help="Supprime les en-têtes BEGIN/END par fichier")
    p.add_argument("--merge-small", type=int, default=4,
                   help="Seuil de fusion des petits groupes (<= N fichiers). 0 pour désactiver.")
    return p.parse_args()

def normalize_exts(exts_csv: Optional[str]) -> Set[str]:
    if not exts_csv:
        return set(DEFAULT_EXTS)
    parts = [e.strip().lower() for e in exts_csv.split(",") if e.strip()]
    out = set()
    for e in parts:
        if not e.startswith("."):
            e = "." + e
        out.add(e)
    return out

# ====== Heuristiques texte ======
def is_probably_text(sample: bytes) -> bool:
    if not sample:
        return True
    if b"\x00" in sample:
        return False
    try:
        sample.decode("utf-8")
        return True
    except UnicodeDecodeError:
        pass
    ctrl = sum(1 for b in sample if b < 32 and b not in (9, 10, 13))
    return (ctrl / max(1, len(sample))) < 0.01

def pick_encoding(path: Path) -> Optional[str]:
    try:
        with path.open("rb") as f:
            sample = f.read(32768)
    except Exception:
        return None
    if not is_probably_text(sample):
        return None
    for enc in ("utf-8", "utf-8-sig", "utf-16", "cp1252", "latin-1"):
        try:
            sample.decode(enc)
            return enc
        except UnicodeDecodeError:
            continue
    return "latin-1"

# ====== Utilitaires ======
def relpath(base: Path, p: Path) -> str:
    try:
        r = p.relative_to(base)
    except Exception:
        r = p
    return str(r).replace("\\", "/")

def should_include_file(base: Path, file_path: Path, allowed_exts: Set[str],
                        include_globs: List[str], exclude_globs: List[str],
                        max_size: int, out_path: Path) -> bool:
    if not file_path.is_file():
        return False
    if file_path.suffix.lower() in BINARY_EXTS:
        return False
    if file_path == out_path:
        return False
    try:
        if file_path.stat().st_size > max_size:
            return False
    except Exception:
        return False

    rel = relpath(base, file_path)

    for pat in exclude_globs:
        if fnmatch.fnmatch(rel, pat):
            return False

    if include_globs:
        ok = any(fnmatch.fnmatch(rel, pat) for pat in include_globs)
        if not ok:
            return False

    if file_path.suffix.lower() in allowed_exts or file_path.name in NAMES_WITHOUT_EXT:
        return True

    enc = pick_encoding(file_path)
    return enc is not None

def walk_select(base_dir: Path, allowed_exts: Set[str], include_globs: List[str],
                exclude_globs: List[str], max_size: int, out_path: Path) -> List[Path]:
    selected: List[Path] = []
    for root, dirs, files in os.walk(base_dir, followlinks=False):
        dirs[:] = [d for d in dirs if d not in DEFAULT_EXCLUDE_DIRS]
        root_path = Path(root)
        for name in files:
            fp = root_path / name
            try:
                if fp.resolve() == out_path.resolve():
                    continue
            except Exception:
                pass
            if should_include_file(base_dir, fp, allowed_exts, include_globs, exclude_globs, max_size, out_path):
                selected.append(fp)
    selected.sort(key=lambda p: relpath(base_dir, p).lower())
    return selected

# ====== Écriture avec TOC ======
def write_concat(base_dir: Path, files: List[Path], out_path: Path, no_headers: bool) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    abs_paths: List[str] = []
    for p in files:
        try:
            abs_paths.append(str(p.resolve()))
        except Exception:
            abs_paths.append(str(p))

    count = 0
    with out_path.open("w", encoding="utf-8", newline="\n") as out:
        out.write(f"===== TOC ({len(files)} fichiers) =====\n")
        for i, ap in enumerate(abs_paths, 1):
            out.write(f"{i}. {ap}\n")
        out.write("===== END TOC =====\n\n")

        for p in files:
            enc = pick_encoding(p) or "utf-8"
            if not no_headers:
                out.write(f"\n===== BEGIN {relpath(base_dir, p)} =====\n")
            try:
                with p.open("r", encoding=enc, errors="strict") as f:
                    for line in f:
                        out.write(line)
            except UnicodeDecodeError:
                with p.open("r", encoding="latin-1", errors="replace") as f:
                    for line in f:
                        out.write(line)
            if not no_headers:
                out.write(f"\n===== END {relpath(base_dir, p)} =====\n")
            out.write("\n")
            count += 1
    return count

# ====== Groupes adaptés à l’arborescence ======
GROUPS: Dict[str, Tuple[List[str], List[str]]] = {
    "frontend_core": (
        [
            "README.*", "LICENSE",
            "package.json", "pnpm-lock.yaml",
            "next.config.ts", "tsconfig.json",
            "eslint.config.*", ".eslintrc*", ".prettier*", "prettier.config.js", "postcss.config.js",
            "env.mjs", "instrumentation.ts", "renovate.json", ".all-contributorsrc", ".releaserc",
            "routes.json",
            "jest.config.js", "jest.*.js",
            "playwright.*.ts",
            "report-bundle-size.js",
            "scripts/*.mjs",
            "scripts/codemods/*.js",
            "api.ts",
            "next-env.d.ts",
            "reset.d.ts",
            "scanpath*.py",
        ],
        OUT_EXCLUDES + TEST_DIRS
    ),
    "frontend_app": (["app/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_components": (["components/**", "src/components/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_modules": (["modules/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_shared": (["shared/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_services": (["services/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_routes": (
        [
            "routes/**",
            "routes.json",
            "routes-tests.json",
            "scripts/find-routes.mjs",
            "scripts/find-routes-tests.mjs",
        ],
        OUT_EXCLUDES + TEST_DIRS
    ),
    "frontend_hooks_context": (["hooks/**", "context/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_theme_styles": (["theme/**", "src/theme/**", "styles/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_tests_e2e": (
        [
            "tests/**",
            "_e2e/**",
            "playwright-report/*.html",
            "playwright-report/*.ndjson",
            "playwright-report/index-test/*.html",
            "playwright-report/index-test/*.ndjson",
            "playwright-smokeREADME.*",
        ],
        OUT_EXCLUDES
    ),
    "frontend_types": (["types/**", "src/types/**"], OUT_EXCLUDES + TEST_DIRS),
    "frontend_misc": (
        [
            "assets/**/*.svg",
            "public/**/*.svg",
            "graph.svg",
            "use_client_report.csv",
            "use_client_report.json",
            "ct/**",
        ],
        OUT_EXCLUDES + TEST_DIRS
    ),
}

# ====== Modes d’exécution ======
def run_multi_outputs(base_dir: Path, max_size: int, no_headers: bool, merge_small: int) -> None:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    allowed_exts = set(DEFAULT_EXTS)

    # 1) collecte de tous les fichiers par groupe
    group_files: Dict[str, List[Path]] = {}
    for group_name, (incl, excl) in GROUPS.items():
        out_path = base_dir / f"{group_name}_{stamp}.txt"
        files = walk_select(base_dir, allowed_exts, incl, excl, max_size, out_path)
        group_files[group_name] = files

    # 2) détermine les petits groupes à fusionner
    small_groups = []
    if merge_small and merge_small > 0:
        for g, files in group_files.items():
            if len(files) <= merge_small:
                small_groups.append(g)

    # 3) écrit les gros groupes individuellement
    for g, files in group_files.items():
        if g in small_groups:
            continue
        out_path = base_dir / f"{g}_{stamp}.txt"
        n = write_concat(base_dir, files, out_path, no_headers)
        print(f"{g}: {n} fichier(s) -> {out_path.name}")

    # 4) fusionne et écrit le groupe small unique
    if small_groups:
        merged: List[Path] = []
        for g in small_groups:
            merged.extend(group_files[g])
        # trie par chemin relatif pour une sortie stable
        merged.sort(key=lambda p: relpath(base_dir, p).lower())
        out_small = base_dir / f"frontend_small_{stamp}.txt"
        n = write_concat(base_dir, merged, out_small, no_headers)
        # Logs
        small_list = ", ".join(small_groups)
        print(f"frontend_small (fusion de: {small_list}): {n} fichier(s) -> {out_small.name}")

def run_single_output(base_dir: Path, args: argparse.Namespace) -> None:
    if args.out:
        out_path = (base_dir / args.out).resolve()
    else:
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = (base_dir / f"Code_{base_dir.name}_{stamp}.txt").resolve()

    allowed_exts = normalize_exts(args.ext)
    include_globs = list(args.include or [])
    exclude_globs = list(args.exclude or []) + list(OUT_EXCLUDES)

    files = walk_select(base_dir, allowed_exts, include_globs, exclude_globs, args.max_size, out_path)
    n = write_concat(base_dir, files, out_path, args.no_headers)
    print(f"{n} fichier(s) concaténé(s) -> {out_path.name}")

def main() -> None:
    args = parse_args()
    base_dir = Path(__file__).resolve().parent
    if not any([args.out, args.ext, args.include, args.exclude]):
        run_multi_outputs(base_dir, args.max_size, args.no_headers, args.merge_small)
    else:
        run_single_output(base_dir, args)

if __name__ == "__main__":
    main()
