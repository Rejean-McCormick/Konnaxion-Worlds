# FILE: backend/scripts/populate_demo_data.py
import os
import django
import random
from django.apps import apps
from django.conf import settings
from django.utils import timezone
from django.db import models
from faker import Faker
from django.core.files.base import ContentFile
from datetime import timedelta

# If DJANGO_SETTINGS_MODULE is unset, default to local settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
django.setup()

# Initialize Faker for generating dummy data
faker = Faker()

# Helper: generate a dummy image file content (as an image or text)
def create_dummy_image(name="dummy.png", size=(50, 50)):
    try:
        from PIL import Image
    except ImportError:
        # Pillow not installed, create a simple text file as fallback
        return ContentFile(b"Dummy file content", name=(name or "file.txt"))
    # Create a blank image with a random color
    image = Image.new("RGB", size, color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    import io
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name=name or "image.png")

# Retrieve the custom User model (from AUTH_USER_MODEL)
try:
    from django.contrib.auth import get_user_model
    User = get_user_model()
except ImportError:
    User = None

# Dictionary to keep track of created objects for each model class
created_objects = {}

def populate_model(model_class, count=3):
    """Create `count` fake instances of the given model_class."""
    model_name = model_class.__name__
    created_list = []
    print(f"Creating {count} instances of {model_name}...")
    for i in range(count):
        field_values = {}
        for field in model_class._meta.get_fields():
            # Skip reverse relations and M2M fields (handled later)
            if field.many_to_many or field.auto_created:
                continue
            if not hasattr(field, "attname"):
                continue
            if field.primary_key or field.attname == "id":
                continue
            field_name = field.name
            field_type = field.get_internal_type()
            # Handle ForeignKey and OneToOne relationships
            if field.many_to_one or field.one_to_one:
                related_model = field.related_model
                if related_model == User:
                    # Foreign key to User
                    if User in created_objects and created_objects[User]:
                        if field.one_to_one:
                            # Use distinct user for one-to-one
                            field_values[field_name] = created_objects[User][i % len(created_objects[User])]
                        else:
                            field_values[field_name] = random.choice(created_objects[User])
                    else:
                        field_values[field_name] = None
                else:
                    if related_model in created_objects and created_objects[related_model]:
                        if field.one_to_one:
                            field_values[field_name] = created_objects[related_model][i % len(created_objects[related_model])]
                        else:
                            field_values[field_name] = random.choice(created_objects[related_model])
                    else:
                        field_values[field_name] = None
                continue
            # BooleanField
            if field_type == "BooleanField":
                val = random.choice([True, False])
                # If this is an approval or hidden flag, make last one True for variety
                if field_name == "approved":
                    val = (i == count - 1)
                if field_name == "is_hidden":
                    val = (i == count - 1)
                field_values[field_name] = val
                continue
            # CharField / TextField
            if field_type in ["CharField", "TextField"]:
                # Use choices if provided
                if getattr(field, "choices", None):
                    choices = [choice[0] for choice in field.choices]
                    field_values[field_name] = random.choice(choices)
                else:
                    max_length = getattr(field, "max_length", None) or 255
                    if "email" in field_name:
                        field_values[field_name] = faker.safe_email()
                    elif "username" in field_name:
                        field_values[field_name] = faker.unique.user_name()
                    elif isinstance(field, models.URLField) or "url" in field_name:
                        field_values[field_name] = faker.url()
                    elif "slug" in field_name:
                        field_values[field_name] = faker.slug()
                    elif field_name == "name" or field_name.endswith("_name") or field_name.startswith("name_"):
                        field_values[field_name] = faker.word().capitalize()
                    elif "title" in field_name:
                        field_values[field_name] = faker.sentence(nb_words=4)
                    elif "description" in field_name or field_type == "TextField":
                        field_values[field_name] = faker.paragraph(nb_sentences=3)
                    elif "content" in field_name:
                        field_values[field_name] = faker.paragraph(nb_sentences=5)
                    else:
                        field_values[field_name] = faker.text(max_nb_chars=min(max_length, 50))
                    # Truncate text to max_length
                    if isinstance(field_values[field_name], str) and max_length:
                        field_values[field_name] = field_values[field_name][:max_length]
                continue
            # Integer fields (including PositiveInteger/SmallInteger)
            if field_type in ["IntegerField", "SmallIntegerField", "BigIntegerField", "PositiveIntegerField", "PositiveSmallIntegerField"]:
                if getattr(field, "choices", None):
                    choices = [choice[0] for choice in field.choices]
                    field_values[field_name] = random.choice(choices)
                else:
                    if "year" in field_name:
                        field_values[field_name] = random.randint(1900, timezone.now().year)
                    elif "order" in field_name or "rank" in field_name:
                        field_values[field_name] = i  # simple ordering by index
                    elif "score" in field_name or "value" in field_name:
                        field_values[field_name] = random.randint(0, 100)
                    else:
                        field_values[field_name] = random.randint(0, 50)
                continue
            # DecimalField / FloatField
            if field_type in ["DecimalField", "FloatField"]:
                if getattr(field, "choices", None):
                    choices = [choice[0] for choice in field.choices]
                    field_values[field_name] = random.choice(choices)
                else:
                    if hasattr(field, "max_digits"):
                        # Generate a random Decimal within the allowed digit range
                        int_part = field.max_digits - getattr(field, "decimal_places", 0)
                        max_value = 10 ** int_part - 1
                        val = random.random() * max_value
                        if getattr(field, "decimal_places", 0) > 0:
                            val = round(val, field.decimal_places)
                        field_values[field_name] = val
                    else:
                        field_values[field_name] = round(random.random() * 100, 3)
                continue
            # DateField / DateTimeField
            if field_type in ["DateField", "DateTimeField"]:
                if getattr(field, "auto_now", False) or getattr(field, "auto_now_add", False):
                    # Skip auto timestamps (they will set themselves)
                    continue
                offset_days = random.randint(-30, 30)
                if field_type == "DateField":
                    field_values[field_name] = timezone.now().date() + timedelta(days=offset_days)
                else:
                    field_values[field_name] = timezone.now() + timedelta(days=offset_days)
                continue
            # JSONField
            if field_type == "JSONField":
                if "tags" in field_name or field_name.lower().endswith("tags"):
                    # For fields storing tags or lists
                    field_values[field_name] = [faker.word() for _ in range(2)]
                elif "parameters" in field_name:
                    field_values[field_name] = {"param": round(random.random(), 3)}
                elif "contact_info" in field_name:
                    field_values[field_name] = {"email": faker.safe_email(), "phone": faker.phone_number()}
                else:
                    field_values[field_name] = {"example": faker.word()}
                continue
            # FileField (including ImageField)
            if isinstance(field, models.FileField):
                # Only set if field is required (not blank) or for the first instance for demonstration
                if not getattr(field, "blank", False) or i == 0:
                    dummy_name = "dummy_file.txt"
                    # If it seems like an image/media file field, use image file name
                    if "image" in field_name or "photo" in field_name or "media" in field_name:
                        dummy_name = "dummy_image.png"
                    field_values[field_name] = create_dummy_image(name=dummy_name)
                continue
            # Other field types (skip or rely on default)
        # Create the instance with generated field values
        instance = model_class.objects.create(**field_values)
        # Post-creation adjustments for specific models
        if model_name == "CollabSession" and i == count - 1:
            # Mark the last session as ended
            instance.ended_at = instance.started_at + timedelta(hours=1)
            instance.save(update_fields=["ended_at"])
        if model_name == "TraditionEntry":
            # If marked approved, set approved_by and approved_at
            if getattr(instance, "approved", False):
                instance.approved_by = random.choice(created_objects.get(User, [])) if User in created_objects else None
                instance.approved_at = timezone.now()
                instance.save(update_fields=["approved_by", "approved_at"])
        created_list.append(instance)
    created_objects[model_class] = created_list
    print(f"  Created {len(created_list)} {model_name}(s).")

