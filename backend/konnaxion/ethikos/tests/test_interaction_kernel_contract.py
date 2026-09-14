from __future__ import annotations

import unittest

from konnaxion.ethikos.orgo_bridge_contract import validate_publish_request
from konnaxion.integrations.interaction_kernel.contracts import (
    build_decision_execute_envelope,
    impact_publish_to_legacy_request,
)
from konnaxion.integrations.interaction_kernel.fingerprint import request_fingerprint


class InteractionKernelContractTests(unittest.TestCase):
    def test_impact_profile_maps_to_existing_bridge_contract(self):
        envelope = {
            "specversion": "ik/1.1",
            "id": "01J00000000000000000000002",
            "class": "command",
            "time": "2026-09-14T12:01:00Z",
            "profile": {"id": "accountability.impact.publish", "version": "1.0.0"},
            "source": {
                "system": "orgo",
                "organization": "60f51ca2-c845-45aa-bc7e-2c62e53dfc5a",
            },
            "target": {"system": "konnaxion", "world": "main"},
            "subject": {"type": "case", "id": "fc305c81-afad-4b3a-8adb-b3668ad70d72"},
            "idempotency_key": "impact:day30:v1",
            "correlation_id": "corr.uckk.A014.D009",
            "data": {
                "artifact_type": "impact_update",
                "external_reference": "impact:UCKK-A014:day30:v1",
                "checkpoint": "day_30",
                "summary": {"workload_imbalance_reports": 6, "policy_changes": 0},
            },
            "artifact_refs": [],
        }

        legacy = impact_publish_to_legacy_request(envelope)
        parsed = validate_publish_request(
            legacy,
            idempotency_header=envelope["idempotency_key"],
            correlation_header=envelope["correlation_id"],
        )

        self.assertEqual(parsed["operation"], "publish")
        self.assertEqual(parsed["artifact_type"], "impact_update")
        self.assertEqual(parsed["external_reference"], "impact:UCKK-A014:day30:v1")

    def test_fingerprint_matches_ik_cross_language_vector(self):
        envelope = {
            "specversion": "ik/1.1",
            "id": "01J00000000000000000000002",
            "class": "command",
            "time": "2026-09-14T12:01:00Z",
            "profile": {"id": "accountability.impact.publish", "version": "1.0.0"},
            "source": {
                "system": "orgo",
                "organization": "60f51ca2-c845-45aa-bc7e-2c62e53dfc5a",
            },
            "target": {
                "system": "konnaxion",
                "organization": "60f51ca2-c845-45aa-bc7e-2c62e53dfc5a",
                "world": "main",
            },
            "subject": {"type": "case", "id": "fc305c81-afad-4b3a-8adb-b3668ad70d72"},
            "idempotency_key": "impact:day30:v1",
            "correlation_id": "corr.uckk.A014.D009",
            "data": {
                "artifact_type": "impact_update",
                "external_reference": "impact:UCKK-A014:day30:v1",
                "checkpoint": "day_30",
                "summary": {"workload_imbalance_reports": 6, "policy_changes": 0},
            },
            "artifact_refs": [],
        }
        self.assertEqual(
            request_fingerprint(envelope),
            "sha256:babfee61ff2e7c3a5d8b85263c6f675f364eaf4b16b3504f094a58984c7078b1",
        )

    def test_decision_execute_envelope_separates_publication_from_execution(self):
        envelope = build_decision_execute_envelope(
            decision_id="5201",
            revision="1",
            artifact_digest="a" * 64,
            world_key="uckk-a014",
            world_release=3,
            target_organization="60f51ca2-c845-45aa-bc7e-2c62e53dfc5a",
        )
        self.assertEqual(envelope["profile"]["id"], "governance.decision.execute")
        self.assertEqual(envelope["source"]["world"], "uckk-a014")
        self.assertEqual(envelope["artifact_refs"][0]["artifact_type"], "konnaxion.decision_record")
        self.assertTrue(envelope["idempotency_key"].startswith("decision:5201:r1:orgo:"))


if __name__ == "__main__":
    unittest.main()
