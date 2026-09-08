

[0  Global / Core (shared by all apps)](#0  global-/-core-\(shared-by-all-apps\))

[1  Kollective Intelligence](#1  kollective intelligence)

[1.1 EkoH (engine)](#1.1 ekoh \(engine\))

[1.2 Smart Vote (engine)](#1.2 smart vote \(engine\))

[2  ethiKos](#2  ethikos)

[3  keenKonnect](#3  keenkonnect)

[4  KonnectED](#4  konnected)

[5  Kreative](#5  kreative)

[6  Navigation & Route Invariants](#6  navigation-&-route-invariants)

[7  Environment‑variable Matrix (cookiecutter‑compatible)](#7  environment‑variable-matrix-\(cookiecutter‑compatible\))

[How this document will be maintained](#how-this-document-will-be-maintained)

**Konnaxion Platform – Definitive Parameter Reference (v14‑stable)**  
 *All TBD values are now fixed; names follow Cookiecutter‑Django conventions (UPPER\_SNAKE for `settings.py`, `DJANGO_…`/`APP_…` for `.envs` files, `choices=` enums in models). Nothing here adds new tables, routes or functions – it only freezes configuration knobs already implied in the v14 spec.*

---

## **0  Global / Core (shared by all apps)** {#0  global-/-core-(shared-by-all-apps)}

| Parameter | Location | Final value | Rationale |
| ----- | ----- | ----- | ----- |
| `SEARCH_BACKEND` | `settings.BASE` | `"postgres"` | Choose PostgreSQL `tsvector`‑based full‑text search as the default; ElasticSearch can be added later if needed  |
| `CHANNEL_LAYERS["default"]["BACKEND"]` | `settings.local` | `"channels_redis.core.RedisChannelLayer"` | Re‑uses the Redis container already present in the Cookiecutter stack |
| `DEFAULT_FROM_EMAIL` | `.envs/.local/.django` | `noreply@konnaxion.local` | Aligns with cookiecutter pattern |
| `MEDIA_ROOT` | `settings.BASE` | `/app/media/` | Single bucket mount for all modules |
| `STATICFILES_STORAGE` | `settings.production` | `"whitenoise.storage.CompressedManifestStaticFilesStorage"` | Matches cookiecutter production preset |
| `LANGUAGES` | `settings.BASE` | `en`, `fr`, `es`, `ar` | Four‑language baseline for i18n  |
| `TIME_ZONE` | `settings.BASE` | `"UTC"` | Keeps server‑side consistency (users set own TZ) |

---

## **1  Kollective Intelligence** {#1  kollective intelligence}

### **1.1 EkoH (engine)** {#1.1 ekoh (engine)}

| Parameter | Model / Setting | Type / Range | Default |
| ----- | ----- | ----- | ----- |
| `raw_weight_quality` | `ScoreConfiguration` | `Decimal(4,3)` | **1.000** |
| `raw_weight_expertise` | `ScoreConfiguration` | `Decimal(4,3)` | **1.500** |
| `raw_weight_frequency` | `ScoreConfiguration` | `Decimal(4,3)` | **0.750** |
| `ethical_multiplier_floor` | `settings.EKOH` | float 0‑1 | **0.20** |
| `ethical_multiplier_cap` | `settings.EKOH` | float 1‑2 | **1.50** |
| `EXPERTISE_DOMAIN_CHOICES` | `ExpertiseCategory` | enum of 26 ISO‑based domains | frozen list in fixtures |

These weights are the initial coefficients for the **multidimensional\_scoring** service and correspond 1‑for‑1 with “quality, frequency, relevance, expertise” axes defined in the functionality inventory .

### **1.2 Smart Vote (engine)** {#1.2 smart vote (engine)}

| Parameter | Setting | Value / Enum |
| ----- | ----- | ----- |
| `VOTE_MODALITY_CHOICES` | `VoteModality` | `"approval"`, `"ranking"`, `"rating"`, `"preferential"` |
| `EMERGING_EXPERT_THRESHOLD` | `settings.SMART_VOTE` | **\+15 % Ekoh delta over 30 days** |
| `CONSENSUS_STRONG_THRESHOLD` | `settings.SMART_VOTE` | **≥ 75 % weighted agreement** |

---

## **2  ethiKos** {#2  ethikos}

| Parameter | Location | Final value |
| ----- | ----- | ----- |
| **Stance scale mapping** | `EthikosStance.stance_value` | int **‑3 … \+3** (“strongly against” → “strongly for”); 0 \= neutral |
| **Minimum expert votes for result display** | `settings.ETHIKOS` | **12 distinct experts** (Ekoh \> 75th percentile in topic domain) |
| **Moderation auto‑hide threshold** | `DebateArgument.is_hidden` flag | **3 independent reports** |
| **AI clone training batch size** | `.envs/.local/.django` → `ETHIKOS_AI_BATCH` | **128** |

These close every “TBD” noted in the ethiKos spec (stance granularity, expert quorum, moderation trigger) .

---

## **3  keenKonnect** {#3  keenkonnect}

| Parameter | Location | Final value |
| ----- | ----- | ----- |
| `MAX_BLUEPRINT_UPLOAD_MB` | `settings.STORAGE` | **150 MB** |
| `ALLOWED_BLUEPRINT_TYPES` | constant in `ProjectResource` | `[".pdf", ".png", ".jpg", ".glb", ".gltf", ".stl"]` |
| `COLLAB_SPACE_MEMBER_CAP` | `CollaborationSpace` | **40** |
| `AI_SUGGESTION_TOP_N` | `settings.KEENKONNECT` | **8** user suggestions per request |
| `VIDEO_SESSION_PROVIDER` | env var `KC_VIDEO_PROVIDER` | `"livekit"` (self‑hosted) |

All map directly to features in the technical spec and functionalities table .

---

## **4  KonnectED** {#4  konnected}

| Parameter | Location | Final value |
| ----- | ----- | ----- |
| `OFFLINE_PACKAGE_CRON` | Celery Beat | `0 3 * * SUN` (every Sunday at 03:00 UTC) |
| `CERT_PASS_PERCENT` | `CertificationPath` | **80 %** |
| `QUIZ_RETRY_COOLDOWN_MIN` | `settings.KONNECTED` | **30** minutes |
| `CONTENT_TYPES_ALLOWED` | `KnowledgeResource.type` enum | `"article"`, `"video"`, `"lesson"`, `"quiz"`, `"dataset"` |
| `MAX_CONTRIBUTION_DRAFTS` | per user | **10** pending submissions |

---

## **5  Kreative** {#5  kreative}

| Parameter | Location | Final value |
| ----- | ----- | ----- |
| `ARTWORK_MAX_IMAGE_MB` | `settings.KREATIVE` | **50 MB** |
| `ARTWORK_RESOLUTIONS` | image processing task | `[256, 1024, 2048]` px longest side |
| `VIRTUAL_GALLERY_CAPACITY` | `VirtualExhibition` | **24 artworks / room** |
| `COLLAB_CANVAS_MAX_USERS` | `CollabSession` | **6** simultaneous editors |
| `NSFW_FLAG_REQUIRED` | upload form | boolean, default `False` |

---

## **6  Navigation & Route Invariants** {#6  navigation-&-route-invariants}

The **24 routes** enumerated in the Navigation Map are locked; any new path must be added via RFC process. Route‑to‑app ownership table:

| Route prefix | Owning Django app |
| ----- | ----- |
| `/konsensus`, `/ekoh` | `kollective_intelligence` |
| `/debate`, `/consult`, `/ethikos` | `ethikos` |
| `/projects`, `/impact` | `keenkonnect` |
| `/learn`, `/course`, `/certs` | `konnected` |
| `/kreative`, `/art`, `/archive`, `/connect`, `/profile` | `kreative` |
| `/chat`, `/team`, `/admin` | core / `django.contrib.admin` |

No additional frontend pages may claim these prefixes without amending this reference .

---

## **7  Environment‑variable Matrix (cookiecutter‑compatible)** {#7  environment‑variable-matrix-(cookiecutter‑compatible)}

| Env var | Used by | Default (.local) | Notes |
| ----- | ----- | ----- | ----- |
| `DJANGO_SECRET_KEY` | all | autogenerated | cookiecutter standard |
| `DJANGO_ALLOWED_HOSTS` | nginx \+ Django | `localhost, 127.0.0.1` | extend per environment |
| `DATABASE_URL` | Postgres | `postgres://konnaxion@postgres:5432/konnaxion` | set by cookiecutter |
| `REDIS_URL` | Celery, Channels | `redis://redis:6379/0` | — |
| `SEARCH_BACKEND` | core search | `postgres` | see section 0 |
| `EKOH_MIN_MULTIPLIER` | Ekoh engine | `0.20` | editable in prod |
| `EKOH_MAX_MULTIPLIER` | Ekoh engine | `1.50` | — |
| `KC_VIDEO_PROVIDER` | keenKonnect | `livekit` | adjust if using Jitsi |
| `OFFLINE_PACKAGE_CRON` | KonnectED | `0 3 * * SUN` | must stay UTC |

Add these to `.envs/.local/.django`; production overrides live in `.envs/.production/.django`.

---

### **How this document will be maintained** {#how-this-document-will-be-maintained}

* **Immutable commit rule:** Once merged into `docs/parameter_reference.md`, changes require a pull‑request labelled **“param‑change”** and approval from both backend & frontend leads.

* **CI guard:** A lint step asserts that `settings.*` and model enums keep the values defined here.

* **Version tag:** Each future alteration bumps a `PARAM_VERSION` env var so containers can invalidate caches.

---

