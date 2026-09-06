"""
Code metrics analyzer.

Inspired by the `scanAndMergeCodeForAI.py` helper script, this tool walks a project
tree and computes simple code metrics for each file and for the project as a whole.

Per-file metrics:
  - language (based on extension)
  - total lines
  - non-blank lines
  - comment lines (rough heuristic)
  - code lines   = non-blank - comment
  - TODO / FIXME count
  - for Python files:
      - number of functions
      - number of classes
      - average function length (in lines)
      - approximate cyclomatic complexity per function and per file

Global metrics:
  - totals and per-language aggregates
  - top N files by lines of code
  - top N Python files by complexity

Usage:
    python analyze_code_metrics.py               # analyze parent directory of this script
    python analyze_code_metrics.py .             # analyze current directory
    python analyze_code_metrics.py .. --tsv report.tsv  # + export per-file metrics
"""

import os
import re
import ast
import argparse
from dataclasses import dataclass, asdict
from collections import Counter
from typing import Dict, List, Optional, Iterable, Tuple


# --- configuration ---------------------------------------------------------

# Root is automatically resolved from the script location (same style as scanAndMergeCodeForAI)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Directories to ignore when walking the project tree
EXCLUDE_DIRS = {
    ".git",
    ".idea",
    ".vscode",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "build",
    "site",
    "docs/_build",
}

# File extensions we consider as "code" and "config"
CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".go",
    ".rs",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".php",
    ".rb",
    ".swift",
    ".kt",
}

CONFIG_EXTENSIONS = {
    ".yaml",
    ".yml",
    ".toml",
    ".json",
    ".ini",
    ".cfg",
    ".env",
}

DOC_EXTENSIONS = {
    ".md",
    ".rst",
    ".txt",
}


def guess_language(ext: str) -> str:
    ext = ext.lower()
    mapping = {
        ".py": "Python",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".java": "Java",
        ".go": "Go",
        ".rs": "Rust",
        ".c": "C",
        ".cc": "C++",
        ".cpp": "C++",
        ".h": "C/C++ header",
        ".hpp": "C++ header",
        ".cs": "C#",
        ".php": "PHP",
        ".rb": "Ruby",
        ".swift": "Swift",
        ".kt": "Kotlin",
        ".yaml": "YAML",
        ".yml": "YAML",
        ".toml": "TOML",
        ".json": "JSON",
        ".md": "Markdown",
        ".rst": "reStructuredText",
        ".ini": "INI",
        ".cfg": "Config",
        ".env": "Env file",
        ".txt": "Text",
    }
    return mapping.get(ext, ext or "<no ext>")


# --- basic metrics ---------------------------------------------------------


@dataclass
class FileMetrics:
    path: str
    relpath: str
    extension: str
    language: str

    total_lines: int = 0
    nonblank_lines: int = 0
    comment_lines: int = 0
    code_lines: int = 0
    todo_count: int = 0

    is_code: bool = False
    is_config: bool = False
    is_docs: bool = False

    # Python-specific metrics
    py_function_count: int = 0
    py_class_count: int = 0
    py_avg_function_length: float = 0.0
    py_file_complexity: int = 0  # sum of function complexities
    py_max_function_complexity: int = 0


def _classify_file(path: str) -> Tuple[bool, bool, bool]:
    ext = os.path.splitext(path)[1].lower()
    is_code = ext in CODE_EXTENSIONS
    is_config = ext in CONFIG_EXTENSIONS
    is_docs = ext in DOC_EXTENSIONS
    return is_code, is_config, is_docs


def _count_lines(text: str, extension: str) -> Tuple[int, int, int, int]:
    """
    Roughly count total / nonblank / comment / TODO lines.

    Comment detection is heuristic:
      - For Python and shell-like: lines starting with # after stripping
      - For YAML: lines starting with #
      - For C-like: lines starting with //, /*, * or */
    """
    total = 0
    nonblank = 0
    comment = 0
    todos = 0

    ext = extension.lower()
    for raw_line in text.splitlines():
        total += 1
        line = raw_line.strip()
        if not line:
            continue
        nonblank += 1

        # TODO / FIXME markers anywhere in the line
        if "TODO" in line or "FIXME" in line:
            todos += 1

        is_comment = False
        if ext in {".py", ".sh", ".bash", ".ps1"}:
            if line.startswith("#"):
                is_comment = True
        elif ext in {".yaml", ".yml"}:
            if line.startswith("#"):
                is_comment = True
        else:
            if (
                line.startswith("//")
                or line.startswith("/*")
                or line.startswith("*")
                or line.startswith("*/")
            ):
                is_comment = True

        if is_comment:
            comment += 1

    code = max(nonblank - comment, 0)
    return total, nonblank, comment, todos


