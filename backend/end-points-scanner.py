#!/usr/bin/env python3
# FILE: backend/end-points-scanner.py
"""
next_auto_scanner.py
Run with no parameters from the Next.js project root (the backend folder).
Outputs:
  - routes.json : structured list of discovered routes
  - routes.csv  : CSV summary

What it finds:
  - App Router: page.* and route.* files under ./app
  - Pages Router: files under ./pages and pages/api/**
  - Next build manifests under .next/server when present
Behavior:
  - Purely local. No network calls. Safe to run in CI/dev.
"""

import json, csv, re, sys
from pathlib import Path

ROOT = Path.cwd()
OUT_JSON = ROOT / "routes.json"
OUT_CSV = ROOT / "routes.csv"
HTTP_METHODS = ["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"]

# ------- utilities -------

def read_text(p: Path):
    try:
        return p.read_text(encoding="utf8", errors="ignore")
    except Exception:
        return ""

def detect_methods(src: str):
    found = []
    for m in HTTP_METHODS:
        # catch forms: export const GET =, export async function GET, function GET
        if re.search(rf"export\s+(?:const\s+{m}\b|async\s+function\s+{m}\b|function\s+{m}\b)", src):
            found.append(m)
    return found

def seg_to_route(seg: str):
    if re.match(r"^\[\[\.{3}.+\]\]$", seg): return f"/{seg}"
    if re.match(r"^\[\.{3}.+\]$", seg): return f"/{seg}"
    if re.match(r"^\[.+\]$", seg): return f"/{seg}"
    if seg in ("(group)",) or seg.startswith("(") or seg.startswith("@") or seg.startswith("__"): return ""
    return f"/{seg}"

def dir_to_url(dir_path: Path, base: Path):
    try:
        rel = dir_path.relative_to(base).parts
    except Exception:
        rel = dir_path.parts
    url = "".join(seg_to_route(s) for s in rel)
    return url or "/"

# ------- scanning functions -------

def walk_files(base: Path):
    if not base.exists(): 
        return
    for p in base.rglob("*"):
        if p.is_file():
            # skip common noise
            if any(x in p.parts for x in ("node_modules", ".next", ".git", ".turbo")):
                continue
            yield p

def scan_app_router(app_dir: Path):
    out = []
    for f in walk_files(app_dir):
        name = f.name
        if re.match(r"^page\.(js|jsx|ts|tsx|mdx)$", name):
            url = dir_to_url(f.parent, app_dir)
            out.append({"source":"filesystem","router":"app","type":"page","url":url,"file":str(f)})
        if re.match(r"^route\.(js|ts|jsx|tsx)$", name):
            src = read_text(f)
            methods = detect_methods(src) or ["UNKNOWN"]
            url = dir_to_url(f.parent, app_dir)
            out.append({"source":"filesystem","router":"app","type":"api","url":url,"methods":methods,"file":str(f)})
        if re.match(r"^(sitemap|robots|manifest)\.(js|ts|json)$", name):
            url = dir_to_url(f.parent, app_dir)
            out.append({"source":"filesystem","router":"app","type":"meta","url":f"{url}/{Path(name).stem}","file":str(f)})
    return out

def scan_pages_router(pages_dir: Path):
    out = []
    for f in walk_files(pages_dir):
        try:
            rel = f.relative_to(pages_dir)
        except Exception:
            rel = f
        parts = rel.parts if isinstance(rel, Path) else rel
        # API routes under pages/api
        if parts and parts[0] == "api":
            url = "/" + str(rel).replace("\\","/").rsplit(".",1)[0]
            out.append({"source":"filesystem","router":"pages","type":"api","url":url,"methods":["*"],"file":str(f)})
        elif re.search(r"\.(js|jsx|ts|tsx|mdx)$", f.name):
            if any(k in f.name for k in ("_app.","_document.","_error.")):
                continue
            url = "/" + str(rel).replace("\\","/").replace("index.","").rsplit(".",1)[0]
            url = url.rstrip("/")
            if url == "":
                url = "/"
            out.append({"source":"filesystem","router":"pages","type":"page","url":url,"file":str(f)})
    return out

def parse_manifest(manifest_path: Path):
    try:
        j = json.loads(manifest_path.read_text(encoding="utf8"))
    except Exception:
        return []
    out = []
    # pages-manifest.json -> mapping of route -> file
    if manifest_path.name.endswith("pages-manifest.json"):
        for route, info in j.items():
            out.append({"source":"manifest","manifest":manifest_path.name,"router":"pages","type":"page_or_api","url":route,"detail":info})
    # app-paths-manifest.json -> app router paths
    elif manifest_path.name.endswith("app-paths-manifest.json"):
        for route, info in j.get("paths", {}).items() if isinstance(j, dict) else []:
            out.append({"source":"manifest","manifest":manifest_path.name,"router":"app","type":"page","url":route,"detail":j.get("paths", {}).get(route)})
    else:
        # generic dump
        out.append({"source":"manifest","manifest":manifest_path.name,"content_preview":str(list(j.keys())[:50])})
    return out

def scan_manifests(next_dir: Path):
    out = []
    server = next_dir / "server"
    if not server.exists():
        return out
    for name in ("pages-manifest.json","app-paths-manifest.json","routes-manifest.json","prerender-manifest.json"):
        p = server / name
        if p.exists():
            out += parse_manifest(p)
    return out

# ------- main -------

def main():
    results = []
    app_dir = ROOT / "app"
    pages_dir = ROOT / "pages"
    next_dir = ROOT / ".next"

    results += scan_scoped(app_dir, scan_app_router) if app_dir.exists() else []
    results += scan_scoped(pages_dir, scan_pages_router) if pages_dir.exists() else []
    results += scan_manifests(next_dir) if next_dir.exists() else []

    # canonicalize simple entries that may have duplicate urls
    # keep as-is for fidelity; write files
    try:
        with OUT_JSON.open("w", encoding="utf8") as fh:
            json.dump(results, fh, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Failed writing JSON:", e, file=sys.stderr)
        sys.exit(2)

    # write CSV summary
    try:
        with OUT_CSV.open("w", encoding="utf8", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerow(["source","router","type","url","methods","file","manifest","detail_preview"])
            for r in results:
                writer.writerow([
                    r.get("source",""),
                    r.get("router",""),
                    r.get("type",""),
                    r.get("url",""),
                    ",".join(r.get("methods",[])) if isinstance(r.get("methods"), list) else r.get("methods",""),
                    r.get("file",""),
                    r.get("manifest",""),
                    (str(r.get("detail"))[:200] if "detail" in r else "")
                ])
    except Exception as e:
        print("Failed writing CSV:", e, file=sys.stderr)
        sys.exit(3)

    print(f"Discovered {len(results)} entries. Wrote {OUT_JSON.name} and {OUT_CSV.name}")

# small helper wrapper to tolerate missing dirs
def scan_scoped(path, fn):
    try:
        return fn(path)
    except Exception:
        return []

if __name__ == "__main__":
    main()
