#!/usr/bin/env python
from __future__ import annotations

import os
from pathlib import Path

# Adjust this to your repo root
ROOT = Path(__file__).resolve().parent.parent

INCLUDE_DIRS = ["backend", "frontend"]  # directories under ROOT to process

EXCLUDE_DIR_NAMES = {
    ".git",
    ".venv",
    "venv",
    "env",
    ".mypy_cache",
    ".pytest_cache",
    "__pycache__",
    "node_modules",
    ".next",
    ".turbo",
    ".idea",
    ".vscode",
}

# Map file extension -> comment style
def make_comment_line(path: Path) -> str | None:
    rel = path.relative_to(ROOT).as_posix()
    ext = path.suffix.lower()

    # Python, shell, etc.
    if ext in {".py"}:
        return f"# FILE: {rel}\n"

    # TS/JS/React
    if ext in {".ts", ".tsx", ".js", ".jsx"}:
        return f"// FILE: {rel}\n"

    # CSS, SCSS
    if ext in {".css", ".scss"}:
        return f"/* FILE: {rel} */\n"

    # HTML / Django templates
    if ext in {".html", ".htm"}:
        return f"<!-- FILE: {rel} -->\n"

    # You can add more mappings here if needed
    return None


def should_skip_dir(dirname: str) -> bool:
    return dirname in EXCLUDE_DIR_NAMES


def file_already_has_header(lines: list[str]) -> bool:
    if not lines:
        return False
    first = lines[0].lstrip()
    return "FILE:" in first  # our own marker


def insert_header(path: Path) -> None:
    comment_line = make_comment_line(path)
    if comment_line is None:
        return

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # skip non-text files
        return

    lines = text.splitlines(keepends=True)

    if file_already_has_header(lines):
        return

    # Handle shebang in Python files: keep it at very top
    if lines and lines[0].startswith("#!") and path.suffix.lower() == ".py":
        new_lines = [lines[0], comment_line] + lines[1:]
    else:
        new_lines = [comment_line] + lines

    new_text = "".join(new_lines)
    path.write_text(new_text, encoding="utf-8")
    print(f"Updated: {path}")


def main() -> None:
    for rel_root in INCLUDE_DIRS:
        root_dir = ROOT / rel_root
        if not root_dir.exists():
            continue

        for dirpath, dirnames, filenames in os.walk(root_dir):
            # prune excluded dirs
            dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]

            for filename in filenames:
                path = Path(dirpath) / filename
                insert_header(path)


if __name__ == "__main__":
    main()
