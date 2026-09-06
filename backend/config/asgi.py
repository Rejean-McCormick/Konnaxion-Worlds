# FILE: backend/config/asgi.py
# config/asgi.py

"""
ASGI config for Konnaxion project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/dev/howto/deployment/asgi/
"""

import os
import sys
from pathlib import Path

from django.core.asgi import get_asgi_application

# This allows easy placement of apps within the interior
# konnaxion directory.
BASE_DIR = Path(__file__).resolve(strict=True).parent.parent
sys.path.append(str(BASE_DIR / "konnaxion"))

# If DJANGO_SETTINGS_MODULE is unset, default to the local settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

# This application object is used by any ASGI server configured to use this file.
django_application = get_asgi_application()

# Import websocket application here, so apps from django_application are loaded first
from config.websocket import websocket_application  # noqa: E402


async def lifespan_application(scope, receive, send):
    """
    Minimal ASGI lifespan protocol implementation.

    Some ASGI servers (e.g. uvicorn, daphne) send a 'lifespan' scope for
    startup/shutdown events. We acknowledge these events so the server
    considers the application started successfully.
    """
    while True:
        message = await receive()
        message_type = message.get("type")

        if message_type == "lifespan.startup":
            await send({"type": "lifespan.startup.complete"})
        elif message_type == "lifespan.shutdown":
            await send({"type": "lifespan.shutdown.complete"})
            return


async def application(scope, receive, send):
    scope_type = scope["type"]

    if scope_type == "http":
        await django_application(scope, receive, send)
    elif scope_type == "websocket":
        await websocket_application(scope, receive, send)
    elif scope_type == "lifespan":
        await lifespan_application(scope, receive, send)
    else:
        msg = f"Unsupported ASGI scope type {scope_type!r}"
        raise NotImplementedError(msg)
