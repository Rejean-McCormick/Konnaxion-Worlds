"""
Admin interface to inspect month-based partitions in ekoh_smartvote schema.
"""

from django.contrib import admin
from django.db import connection


class PartitionInfo:
    """Dummy object representing one partition table."""
    def __init__(self, name):
        self.table_name = name


@admin.register(PartitionInfo)
class PartitionInfoAdmin(admin.ModelAdmin):
    list_display = ("table_name",)

    def get_queryset(self, request):
        with connection.cursor() as cur:
            cur.execute("""
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'ekoh_smartvote'
                  AND tablename ~ '^(vote_|vote_ledger_|score_history_)';
            """)
            names = [row[0] for row in cur.fetchall()]
        return [PartitionInfo(name) for name in names]
