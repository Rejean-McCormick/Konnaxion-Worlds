from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    CoCreationProject,
    ForumPost,
    ForumTopic,
    KnowledgeRecommendation,
    KnowledgeResource,
    LearningProgress,
    MentorProfile,
    MentorshipRequest,
)

User = get_user_model()


class KonnectedApiSurfaceTests(APITestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="konnected-user",
            email="konnected-user@example.com",
            password="test-password",
        )
        self.other_user = User.objects.create_user(
            username="konnected-other",
            email="konnected-other@example.com",
            password="test-password",
        )
        self.client.force_authenticate(self.user)

    def test_forum_topic_and_post_write_paths(self):
        topic_response = self.client.post(
            "/api/konnected/forum-topics/",
            {"title": "How should peer learning work?", "category": "General"},
            format="json",
        )
        self.assertEqual(topic_response.status_code, status.HTTP_201_CREATED)

        topic_id = topic_response.data["id"]
        topic = ForumTopic.objects.get(pk=topic_id)
        self.assertEqual(topic.creator, self.user)

        post_response = self.client.post(
            "/api/konnected/forum-posts/",
            {"topic": topic_id, "content": "Start with small cohorts."},
            format="json",
        )
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)

        post = ForumPost.objects.get(pk=post_response.data["id"])
        self.assertEqual(post.author, self.user)
        self.assertEqual(post.topic, topic)

    def test_mentorship_directory_and_request(self):
        mentor = MentorProfile.objects.create(
            user=self.other_user,
            display_name="Mentor Example",
            bio="Mentor bio",
            expertise_areas=["Math"],
            languages=["English"],
            level=MentorProfile.MentorLevel.SECONDARY,
            focus_areas=["Exam preparation"],
            is_active=True,
            is_accepting_mentees=True,
        )

        directory_response = self.client.get("/api/konnected/mentors/")
        self.assertEqual(directory_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(directory_response.data), 1)
        self.assertEqual(directory_response.data[0]["display_name"], "Mentor Example")

        request_response = self.client.post(
            "/api/konnected/mentorship-requests/",
            {
                "mentor": mentor.pk,
                "learning_goal": "Prepare for the physics exam",
                "preferred_language": "English",
            },
            format="json",
        )
        self.assertEqual(request_response.status_code, status.HTTP_201_CREATED)

        request_row = MentorshipRequest.objects.get(pk=request_response.data["id"])
        self.assertEqual(request_row.mentee, self.user)
        self.assertEqual(request_row.mentor, mentor)

    def test_learning_progress_is_owned_by_authenticated_user(self):
        resource = KnowledgeResource.objects.create(
            title="Civic Systems 101",
            type=KnowledgeResource.ResourceType.COURSE,
            url="https://example.com/civic-systems",
            author=self.other_user,
        )

        response = self.client.post(
            "/api/konnected/progress/",
            {"resource": resource.pk, "progress_percent": 42.5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        row = LearningProgress.objects.get(pk=response.data["id"])
        self.assertEqual(row.user, self.user)
        self.assertEqual(float(row.progress_percent), 42.5)

    def test_recommendations_only_expose_current_users_rows(self):
        resource = KnowledgeResource.objects.create(
            title="Evidence and Deliberation",
            type=KnowledgeResource.ResourceType.DOC,
            url="https://example.com/evidence",
            author=self.other_user,
        )
        KnowledgeRecommendation.objects.create(
            user=self.user,
            resource=resource,
            recommended_at=timezone.now(),
        )
        KnowledgeRecommendation.objects.create(
            user=self.other_user,
            resource=resource,
            recommended_at=timezone.now(),
        )

        response = self.client.get("/api/konnected/recommendations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["resource"]["title"], resource.title)

    def test_co_creation_project_is_exposed_read_only(self):
        project = CoCreationProject.objects.create(
            title="Open learning kit",
            status=CoCreationProject.Status.ACTIVE,
        )

        response = self.client.get("/api/konnected/co-creation-projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], project.pk)

        create_response = self.client.post(
            "/api/konnected/co-creation-projects/",
            {"title": "No implicit owner", "status": "active"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_forum_mutation_is_limited_to_creator(self):
        topic = ForumTopic.objects.create(
            title="Owned discussion",
            category="General",
            creator=self.other_user,
        )

        response = self.client.delete(f"/api/konnected/forum-topics/{topic.pk}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(ForumTopic.objects.filter(pk=topic.pk).exists())
