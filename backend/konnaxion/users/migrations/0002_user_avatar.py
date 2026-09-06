# FILE: backend/konnaxion/users/migrations/0002_user_avatar.py
# backend/konnaxion/users/migrations/0002_user_avatar.py
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar",
            field=models.ImageField(
                upload_to="users/avatars/",
                blank=True,
                null=True,
            ),
        ),
    ]
