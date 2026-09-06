import uuid
from django.db import models

class Consultation(models.Model):
    """
    Represents a voting event or debate topic.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    title = models.CharField(max_length=256)
    opens_at = models.DateTimeField(null=True, blank=True)
    closes_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "consultation"

    def __str__(self) -> str:
        return self.title