# --- Python AST-based metrics ---------------------------------------------


class ComplexityVisitor(ast.NodeVisitor):
    """
    Very small, dependency-free approximation of cyclomatic complexity.

    Complexity starts at 1 and is incremented for each branching node.
    """

    def __init__(self):
        self.complexity = 1

    def generic_visit(self, node):
        branching_nodes = (
            ast.If,
            ast.For,
            ast.AsyncFor,
            ast.While,
            ast.With,
            ast.AsyncWith,
            ast.Try,
            ast.BoolOp,
            ast.IfExp,
        )
        if isinstance(node, branching_nodes):
            self.complexity += 1
        elif isinstance(node, (ast.comprehension,)):
            self.complexity += 1
        super().generic_visit(node)


def _function_span(node: ast.AST) -> Tuple[int, int]:
    """
    Best-effort line span for a function or class using lineno / end_lineno.
    """
    start = getattr(node, "lineno", 0)
    end = getattr(node, "end_lineno", None)
    if end is None:
        end = start
        for child in ast.walk(node):
            ln = getattr(child, "lineno", None)
            if ln is not None and ln > end:
                end = ln
    return start, max(end, start)


def analyze_python(text: str) -> Tuple[int, int, float, int, int]:
    """
    Return (func_count, class_count, avg_func_len, total_complexity, max_func_complexity).
    """
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return 0, 0, 0.0, 0, 0

    func_lengths: List[int] = []
    func_complexities: List[int] = []
    func_count = 0
    class_count = 0

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            func_count += 1
            start, end = _function_span(node)
            func_lengths.append(max(end - start + 1, 1))

            cv = ComplexityVisitor()
            cv.visit(node)
            func_complexities.append(cv.complexity)
        elif isinstance(node, ast.ClassDef):
            class_count += 1

    avg_len = float(sum(func_lengths)) / func_count if func_count else 0.0
    total_complexity = sum(func_complexities)
    max_complexity = max(func_complexities) if func_complexities else 0
    return func_count, class_count, avg_len, total_complexity, max_complexity


# --- project scanning ------------------------------------------------------


def iter_project_files(root: str) -> Iterable[str]:
    for dirpath, dirnames, filenames in os.walk(root):
        # prune excluded directories
        dirnames[:] = [
            d for d in dirnames
            if d not in EXCLUDE_DIRS and not d.startswith(".")
        ]
        for name in filenames:
            if name.startswith("."):
                continue
            full = os.path.join(dirpath, name)
            yield full


def collect_file_metrics(root: str) -> List[FileMetrics]:
    results: List[FileMetrics] = []

    for path in iter_project_files(root):
        rel = os.path.relpath(path, root)
        ext = os.path.splitext(path)[1].lower()
        language = guess_language(ext)

        is_code, is_config, is_docs = _classify_file(path)

        try:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        except UnicodeDecodeError:
            # skip binary or non-utf8 files
            continue
        except OSError:
            continue

        total, nonblank, comment, todos = _count_lines(text, ext)

        fm = FileMetrics(
            path=path,
            relpath=rel,
            extension=ext,
            language=language,
            total_lines=total,
            nonblank_lines=nonblank,
            comment_lines=comment,
            code_lines=max(nonblank - comment, 0),
            todo_count=todos,
            is_code=is_code,
            is_config=is_config,
            is_docs=is_docs,
        )

        if ext == ".py":
            (
                fm.py_function_count,
                fm.py_class_count,
                fm.py_avg_function_length,
                fm.py_file_complexity,
                fm.py_max_function_complexity,
            ) = analyze_python(text)

        results.append(fm)

    return results


