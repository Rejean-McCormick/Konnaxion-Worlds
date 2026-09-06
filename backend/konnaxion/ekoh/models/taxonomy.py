# FILE: backend/konnaxion/ekoh/models/taxonomy.py
"""Expertise hierarchy (UNESCO ISCED-F)."""

from django.contrib.postgres.indexes import GistIndex
from django.db import models

# [FIX] Define custom LTreeField locally because it is not in Django core
class LTreeField(models.TextField):
    description = "PostgreSQL ltree field"

    def db_type(self, connection):
        return "ltree"

class ExpertiseCategory(models.Model):
    """
    Hierarchical expertise domain.

    * `code` – the official ISCED-F code (e.g. "0511").
    * `path` – Postgres ltree (“01.04.11”) for fast descendant queries.
    """

    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=128)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )
    depth = models.SmallIntegerField()
    path = LTreeField()

    class Meta:
        db_table = "expertise_category"
        indexes = [
            models.Index(fields=["depth", "code"], name="idx_cat_depth"),
            GistIndex(fields=["path"], name="idx_cat_path"),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.code} • {self.name}"
        
