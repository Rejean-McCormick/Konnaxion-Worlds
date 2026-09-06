# FILE: backend/konnaxion/keenkonnect/models.py
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class Project(models.Model):
    class Status(models.TextChoices):
        IDEA = "idea", _("Idea")
        INPROGRESS = "progress", _("In progress")
        COMPLETED = "completed", _("Completed")
        VALIDATED = "validated", _("Validated")

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_projects",
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.IDEA
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tags = models.ManyToManyField("Tag", blank=True, related_name="projects")

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("status", "category"))]

    def __str__(self):
        return self.title

def project_file_path(instance, filename):
    return f"projects/{instance.project_id}/{filename}"

class ProjectResource(models.Model):
    class FileType(models.TextChoices):
        IMAGE = "image", _("Image")
        DOC = "document", _("Document")
        MODEL_3D = "3d_model", _("3D model")
        OTHER = "other", _("Other")

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=project_file_path, blank=True, null=True)
    external_url = models.URLField(blank=True)
    file_type = models.CharField(max_length=15, choices=FileType.choices)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    version = models.PositiveSmallIntegerField(default=1)
    converted_path = models.FileField(upload_to=project_file_path, blank=True, null=True)

    class Meta:
        ordering = ("-uploaded_at",)

class ProjectMessage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [models.Index(fields=("project", "created_at"))]

class ProjectTask(models.Model):
    class TaskStatus(models.TextChoices):
        TODO = "todo", _("To do")
        IN_PROGRESS = "doing", _("In progress")
        DONE = "done", _("Done")

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=TaskStatus.choices, default=TaskStatus.TODO)
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "created_at")
        indexes = [models.Index(fields=("project", "status"))]

class ProjectTeam(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", _("Owner")
        COLLABORATOR = "collaborator", _("Collaborator")
        MENTOR = "mentor", _("Mentor")

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="team_memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=15, choices=Role.choices, default=Role.COLLABORATOR)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")
        indexes = [models.Index(fields=("project", "role"))]

class ProjectRating(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    value = models.SmallIntegerField(choices=[(1, "+1"), (-1, "-1")])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")
        indexes = [models.Index(fields=("project",))]

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name
