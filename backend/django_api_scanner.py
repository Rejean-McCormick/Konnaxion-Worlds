#!/usr/bin/env python3
# FILE: backend/django_api_scanner.py
"""
django_api_scanner.py
- Run from backend root. No parameters.
- Outputs routes.json and routes.csv
- Mode A (preferred): Use Django + drf-spectacular to enumerate real paths+methods.
- Mode B (fallback): No-deps static scan of config/api_router.py and config/urls.py.

Safe to use in CI/dev. No network access.
"""

import os, sys, re, json, csv
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parent
OUT_JSON = ROOT / "routes.json"
OUT_CSV  = ROOT / "routes.csv"

# ----------------------- Mode B: static parsing -----------------------

def _read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def static_scan() -> List[Dict]:
    results: List[Dict] = []

    api_prefix = "/api/"  # from config/urls.py
    # Add well-known extra endpoints from config/urls.py
    #   /api/auth-token/, /api/schema/, /api/docs/
    results += [
        {"source":"static","path": f"{api_prefix}auth-token/", "method":"POST", "note":"DRF token"},
        {"source":"static","path": f"{api_prefix}schema/",     "method":"GET",  "note":"OpenAPI JSON"},
        {"source":"static","path": f"{api_prefix}docs/",       "method":"GET",  "note":"Swagger UI"},
    ]

    # Parse registrations in config/api_router.py
    router_py = ROOT / "config" / "api_router.py"
    text = _read(router_py)
    # router.register("segment/segment", ViewSet, basename="optional")
    pat = re.compile(
        r'router\.register\(\s*["\']([^"\']+)["\']\s*,\s*([A-Za-z_][\w\.]*)'
        r'(?:\s*,\s*basename\s*=\s*["\']([^"\']+)["\'])?\s*\)'
    )
    regs = []
    for m in pat.finditer(text):
        route = m.group(1).strip("/")
        viewset = m.group(2)
        basename = (m.group(3) or route.replace("/", "-"))
        regs.append((route, viewset, basename))

    # Default RESTful guesses for each registered resource
    for route, viewset, basename in regs:
        base = f"{api_prefix}{route}/"
        # List/Create
        results.append({"source":"static","path": base, "method":"GET",  "note": f"{basename}: list"})
        results.append({"source":"static","path": base, "method":"POST", "note": f"{basename}: create"})
        # Detail actions
        param = "pk"
        # Special-case: UserViewSet uses lookup_field='username'
        if "UserViewSet" in viewset:
            param = "username"
        detail = f"{base}{{{param}}}/"
        for m in ("GET","PUT","PATCH","DELETE"):
            results.append({"source":"static","path": detail, "method": m, "note": f"{basename}: detail"})

    # Custom @action(detail=False) 'me' on UserViewSet
    users_views = ROOT / "konnaxion" / "users" / "api" / "views.py"
    if "def me(" in _read(users_views):
        results.append({"source":"static","path": f"{api_prefix}users/me/", "method":"GET", "note":"user-me"})

    return results

# ----------------------- Mode A: Django + OpenAPI -----------------------

def dynamic_scan() -> List[Dict]:
    # Set env like manage.py, add minimal DB DSN if missing
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    os.environ.setdefault("DATABASE_URL", "sqlite:///" + str(ROOT / "db.sqlite3").replace("\\","/"))
    # Match manage.py path tweak so app imports resolve
    sys.path.insert(0, str(ROOT))
    sys.path.insert(0, str(ROOT / "konnaxion"))

    import django
    django.setup()

    from drf_spectacular.generators import SchemaGenerator
    from drf_spectacular.renderers import OpenApiJsonRenderer
    from django.urls import get_resolver, URLPattern, URLResolver

    # OpenAPI (authoritative)
    generator = SchemaGenerator()
    schema = generator.get_schema(request=None, public=True)
    rendered = OpenApiJsonRenderer().render(schema, renderer_context={})
    doc = json.loads(rendered.decode("utf-8"))

    out: Dict[tuple, Dict] = {}
    paths = doc.get("paths") or {}
    for path, ops in paths.items():
        if not isinstance(ops, dict):
            continue
        for method, op in ops.items():
            method_u = method.upper()
            if method_u not in {"GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"}:
                continue
            key = (path, method_u)
            out[key] = {
                "source":"openapi",
                "path": path,
                "method": method_u,
                "operationId": (op or {}).get("operationId",""),
                "summary": (op or {}).get("summary",""),
                "tags": ",".join((op or {}).get("tags",[]) or []),
            }

    # URL resolver pass to catch extras if they’re omitted in schema
    def walk(resolver):
        for p in resolver.url_patterns:
            if isinstance(p, URLResolver):
                for q in walk(p):
                    yield q
            elif isinstance(p, URLPattern):
                s = str(p.pattern)
                if not s.startswith("/"):
                    s = "/" + s
                yield (s, getattr(p.callback, "actions", None) or {})

    for s, acts in walk(get_resolver()):
        if not s.startswith("/api/"):
            continue
        methods = sorted([m.upper() for m in acts.keys()]) if acts else ["GET"]
        for m in methods:
            key = (s, m)
            out.setdefault(key, {
                "source":"urls",
                "path": s,
                "method": m,
                "operationId": "",
                "summary": "",
                "tags": "",
            })

    return sorted(out.values(), key=lambda r: (r["path"], r["method"]))

# ----------------------- main -----------------------

def main():
    try:
        results = dynamic_scan()
        mode = "dynamic"
    except Exception as e:
        # Fall back to static parsing
        results = static_scan()
        mode = f"static (fallback due to: {type(e).__name__}: {e})"

    with OUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["path","method","source","operationId","tags","summary","note"])
        for r in results:
            w.writerow([
                r.get("path",""),
                r.get("method",""),
                r.get("source",""),
                r.get("operationId",""),
                r.get("tags",""),
                r.get("summary",""),
                r.get("note",""),
            ])

    print(f"{mode}: wrote {len(results)} rows to {OUT_JSON.name} and {OUT_CSV.name}")

if __name__ == "__main__":
    main()
