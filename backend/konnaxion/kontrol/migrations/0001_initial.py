# FILE: backend/konnaxion/kontrol/migrations/0001_initial.py
# Generated manually based on kontrol/models.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True, help_text='Date time on which the object was created.', verbose_name='created')),
                ('modified', models.DateTimeField(auto_now=True, help_text='Date time on which the object was last modified.', verbose_name='modified')),
                ('actor_name', models.CharField(blank=True, help_text="Snapshot of actor name or 'System'", max_length=255)),
                ('role', models.CharField(choices=[('system', 'System'), ('admin', 'Admin'), ('moderator', 'Moderator')], default='system', max_length=20)),
                ('action', models.CharField(help_text='e.g. DELETE_COMMENT, BAN_USER', max_length=255)),
                ('module', models.CharField(help_text='Target module e.g. Moderation, Auth', max_length=100)),
                ('target', models.CharField(help_text='Description of the target object', max_length=255)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('status', models.CharField(choices=[('success', 'Success'), ('failure', 'Failure')], default='success', max_length=20)),
                ('details', models.JSONField(blank=True, default=dict, help_text='Additional context like diffs or parameters')),
                ('actor', models.ForeignKey(blank=True, help_text='User who performed the action. Null if system action.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Audit Log',
                'verbose_name_plural': 'Audit Logs',
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='ModerationTicket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', models.DateTimeField(auto_now_add=True, help_text='Date time on which the object was created.', verbose_name='created')),
                ('modified', models.DateTimeField(auto_now=True, help_text='Date time on which the object was last modified.', verbose_name='modified')),
                ('content_snippet', models.TextField(help_text='Short preview of the flagged content')),
                ('full_content', models.TextField(blank=True, help_text='Complete content for review')),
                ('target_id', models.CharField(help_text='ID of the reported object', max_length=255)),
                ('target_type', models.CharField(choices=[('comment', 'Comment'), ('post', 'Post'), ('user_profile', 'User Profile')], max_length=50)),
                ('author_reputation_score', models.IntegerField(default=0)),
                ('report_reason', models.CharField(max_length=255)),
                ('report_count', models.PositiveIntegerField(default=1)),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('reviewed', 'Reviewed'), ('resolved', 'Resolved')], default='pending', max_length=20)),
                ('resolution_note', models.TextField(blank=True)),
                ('author', models.ForeignKey(help_text='The user who created the flagged content', on_delete=django.db.models.deletion.CASCADE, related_name='moderation_tickets_authored', to=settings.AUTH_USER_MODEL)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_tickets', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Moderation Ticket',
                'verbose_name_plural': 'Moderation Tickets',
                'ordering': ['-severity', '-created'],
            },
        ),
    ]