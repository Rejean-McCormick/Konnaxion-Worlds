# -*- coding: utf-8 -*-
import os
import sys
from pathlib import Path

# 1) Calculer la racine du projet (/app dans le conteneur)
BASE_DIR = Path(__file__).resolve().parent.parent  # /app

# 2) Ajouter /app au PYTHONPATH pour que `config` et `konnaxion` soient trouvés
sys.path.insert(0, str(BASE_DIR))

# 3) Configurer Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

import django  # import après avoir réglé sys.path et DJANGO_SETTINGS_MODULE
from faker import Faker
from django.contrib.auth import get_user_model

django.setup()

User = get_user_model()


def run():
    fake = Faker()
    created = 0

    for _ in range(50):
        username = fake.user_name()
        email = fake.email()

        # Eviter les doublons de username
        if User.objects.filter(username=username).exists():
            continue

        # Ton modèle custom User a un champ `name`:contentReference[oaicite:3]{index=3}
        user = User.objects.create_user(
            username=username,
            email=email,
            name=fake.name(),
            password="test1234",
        )
        created += 1

    print(f"{created} users created.")


if __name__ == "__main__":
    run()