# --- aggregation / reporting ----------------------------------------------


def summarize(metrics: List[FileMetrics]) -> None:
    if not metrics:
        print("No files analyzed.")
        return

    total_files = len(metrics)
    total_lines = sum(m.total_lines for m in metrics)
    total_code = sum(m.code_lines for m in metrics)
    total_comments = sum(m.comment_lines for m in metrics)
    total_todos = sum(m.todo_count for m in metrics)

    code_files = [m for m in metrics if m.is_code]
    config_files = [m for m in metrics if m.is_config]
    docs_files = [m for m in metrics if m.is_docs]

    print("=== Project metrics ===")
    print(f"Files analyzed         : {total_files}")
    print(f"  Code files           : {len(code_files)}")
    print(f"  Config files         : {len(config_files)}")
    print(f"  Docs / text files    : {len(docs_files)}")
    print()
    print(f"Total lines            : {total_lines}")
    print(f"Non-blank lines        : {sum(m.nonblank_lines for m in metrics)}")
    print(f"Comment lines (approx) : {total_comments}")
    print(f"Code lines (approx)    : {total_code}")
    print(f"TODO / FIXME lines     : {total_todos}")
    print()

    # per-language breakdown for code files only
    lang_counter = Counter()
    lang_loc = Counter()
    for m in metrics:
        if not m.is_code:
            continue
        lang_counter[m.language] += 1
        lang_loc[m.language] += m.code_lines

    print("=== Per-language breakdown (code files) ===")
    for lang, count in lang_counter.most_common():
        loc = lang_loc[lang]
        print(f"{lang:20s}  files: {count:4d}   code LOC: {loc:7d}")
    print()

    # Python-specific summary
    py_files = [m for m in metrics if m.extension == ".py"]
    if py_files:
        total_py_funcs = sum(m.py_function_count for m in py_files)
        total_py_classes = sum(m.py_class_count for m in py_files)
        total_py_complexity = sum(m.py_file_complexity for m in py_files)
        max_file_complexity = max(m.py_file_complexity for m in py_files)
        print("=== Python-specific metrics ===")
        print(f"Python files           : {len(py_files)}")
        print(f"Total functions        : {total_py_funcs}")
        print(f"Total classes          : {total_py_classes}")
        print(f"Total complexity       : {total_py_complexity}")
        print(f"Max file complexity    : {max_file_complexity}")
        print()

    # Top 10 largest files by code lines
    print("=== Top 10 files by code LOC ===")
    for m in sorted(metrics, key=lambda m: m.code_lines, reverse=True)[:10]:
        print(f"{m.code_lines:7d}  {m.relpath}")
    print()

    # For Python: top 10 most complex files
    if py_files:
        print("=== Top 10 Python files by complexity ===")
        for m in sorted(py_files, key=lambda m: m.py_file_complexity, reverse=True)[:10]:
            print(
                f"CC={m.py_file_complexity:4d}  funcs={m.py_function_count:4d}  "
                f"max_func_CC={m.py_max_function_complexity:3d}  {m.relpath}"
            )
        print()


def export_tsv(metrics: List[FileMetrics], path: str) -> None:
    """
    Save a detailed per-file report as TSV for further analysis (Excel, etc.).
    """
    import csv

    fieldnames = list(asdict(metrics[0]).keys())
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, dialect="excel-tab")
        writer.writeheader()
        for m in metrics:
            writer.writerow(asdict(m))

    print(f"Detailed per-file metrics written to {path}")


# --- CLI -------------------------------------------------------------------


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        description="Analyze simple code metrics for a project directory."
    )
    parser.add_argument(
        "root",
        nargs="?",
        default=ROOT,
        help=f"Project root directory (default: {ROOT})",
    )
    parser.add_argument(
        "--tsv",
        metavar="PATH",
        help="Optional path to export detailed per-file TSV report.",
    )

    args = parser.parse_args(argv)

    root = os.path.abspath(args.root)
    print(f"Project root: {root}")
    print("Scanning files for metrics…")

    metrics = collect_file_metrics(root)
    summarize(metrics)

    if args.tsv:
        export_tsv(metrics, os.path.abspath(args.tsv))


if __name__ == "__main__":
    main()
