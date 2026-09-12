from __future__ import annotations

import copy
import unittest

from konnaxion.ethikos.orgo_bridge_contract import (
    BridgeContractError,
    build_success_receipt,
    publication_payload_hash,
    validate_publish_request,
)


BASE = {
    "operation_id": "6b8c5523-096e-4fc0-b6a9-be644240b497",
    "organization_id": "60f51ca2-c845-45aa-bc7e-2c62e53dfc5a",
    "operation": "publish",
    "idempotency_key": "60f51ca2-c845-45aa-bc7e-2c62e53dfc5a:6b8c5523-096e-4fc0-b6a9-be644240b497",
    "correlation_id": "corr.uckk.A014.D009",
    "subject": {"type": "case", "id": "fc305c81-afad-4b3a-8adb-b3668ad70d72"},
    "input": {
        "artifact_type": "impact_update",
        "external_reference": "impact:UCKK-A014:day30:v1",
        "demo_id": "uckk-pedagogy-pilot-a014",
        "checkpoint": "day_30",
        "synthetic": True,
        "epistemic_status": "synthetic_demo_fixture",
        "summary": {
            "workload_imbalance_reports": 6,
            "peer_rubric_clarification_requests": 2,
            "policy_changes": 0,
        },
        "authority_note": "operational observation only; does not modify UCKK-D009",
    },
}


class OrgoBridgeContractTests(unittest.TestCase):
    def validate(self, body):
        return validate_publish_request(
            body,
            idempotency_header=body["idempotency_key"],
            correlation_header=body["correlation_id"],
        )

    def test_accepts_canonical_j30_request(self):
        parsed = self.validate(copy.deepcopy(BASE))
        self.assertEqual(parsed["artifact_type"], "impact_update")
        self.assertEqual(parsed["external_reference"], "impact:UCKK-A014:day30:v1")

    def test_rejects_non_publish_operation(self):
        body = copy.deepcopy(BASE)
        body["operation"] = "distribute"
        with self.assertRaises(BridgeContractError) as ctx:
            self.validate(body)
        self.assertEqual(ctx.exception.code, "UNSUPPORTED_OPERATION")

    def test_rejects_private_student_fields(self):
        body = copy.deepcopy(BASE)
        body["input"]["summary"]["student_email"] = "demo@example.test"
        with self.assertRaises(BridgeContractError) as ctx:
            self.validate(body)
        self.assertEqual(ctx.exception.code, "PRIVATE_DATA_REJECTED")

    def test_transport_identity_does_not_change_business_hash(self):
        first = self.validate(copy.deepcopy(BASE))
        second_body = copy.deepcopy(BASE)
        second_body["operation_id"] = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        second_body["idempotency_key"] = "retry:new-operation"
        second = validate_publish_request(
            second_body,
            idempotency_header=second_body["idempotency_key"],
            correlation_header=second_body["correlation_id"],
        )
        self.assertEqual(publication_payload_hash(first), publication_payload_hash(second))

    def test_receipt_matches_orgo_bridge_contract(self):
        receipt = build_success_receipt(
            external_reference="impact:UCKK-A014:day30:v1",
            impact_id=12,
            world_key="main",
            release_number=3,
            input_data=BASE["input"],
        )
        self.assertEqual(receipt["status"], "succeeded")
        self.assertTrue(receipt["data"]["published"])
        self.assertEqual(receipt["external_reference"], "impact:UCKK-A014:day30:v1")


if __name__ == "__main__":
    unittest.main()
