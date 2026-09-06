F**ile architecture for the EkoH module alone** (everything lives under `modules/ekoh-smartvote/ekoh/`):

ekoh/                        \# Django app root  (namespace: konnaxion.ekoh)  
├── \_\_init\_\_.py  
├── apps.py                 \# EkohConfig – sets default schema search\_path  
├── models/                 \# One file per logical group  
│   ├── \_\_init\_\_.py  
│   ├── taxonomy.py         \# ExpertiseCategory (UNESCO codes)  
│   ├── scores.py           \# UserExpertiseScore, UserEthicsScore  
│   ├── config.py           \# ScoreConfiguration (weights)  
│   ├── privacy.py          \# ConfidentialitySetting  
│   ├── audit.py            \# ContextAnalysisLog, ScoreHistory  
│   └── signals.py          \# cross-model hooks  
├── migrations/  
│   ├── 0001\_initial.py     \# creates schema ekoh\_smartvote \+ tables  
│   ├── 0002\_unesco\_fixture.py  
│   └── 0003\_partition\_helpers.py  
├── serializers/            \# DRF serializers split by concern  
│   ├── \_\_init\_\_.py  
│   ├── profile.py  
│   ├── score\_admin.py  
│   └── audit.py  
├── views/  
│   ├── \_\_init\_\_.py  
│   ├── profile.py          \# /ekoh/profile/:uid (GET)  
│   ├── admin.py            \# /ekoh/score/recalc (POST)  
│   └── bulk\_ingest.py      \# /ekoh/score/bulk  
├── urls.py                 \# router for the three viewsets  
├── services/               \# pure-logic (no Django imports)  
│   ├── \_\_init\_\_.py  
│   ├── multidimensional\_scoring.py  
│   ├── contextual\_analysis.py  
│   ├── ethics\_evaluator.py  
│   └── taxonomy\_loader.py  
├── tasks/  
│   ├── \_\_init\_\_.py  
│   ├── recalc.py           \# Celery task ekoh\_score\_recalc  
│   ├── contextual.py       \# contextual\_analysis\_batch  
│   └── emerging\_expert.py  
├── fixtures/  
│   └── isced\_f\_2013.json  
├── admin.py                \# Django admin registrations  
├── tests/                  \# pytest; 90 % coverage target  
│   ├── \_\_init\_\_.py  
│   ├── test\_models.py  
│   ├── test\_services.py  
│   └── test\_api.py  
└── README.md               \# stand-alone quick-start for Ekoh app

Key points:

* **Self-contained:** no imports from Konnaxion core; only depends on `auth_user` table.

* **Schema isolation:** every migration opens with `schema_editor.execute("SET search_path TO ekoh_smartvote,public")`.

* **Pip-installable:** `pyproject.toml` at `modules/ekoh-smartvote/` exposes `konnaxion.ekoh` as a namespace package.

* **Dev seed:** `manage.py loaddata fixtures/isced_f_2013.json` loads the domain taxonomy.

