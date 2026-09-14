from __future__ import annotations

from typing import Any, Mapping, Protocol


class RuntimePackActivationPort(Protocol):
    """Boundary to the real Runtime Pack activation owner.

    Standalone Konnaxion may provide a local implementation. When Konnaxion is
    hosted on kOA-Linux, the implementation MUST delegate host activation to
    kOA-Linux so there is only one authoritative activation state.
    """

    def activate(self, artifact_ref: Mapping[str, Any], *, context: Mapping[str, Any]) -> Mapping[str, Any]: ...

    def rollback(self, *, context: Mapping[str, Any]) -> Mapping[str, Any]: ...