# Create some User instances first (so other models can refer to them)
if User:
    user_list = []
    print("Creating 3 User instances...")
    for j in range(3):
        username = faker.unique.user_name()
        email = faker.safe_email()
        password = "password123"
        try:
            # Use create_user to ensure password is hashed
            user = User.objects.create_user(username=username, email=email, password=password)
        except AttributeError:
            # If custom manager lacks create_user, create normally
            user = User.objects.create(username=username, email=email)
            user.set_password(password)
            user.save()
        user_list.append(user)
        print(f"  Created User: {user.username}")
    created_objects[User] = user_list

# Populate each model in local apps (in defined order if available)
local_apps = []
if hasattr(settings, "LOCAL_APPS"):
    local_apps = settings.LOCAL_APPS
else:
    local_apps = [app.name for app in apps.get_app_configs() if app.name.startswith("konnaxion.")]
for app_name in local_apps:
    try:
        app_config = apps.get_app_config(app_name.split(".")[-1])
    except LookupError:
        # If full name didn't match, try the entire name as key
        try:
            app_config = apps.get_app_config(app_name)
        except LookupError:
            continue
    for model in app_config.get_models():
        if User and model == User:
            continue
        populate_model(model)

# Assign ManyToMany relationships for auto-created through models
print("Assigning ManyToMany relationships...")
for model_class, instances in created_objects.items():
    for field in model_class._meta.many_to_many:
        # Only assign for implicit M2M (skip through-models explicitly defined)
        if field.remote_field.through._meta.auto_created:
            related_model = field.remote_field.model if field.remote_field.model != model_class else field.remote_field.related_model
            if related_model in created_objects:
                related_objs = created_objects[related_model]
                if not related_objs:
                    continue
                for instance in instances:
                    # Attach 1 or 2 random related objects to each instance
                    num_links = 1 if len(related_objs) == 1 else random.randint(1, min(2, len(related_objs)))
                    selected = random.sample(related_objs, num_links)
                    getattr(instance, field.name).add(*selected)
print("Done populating all models.")
