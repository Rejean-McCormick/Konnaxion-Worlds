# 25 — Wave 1 QA Checklist

**Project:** Konnaxion  
**Module:** ethiKos  
**Upgrade:** Kintsugi  
**Document ID:** `25_WAVE1_QA_CHECKLIST.md`  
**Target path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/25_WAVE1_QA_CHECKLIST.md`  
**Status:** Working QA checklist  
**Generated:** 2026-04-27  
**Audience:** maintainers, QA reviewers, backend/frontend developers, AI coding agents

---

## 1. Purpose

This document defines the QA gates for the **ethiKos Kintsugi Wave 1** implementation.

Wave 1 QA must confirm that the implementation:

- preserves the existing `/ethikos/*` route family;
- preserves the existing `/api/ethikos/*` and `/api/kollective/*` API center of gravity;
- does not introduce `/api/kialo/*`, `/api/kintsugi/*`, `/api/deliberation/*`, or expanded `/api/home/*` behavior;
- keeps current ethiKos model names intact;
- separates source facts from derived readings;
- keeps Kialo-style work inside Korum / Deliberate;
- keeps Smart Vote as derived readings, not source mutation;
- keeps EkoH as context, not the voting engine;
- validates every slice with backend, frontend, no-drift, smoke, and documentation checks.

This checklist is not an implementation backlog. It is the acceptance and verification companion for Wave 1 work.

---

## 2. Source documents to check before QA sign-off

QA reviewers must verify the implementation against these contracts:

```txt
00_KINTSUGI_START_HERE.md
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
05_CURRENT_STATE_BASELINE.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
10_FIRST_PASS_INTEGRATION_MATRIX.md
11_MIMIC_VS_ANNEX_RULEBOOK.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
18_ADR_REGISTER.md
19_OSS_CODE_READING_PLAN.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
23_WAVE1_IMPLEMENTATION_BACKLOG.md
24_WAVE1_SLICE_REGISTER.md
25_WAVE1_QA_CHECKLIST.md
```

If any QA question conflicts with the current code snapshot, use the code snapshot for implementation reality and the boundary contracts for ownership/write-rule validation.

---

## 3. Status legend

Use these markers in review notes:

```txt
[ ] Not checked
[x] Passed
[~] Partially passed / needs follow-up
[!] Failed / blocks merge
[-] Not applicable to this slice
```

Every `[~]` or `[!]` item must include:

```txt
owner:
file(s):
failure:
required fix:
retest command:
```

---

## 4. Global Wave 1 release gates

### G0 — Scope gate

- [ ] Wave 1 work maps to `DocKintsugi_Kompendio.txt`.
- [ ] Each change maps to an approved slice in `24_WAVE1_SLICE_REGISTER.md`.
- [ ] No work creates a foreign OSS app.
- [ ] No work introduces an annex/sidecar implementation.
- [ ] No work creates `/kialo`, `/kintsugi`, or external civic-tech route families.
- [ ] No work expands `/api/home/*` as a future ethiKos API.
- [ ] No work replaces existing ethiKos routes.
- [ ] No work replaces existing ethiKos models.
- [ ] No work treats first-pass OSS docs as importable source code.
- [ ] Any waived OSS code-reading requirement is documented.

### G1 — Source-of-truth gate

- [ ] `EthikosTopic` remains the topic/debate/consultation container.
- [ ] `EthikosStance` remains topic-level stance.
- [ ] `EthikosArgument` remains argument/thread/claim-equivalent object.
- [ ] `ArgumentImpactVote` is not treated as `EthikosStance`.
- [ ] `ReadingResult` is not treated as a source fact.
- [ ] Weighted values are stored/displayed as derived artifacts only.
- [ ] Baseline/raw results remain visible when readings are displayed.
- [ ] Smart Vote does not mutate Korum records.
- [ ] Smart Vote does not mutate Konsultations records.
- [ ] EkoH does not mutate votes, stances, ballots, or arguments.
- [ ] EkoH is never presented as the voting engine.

### G2 — Route/API gate

- [ ] Existing `/ethikos/*` frontend route family remains intact.
- [ ] Existing `/api/ethikos/topics/` remains intact.
- [ ] Existing `/api/ethikos/stances/` remains intact.
- [ ] Existing `/api/ethikos/arguments/` remains intact.
- [ ] Existing `/api/ethikos/categories/` remains intact where available.
- [ ] Existing `/api/kollective/votes/` remains intact.
- [ ] Existing `/api/kollective/vote-results/` remains intact where available.
- [ ] New Kintsugi endpoints, if any, are registered under approved namespaces only.
- [ ] No `/api/kialo/*` endpoint exists.
- [ ] No `/api/kintsugi/*` endpoint exists.
- [ ] No `/api/deliberation/*` endpoint exists.
- [ ] No new page-level raw fetch is introduced for Kintsugi work when a service wrapper should own the call.
- [ ] Router basenames are stable and documented.

### G3 — Migration gate

- [ ] All schema changes have migrations.
- [ ] No destructive rename of existing ethiKos core models.
- [ ] No destructive migration of existing topic/stance/argument data.
- [ ] New models are additive.
- [ ] New nullable fields are safe for existing data.
- [ ] New indexes/constraints are justified.
- [ ] Migration names are slice-specific and ordered.
- [ ] Rollback implications are documented.
- [ ] `makemigrations --check --dry-run` passes after migration files are committed.
- [ ] `migrate --plan` is reviewed.

### G4 — Backend API/test gate

- [ ] All new serializers define read-only fields correctly.
- [ ] User/owner fields are injected from request context where appropriate.
- [ ] Normal users cannot set moderation fields.
- [ ] Normal users cannot assign roles.
- [ ] Normal users cannot publish readings.
- [ ] Admin/moderator-only actions are protected.
- [ ] System/compute-only actions are protected or explicitly internal.
- [ ] API list responses handle both empty and populated states.
- [ ] Detail endpoints return stable payload shapes.
- [ ] Validation errors are explicit.
- [ ] Not-found responses are handled.
- [ ] Permission-denied responses are handled.
- [ ] Backend tests cover happy path.
- [ ] Backend tests cover invalid payloads.
- [ ] Backend tests cover permissions.
- [ ] Backend tests cover no-drift invariants.

### G5 — Frontend service/UI gate

- [ ] Frontend service wrappers exist for every new API call.
- [ ] Services normalize paginated and non-paginated responses where needed.
- [ ] Services expose typed payloads.
- [ ] Pages do not duplicate service-layer URL construction.
- [ ] Pages show loading states.
- [ ] Pages show empty states.
- [ ] Pages show error states.
- [ ] Pages do not crash on partial backend data.
- [ ] Pages do not assume unbuilt endpoints are present.
- [ ] Route pages remain inside existing `/ethikos/*` shell.
- [ ] No second ethiKos shell is introduced.
- [ ] No second theme system is introduced.

### G6 — Smoke gate

- [ ] Frontend app starts locally.
- [ ] Backend app starts locally.
- [ ] Existing ethiKos pages load.
- [ ] Existing Korum/Deliberate pages load.
- [ ] Existing Decide pages load.
- [ ] Existing Trust pages load.
- [ ] Existing Impact pages load.
- [ ] Existing Pulse pages load.
- [ ] Existing Learn pages load.
- [ ] Existing Insights page loads.
- [ ] Existing Admin pages load.
- [ ] New Wave 1 UI controls do not block page render when backend data is empty.
- [ ] Browser console has no new fatal runtime error on primary QA routes.

### G7 — Documentation gate

- [ ] `23_WAVE1_IMPLEMENTATION_BACKLOG.md` is updated with final task status.
- [ ] `24_WAVE1_SLICE_REGISTER.md` is updated with final slice status.
- [ ] `25_WAVE1_QA_CHECKLIST.md` is updated with QA results.
- [ ] Any ADR-relevant decision is reflected in `18_ADR_REGISTER.md`.
- [ ] Any payload change is reflected in `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`.
- [ ] Any API change is reflected in `07_API_AND_SERVICE_CONTRACTS.md`.
- [ ] Any frontend service pattern change is reflected in `14_FRONTEND_ALIGNMENT_CONTRACT.md`.
- [ ] Any backend alignment decision is reflected in `15_BACKEND_ALIGNMENT_CONTRACT.md`.
- [ ] Any known unresolved issue is reflected in `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`.

### G8 — Rollback gate

- [ ] Backend rollback plan exists.
- [ ] Frontend rollback plan exists.
- [ ] Migration rollback risk is documented.
- [ ] Feature toggles or safe fallbacks exist where needed.
- [ ] Existing routes continue to function if new data is absent.
- [ ] Existing API consumers remain compatible.
- [ ] No irreversible data migration is included without explicit approval.

### G9 — Final sign-off gate

- [ ] All blocking QA failures are closed.
- [ ] All accepted partial failures have owners and follow-up tasks.
- [ ] All required tests are run or explicitly marked not runnable in current environment.
- [ ] Manual smoke notes are attached.
- [ ] Reviewer confirms no ownership drift.
- [ ] Reviewer confirms no route drift.
- [ ] Reviewer confirms no source-fact/derived-reading confusion.
- [ ] Reviewer confirms no direct OSS import.
- [ ] Maintainer approves Wave 1 release.

---

## 5. Slice QA matrix

### 5.1 Foundation / no-drift baseline

Files typically involved:

```txt
backend/konnaxion/ethikos/constants.py
backend/konnaxion/ethikos/permissions.py
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/urls.py
backend/config/api_router.py
frontend/services/ethikos.ts
frontend/services/index.ts
frontend/api.ts
```

Checklist:

- [ ] Shared constants do not rename canonical models.
- [ ] Shared permission helpers do not weaken existing permissions.
- [ ] Router style remains DRF-compatible.
- [ ] Service helpers use the existing frontend request pattern.
- [ ] No new feature behavior is introduced outside slice needs.
- [ ] Existing API route tests still pass.
- [ ] Existing frontend services still import correctly.

### 5.2 Korum / Deliberate

Routes/API:

```txt
/ethikos/deliberate/*
/api/ethikos/topics/
/api/ethikos/arguments/
/api/ethikos/stances/
/api/ethikos/categories/
```

Likely files:

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/migrations/*
backend/konnaxion/ethikos/tests.py
frontend/services/deliberate.ts
frontend/services/ethikos.ts
frontend/app/ethikos/deliberate/[topic]/page.tsx
frontend/app/ethikos/deliberate/elite/page.tsx
frontend/app/ethikos/deliberate/guidelines/page.tsx
```

Checklist:

- [ ] Argument tree renders with root and child arguments.
- [ ] Argument source data is stored/displayed only as argument metadata.
- [ ] Argument impact votes are argument-level only.
- [ ] Argument impact votes do not change topic stance.
- [ ] Argument suggestions have clear pending/accepted/rejected states.
- [ ] Participant roles do not reveal anonymous/private identities.
- [ ] Visibility settings do not expose hidden arguments to unauthorized users.
- [ ] Preview endpoint returns topic metadata when topic exists.
- [ ] Preview endpoint handles empty argument lists.
- [ ] Preview drawer no longer shows `Preview / No data` for valid topics.
- [ ] Hidden arguments are excluded or marked according to permission.
- [ ] Normal users cannot moderate arguments.
- [ ] Admin/moderator can hide/unhide where authorized.
- [ ] Kialo-style labels remain conceptual; no model rename to `Claim`.
- [ ] No `/kialo` route or backend app is created.

### 5.3 Konsultations / Decide

Routes/API:

```txt
/ethikos/decide/*
/api/ethikos/topics/
/api/ethikos/stances/
```

Likely files:

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/migrations/*
frontend/services/decide.ts
frontend/app/ethikos/decide/public/page.tsx
frontend/app/ethikos/decide/elite/page.tsx
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
```

Checklist:

- [ ] Public participation flow uses existing ethiKos topic/stance semantics.
- [ ] Elite participation flow uses existing ethiKos topic/stance semantics.
- [ ] Ballot-like behavior does not rename `EthikosStance`.
- [ ] Results distinguish raw baseline counts from derived readings.
- [ ] Empty consultation result state is handled.
- [ ] Invalid consultation id is handled.
- [ ] Duplicate user stance behavior is defined and tested.
- [ ] Public and elite result views do not leak restricted context.
- [ ] Methodology page explains baseline vs weighted/derived readings.
- [ ] Decide pages do not call `/api/home/*` for new Kintsugi decision data.

### 5.4 Smart Vote readings

Routes/API:

```txt
/ethikos/decide/results
/ethikos/insights
/api/kollective/*
/api/ethikos/*
```

Likely files:

```txt
backend/konnaxion/kollective_intelligence/models.py
backend/konnaxion/kollective_intelligence/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/kollective_intelligence/admin.py
backend/konnaxion/kollective_intelligence/migrations/*
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
frontend/services/decide.ts
frontend/services/ethikos.ts
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/insights/page.tsx
```

Checklist:

- [ ] Baseline result exists or is explicitly unavailable.
- [ ] Baseline result is raw and unweighted.
- [ ] Baseline remains visible when readings are shown.
- [ ] Every non-baseline reading has a lens declaration.
- [ ] Every non-baseline reading has a stable `lens_hash`.
- [ ] Every EkoH-derived reading has a `snapshot_ref`.
- [ ] Reading payload stores `computed_at`.
- [ ] Reading payload stores source event counts.
- [ ] Reading payload stores result payload.
- [ ] Reading payload stores audit payload.
- [ ] Published readings are not silently recomputed in place.
- [ ] Smart Vote does not mutate Korum records.
- [ ] Smart Vote does not mutate Konsultations records.
- [ ] Weighted values are clearly displayed as derived.
- [ ] Individual private EkoH scores are not exposed publicly.
- [ ] Tests prove `ReadingResult` is not treated as a source fact.

### 5.5 EkoH trust/context

Routes/API:

```txt
/ethikos/trust/*
/ethikos/insights
EkoH context APIs
```

Likely files:

```txt
backend/konnaxion/ekoh/models/*
backend/konnaxion/ekoh/serializers/*
backend/konnaxion/ekoh/services/*
backend/konnaxion/ekoh/views/*
backend/konnaxion/ekoh/urls.py
backend/konnaxion/ekoh/admin.py
frontend/app/ethikos/trust/profile/page.tsx
frontend/app/ethikos/trust/badges/page.tsx
frontend/app/ethikos/trust/credentials/page.tsx
frontend/app/ethikos/insights/page.tsx
frontend/services/trust.ts
frontend/services/ethikos.ts
```

Checklist:

- [ ] EkoH is used as context only.
- [ ] EkoH does not mutate votes.
- [ ] EkoH does not mutate stances.
- [ ] EkoH does not mutate ballots.
- [ ] EkoH does not mutate arguments.
- [ ] EkoH is not presented as the voting engine.
- [ ] Public pages do not expose private EkoH scores.
- [ ] Trust badges/credentials are clearly contextual signals.
- [ ] Any EkoH snapshot reference used in readings is auditable.
- [ ] Empty trust/context state is handled.
- [ ] Restricted trust/context data is permission-checked.

### 5.6 Drafting / rationale

Routes/API:

```txt
/ethikos/decide/*
/ethikos/deliberate/*
/ethikos/admin/*
/api/ethikos/*
```

Checklist:

- [ ] Draft entities are not treated as final decisions.
- [ ] Draft versions preserve history.
- [ ] Amendments are linked to the correct draft/version.
- [ ] Rationale packets cite source facts/readings without mutating them.
- [ ] Drafting does not overwrite Korum argument source facts.
- [ ] Drafting does not overwrite Konsultations results.
- [ ] Admin controls are permission-checked.
- [ ] Frontend distinguishes draft, proposed, accepted, published, archived states.

### 5.7 Impact / accountability

Routes/API:

```txt
/ethikos/impact/*
/api/ethikos/*
```

Likely files:

```txt
frontend/services/impact.ts
frontend/app/ethikos/impact/feedback/page.tsx
frontend/app/ethikos/impact/outcomes/page.tsx
frontend/app/ethikos/impact/tracker/page.tsx
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
```

Checklist:

- [ ] Impact records do not make KeenKonnect projects the source of civic truth.
- [ ] Impact tracker links to approved decision/consultation records.
- [ ] Feedback submission uses approved ethiKos endpoints.
- [ ] Outcomes distinguish claimed, observed, verified, and archived states.
- [ ] Empty impact state is handled.
- [ ] Unauthorized users cannot change impact verification state.
- [ ] Rollback preserves existing feedback behavior.

### 5.8 Pulse / civic health

Routes/API:

```txt
/ethikos/pulse/*
/api/ethikos/*
/api/kollective/*
```

Likely files:

```txt
frontend/services/pulse.ts
frontend/app/ethikos/pulse/overview/page.tsx
frontend/app/ethikos/pulse/live/page.tsx
frontend/app/ethikos/pulse/health/page.tsx
frontend/app/ethikos/pulse/trends/page.tsx
```

Checklist:

- [ ] Pulse indicators are projections, not source facts.
- [ ] Pulse does not mutate topics, stances, arguments, ballots, or readings.
- [ ] Live view degrades safely without realtime support.
- [ ] Health view explains metric source.
- [ ] Trends view handles empty history.
- [ ] No WebSocket/realtime rewrite is introduced without later contract.
- [ ] No GraphQL rewrite is introduced.

### 5.9 Learn / public explanation

Routes/API:

```txt
/ethikos/learn/*
/ethikos/decide/methodology
```

Likely files:

```txt
frontend/services/learn.ts
frontend/app/ethikos/learn/changelog/page.tsx
frontend/app/ethikos/learn/glossary/page.tsx
frontend/app/ethikos/learn/guides/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
```

Checklist:

- [ ] Glossary preserves canonical current model names.
- [ ] Guides explain Kialo terms as conceptual mappings only.
- [ ] Guides explain baseline vs derived Smart Vote readings.
- [ ] Guides explain EkoH as context only.
- [ ] Changelog records Wave 1 changes.
- [ ] Learn pages do not claim unbuilt features are live.
- [ ] Learn pages do not introduce unsupported route names.

### 5.10 Insights / interpretation

Routes/API:

```txt
/ethikos/insights
/api/ethikos/*
/api/kollective/*
EkoH context APIs
```

Checklist:

- [ ] Insights distinguish facts, projections, and readings.
- [ ] Insights shows baseline where weighted readings are displayed.
- [ ] Insights does not expose private EkoH scores.
- [ ] Insights handles unavailable readings.
- [ ] Insights handles unavailable EkoH context.
- [ ] Insights does not recompute published readings client-side.
- [ ] Insights links each derived result to its lens/snapshot/audit context when available.

### 5.11 Admin / governance

Routes/API:

```txt
/ethikos/admin/*
/api/ethikos/*
/api/kollective/*
EkoH context APIs
```

Likely files:

```txt
frontend/services/admin.ts
frontend/app/ethikos/admin/audit/page.tsx
frontend/app/ethikos/admin/moderation/page.tsx
frontend/app/ethikos/admin/roles/page.tsx
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/kollective_intelligence/admin.py
backend/konnaxion/ekoh/admin.py
```

Checklist:

- [ ] Audit page distinguishes source events from derived reading events.
- [ ] Moderation page can review/hide/unhide only authorized entities.
- [ ] Role page cannot be used by normal users.
- [ ] Role changes are auditable.
- [ ] Reading publication/invalidation is restricted.
- [ ] EkoH context controls do not mutate votes/stances/ballots.
- [ ] Admin services do not use unmapped placeholder endpoints without fallback.
- [ ] Admin UI handles empty audit/moderation/role data safely.

---

## 6. Required automated checks

Record the exact command and result.

### 6.1 Backend

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate --plan
python manage.py test konnaxion.ethikos
python manage.py test konnaxion.kollective_intelligence
python manage.py test konnaxion.ekoh
```

If the project uses `pytest`:

```bash
cd backend
pytest
pytest backend/konnaxion/ethikos
pytest backend/konnaxion/kollective_intelligence
pytest backend/konnaxion/ekoh
```

Results:

```txt
python manage.py check:
python manage.py makemigrations --check --dry-run:
python manage.py migrate --plan:
backend tests:
known failures:
```

### 6.2 Frontend

```bash
cd frontend
npm install
npm run lint
npm run typecheck
npm run build
```

If Playwright/smoke tests are configured:

```bash
cd frontend
npm run test:e2e
npm run smoke
```

Results:

```txt
npm run lint:
npm run typecheck:
npm run build:
npm run test:e2e:
npm run smoke:
known failures:
```

### 6.3 Static no-drift grep checks

Run from repository root.

```bash
grep -R "api/kialo\|/api/kialo\|ethikos/kialo\|app/kialo" -n backend frontend docs || true
grep -R "api/kintsugi\|/api/kintsugi\|app/kintsugi" -n backend frontend docs || true
grep -R "api/deliberation\|/api/deliberation" -n backend frontend docs || true
grep -R "api/home" -n backend frontend docs || true
grep -R "class Claim\|ClaimViewSet\|ClaimSerializer" -n backend frontend docs || true
```

Expected:

- No new `/api/kialo/*`.
- No new `/api/kintsugi/*`.
- No new `/api/deliberation/*`.
- No expanded `/api/home/*` Kintsugi behavior.
- No replacement of `EthikosArgument` with `Claim`.

Results:

```txt
/api/kialo grep:
api/kintsugi grep:
/api/deliberation grep:
/api/home grep:
Claim rename grep:
```

---

## 7. Required manual smoke paths

Use local frontend and backend URLs.

### 7.1 Deliberate

- [ ] `/ethikos/deliberate/elite` loads.
- [ ] Topic preview drawer opens.
- [ ] Valid topic preview does not show `Preview / No data`.
- [ ] `/ethikos/deliberate/[topic]` loads for a valid topic.
- [ ] Argument list/tree renders.
- [ ] Empty argument state renders.
- [ ] Add argument flow works or fails with clear validation.
- [ ] Add stance flow works or fails with clear validation.
- [ ] Argument impact vote control is not confused with topic stance.

### 7.2 Decide

- [ ] `/ethikos/decide/public` loads.
- [ ] `/ethikos/decide/elite` loads.
- [ ] `/ethikos/decide/results` loads.
- [ ] `/ethikos/decide/methodology` loads.
- [ ] Baseline/raw results are visible.
- [ ] Derived readings, if present, are labelled as derived.
- [ ] Empty consultation state renders.

### 7.3 Trust

- [ ] `/ethikos/trust/profile` loads.
- [ ] `/ethikos/trust/badges` loads.
- [ ] `/ethikos/trust/credentials` loads.
- [ ] EkoH context is displayed as context only.
- [ ] Private scores are not exposed publicly.

### 7.4 Impact

- [ ] `/ethikos/impact/feedback` loads.
- [ ] `/ethikos/impact/outcomes` loads.
- [ ] `/ethikos/impact/tracker` loads.
- [ ] Impact records link to approved source objects.
- [ ] Empty impact state renders.

### 7.5 Pulse

- [ ] `/ethikos/pulse/overview` loads.
- [ ] `/ethikos/pulse/live` loads.
- [ ] `/ethikos/pulse/health` loads.
- [ ] `/ethikos/pulse/trends` loads.
- [ ] Pulse projections are labelled as projections.
- [ ] Empty signal state renders.

### 7.6 Learn

- [ ] `/ethikos/learn/changelog` loads.
- [ ] `/ethikos/learn/glossary` loads.
- [ ] `/ethikos/learn/guides` loads.
- [ ] Learn pages do not advertise unbuilt features as live.
- [ ] Glossary preserves canonical model names.

### 7.7 Insights

- [ ] `/ethikos/insights` loads.
- [ ] Baseline results are visible where readings are shown.
- [ ] Lens/snapshot/audit metadata is visible where available.
- [ ] Empty insights state renders.
- [ ] Private EkoH data is not exposed.

### 7.8 Admin

- [ ] `/ethikos/admin/audit` loads for authorized users.
- [ ] `/ethikos/admin/moderation` loads for authorized users.
- [ ] `/ethikos/admin/roles` loads for authorized users.
- [ ] Unauthorized users are denied.
- [ ] Moderation actions are permission-checked.
- [ ] Role changes are permission-checked.
- [ ] Reading publication/invalidation is permission-checked.

---

## 8. Data invariant checklist

These invariants must hold in tests or review evidence.

```txt
EthikosTopic = canonical topic/debate/consultation container.
EthikosStance = topic-level stance.
EthikosArgument = argument/thread/claim-equivalent object.
ArgumentImpactVote = argument-level impact signal.
ReadingResult = Smart Vote derived reading artifact.
LensDeclaration = declared rules for a non-baseline reading.
EkoH snapshot_ref = context/audit reference, not vote mutation.
Baseline result = raw/unweighted source-derived result.
```

Checklist:

- [ ] `EthikosStance != ArgumentImpactVote`.
- [ ] `EthikosStance != ReadingResult`.
- [ ] `ArgumentImpactVote != ReadingResult`.
- [ ] `ReadingResult` cannot overwrite baseline result.
- [ ] `ReadingResult` cannot overwrite source topic/stance/argument records.
- [ ] EkoH context cannot overwrite source votes/stances/ballots.
- [ ] Weighted results cannot be stored as canonical consultation result.
- [ ] Kialo-style concepts do not rename ethiKos core models.

---

## 9. Permission matrix checklist

| Actor | May create stance | May create argument | May create argument impact vote | May suggest argument | May moderate | May assign roles | May publish reading | May compute reading |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Anonymous public | TBD | TBD | TBD | TBD | No | No | No | No |
| Authenticated user | Yes | Yes | Yes | Yes, if enabled | No | No | No | No |
| Moderator | Yes | Yes | Yes | Yes | Yes | Limited/TBD | No/TBD | No |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes, if authorized | No/TBD |
| System/compute actor | No | No | No | No | No | No | No/TBD | Yes |

QA checks:

- [ ] Matrix is confirmed against actual implementation.
- [ ] Any `TBD` is resolved before release or explicitly deferred.
- [ ] Tests cover normal user restrictions.
- [ ] Tests cover moderator/admin privileges.
- [ ] Tests cover system/compute separation where applicable.

---

## 10. Regression checklist

- [ ] Existing `EthikosTopic` creation still works.
- [ ] Existing `EthikosStance` creation still works.
- [ ] Existing `EthikosArgument` creation still works.
- [ ] Existing category behavior still works where enabled.
- [ ] Existing Kollective vote behavior still works.
- [ ] Existing Decide result aggregation still works.
- [ ] Existing Learn glossary/changelog/guides still render.
- [ ] Existing ethiKos shell/sidebar/navigation still render.
- [ ] Existing admin pages still render.
- [ ] Existing tests unrelated to Kintsugi are not broken.
- [ ] No unrelated module behavior is changed.

---

## 11. Known bug validation

### Preview drawer bug

Known issue:

```txt
Deliberate preview drawer shows "Preview / No data" for valid topic previews.
```

Acceptance:

- [ ] Valid topic with no arguments shows topic metadata and empty argument state.
- [ ] Valid topic with arguments shows topic metadata and argument preview.
- [ ] Invalid topic shows not-found/error state.
- [ ] Network failure shows clear error state.
- [ ] Fix does not create new architecture or new route family.
- [ ] Fix does not bypass frontend service layer.

---

## 12. Rollback checklist

For each merged slice:

```txt
slice:
migration files:
backend files:
frontend files:
docs files:
rollback command:
data risk:
fallback UI:
owner:
```

Checks:

- [ ] Slice can be reverted without deleting existing source facts.
- [ ] Migration rollback is understood.
- [ ] Existing routes still work without new records.
- [ ] Frontend handles missing new fields.
- [ ] Rollback notes are included in patch/release notes.
- [ ] Any non-reversible migration has explicit maintainer approval.

---

## 13. QA evidence record

Use this table for the final review.

| Gate | Status | Evidence | Owner | Notes |
|---|---|---|---|---|
| G0 Scope | [ ] |  |  |  |
| G1 Source-of-truth | [ ] |  |  |  |
| G2 Route/API | [ ] |  |  |  |
| G3 Migration | [ ] |  |  |  |
| G4 Backend API/test | [ ] |  |  |  |
| G5 Frontend service/UI | [ ] |  |  |  |
| G6 Smoke | [ ] |  |  |  |
| G7 Documentation | [ ] |  |  |  |
| G8 Rollback | [ ] |  |  |  |
| G9 Final sign-off | [ ] |  |  |  |

---

## 14. Final Wave 1 sign-off

```txt
QA reviewer:
Backend reviewer:
Frontend reviewer:
Architecture/boundary reviewer:
Product/module owner:
Date:
Commit/branch:
Release candidate:
```

Final acceptance:

- [ ] All global gates are passed or explicitly waived.
- [ ] All slice checklists are passed or explicitly deferred.
- [ ] All automated checks are passed or failures are documented.
- [ ] All manual smoke paths are checked.
- [ ] All rollback notes are complete.
- [ ] All documentation updates are complete.
- [ ] No route drift.
- [ ] No model rename drift.
- [ ] No source-fact/reading confusion.
- [ ] No unauthorized OSS import.
- [ ] Wave 1 is approved for merge/release.

---

## 15. Final rejection triggers

Reject the release if any of these are true:

```txt
Creates /kialo route family.
Creates /kintsugi route family as implementation target.
Creates konnaxion.kialo.
Creates konnaxion.kintsugi.
Renames EthikosArgument to Claim.
Renames EthikosStance to Vote or Opinion.
Treats ArgumentImpactVote as EthikosStance.
Treats ReadingResult as source fact.
Uses Smart Vote to mutate Korum records.
Uses Smart Vote to mutate Konsultations records.
Uses EkoH as voting engine.
Expands /api/home/* for Kintsugi decision data.
Imports external OSS app directly.
Introduces schema changes without migration/testing plan.
Introduces unreviewed route families.
Breaks existing ethiKos route rendering.
Breaks existing ethiKos API endpoints.
Publishes weighted results as canonical baseline facts.
Leaks private EkoH scores in public payloads.
```

Any rejection trigger requires either:

1. code change before merge; or
2. explicit ADR superseding the current Kintsugi contracts.
