"""Interaction Kernel boundary for Konnaxion.

This package intentionally contains only adapter/runtime glue. Domain ownership
stays in Konnaxion apps such as ``ethikos`` and ``worlds``.
"""

from .contracts import (
    ACCOUNTABILITY_IMPACT_PUBLISH,
    GOVERNANCE_DECISION_EXECUTE,
    IK_SPEC_VERSION,
    build_decision_execute_envelope,
    impact_publish_to_legacy_request,
)
from .fingerprint import FINGERPRINT_PROFILE, request_fingerprint

__all__ = [
    "IK_SPEC_VERSION",
    "ACCOUNTABILITY_IMPACT_PUBLISH",
    "GOVERNANCE_DECISION_EXECUTE",
    "FINGERPRINT_PROFILE",
    "build_decision_execute_envelope",
    "impact_publish_to_legacy_request",
    "request_fingerprint",
]
