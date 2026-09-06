# FILE: backend/konnaxion/teambuilder/tests/test_problems_api.py
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from konnaxion.teambuilder.models import (
    Problem,
    ProblemChangeEvent,
    BuilderSession,
)

User = get_user_model()


class ProblemAPITests(APITestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(self.user)

        self.problem_list_url = reverse("api:teambuilder-problem-list")

    # --------------------------------------------------------------------- #
    # Helpers
    # --------------------------------------------------------------------- #

    def _create_problem(self, **overrides) -> Problem:
        data = {
            "name": "Test problem",
            "description": "A test problem for Team Builder.",
            "status": "ACTIVE",
            "risk_level": "MEDIUM",
            "min_team_size": 3,
            "max_team_size": 5,
            "unesco_codes": ["13.01", "05.03"],
            "categories": ["Education", "Pilot"],
            "recommended_modes": ["Elite", "Learning"],
            "facilitator_notes": "Some notes for facilitators.",
        }
        data.update(overrides)

        problem = Problem.objects.create(
            created_by=self.user,
            **data,
        )

        # The helper bypasses ProblemViewSet.perform_create(), so reproduce
        # the initial history event expected by tests using this fixture.
        ProblemChangeEvent.objects.create(
            problem=problem,
            type=ProblemChangeEvent.EventType.CREATED,
            title="Problem created",
            description=f"Problem '{problem.name}' was created.",
            changed_by=self.user,
        )

        return problem

    def _create_session_for_problem(self, problem: Problem, **overrides) -> BuilderSession:
        session_data = {
            "name": "Session for problem",
            "description": "Session description",
            "status": BuilderSession.Status.DRAFT,
            "algorithm_config": {},
            "created_by": self.user,
            "problem": problem,
            "created_at": timezone.now(),
        }
        session_data.update(overrides)
        return BuilderSession.objects.create(**session_data)

    # --------------------------------------------------------------------- #
    # Tests
    # --------------------------------------------------------------------- #

    def test_create_problem_minimal(self):
        """
        POST /api/teambuilder/problems/ should create a Problem and record
        a corresponding ProblemChangeEvent (CREATED).
        """
        payload = {
            "name": "Minimal problem",
        }

        response = self.client.post(self.problem_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Problem.objects.count(), 1)
        problem = Problem.objects.first()
        self.assertIsNotNone(problem)
        self.assertEqual(problem.name, "Minimal problem")
        self.assertEqual(problem.created_by, self.user)

        # One "created" event should have been recorded
        events = ProblemChangeEvent.objects.filter(problem=problem)
        self.assertEqual(events.count(), 1)
        self.assertEqual(events.first().type, ProblemChangeEvent.EventType.CREATED)

    def test_list_problems_includes_usage_count(self):
        """
        GET /api/teambuilder/problems/ should include annotated usage_count.
        """
        problem = self._create_problem(name="Usage test problem")

        # Two sessions referencing this problem
        self._create_session_for_problem(problem, name="Session A")
        self._create_session_for_problem(problem, name="Session B")

        response = self.client.get(self.problem_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data
        # DRF DefaultRouter list view returns a plain list or a "results" key
        if isinstance(results, dict) and "results" in results:
            items = results["results"]
        else:
            items = results

        self.assertGreaterEqual(len(items), 1)

        found = next((item for item in items if item["id"] == str(problem.id)), None)
        self.assertIsNotNone(found, "Problem not found in list response")

        # usage_count is annotated as number of sessions
        self.assertIn("usage_count", found)
        self.assertEqual(int(found["usage_count"]), 2)

    def test_retrieve_problem_detail_shape(self):
        """
        GET /api/teambuilder/problems/{id}/ should return composite payload:
        {
          "problem": {...},
          "sessions": [...],
          "history": [...]
        }
        """
        problem = self._create_problem(name="Detail test problem")

        # Create some sessions
        s1 = self._create_session_for_problem(problem, name="Session X")
        s2 = self._create_session_for_problem(problem, name="Session Y")

        # Create a manual history event
        ProblemChangeEvent.objects.create(
            problem=problem,
            type=ProblemChangeEvent.EventType.EDIT,
            title="Manual change",
            description="Edited in test.",
            changed_by=self.user,
        )

        detail_url = reverse("api:teambuilder-problem-detail", args=[problem.id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIsInstance(response.data, dict)
        self.assertIn("problem", response.data)
        self.assertIn("sessions", response.data)
        self.assertIn("history", response.data)

        problem_data = response.data["problem"]
        sessions_data = response.data["sessions"]
        history_data = response.data["history"]

        # Problem block
        self.assertEqual(problem_data["id"], str(problem.id))
        self.assertEqual(problem_data["name"], "Detail test problem")

        # Sessions block
        session_ids = {s["id"] for s in sessions_data}
        self.assertSetEqual(session_ids, {str(s1.id), str(s2.id)})

        # History block: at least one event (created) + our manual edit
        self.assertGreaterEqual(len(history_data), 1)
        titles = {e["title"] for e in history_data}
        self.assertIn("Problem created", titles)
        self.assertIn("Manual change", titles)

    def test_update_problem_creates_history_event(self):
        """
        PATCH /api/teambuilder/problems/{id}/ should record an EDIT event.
        """
        problem = self._create_problem(name="Updatable problem")

        detail_url = reverse("api:teambuilder-problem-detail", args=[problem.id])
        payload = {"description": "Updated description"}
        response = self.client.patch(detail_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        problem.refresh_from_db()
        self.assertEqual(problem.description, "Updated description")

        events = ProblemChangeEvent.objects.filter(problem=problem)
        # We should have at least 2 events: created + edit
        self.assertGreaterEqual(events.count(), 2)
        self.assertTrue(events.filter(type=ProblemChangeEvent.EventType.EDIT).exists())
