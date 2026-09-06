# 27 — EkoH Rating Visibility and Access Contract

**Status:** Canonical V4.1 extension  
**Approved direction:** 2026-08-20  
**Owner:** EkoH  
**Purpose:** define how individual EkoH ratings may be disclosed without turning EkoH into a second identity/RBAC system.

---

## 1. Decision

EkoH owns three things that must remain distinct:

1. **rating truth** — the current expertise/ethics ratings and their history;
2. **rating disclosure** — whether a viewer may see those EkoH-owned ratings;
3. **rating audit context** — provenance/history attached to the EkoH rating ledger.

EkoH does **not** own civic votes, source stances, Smart Vote readings, organisation HR truth, or platform-wide business roles.

The canonical separation is:

```text
Identity visibility     -> ConfidentialitySetting
Rating visibility       -> RatingVisibilitySetting + scoped grants
Contextual influence    -> Smart Vote declared reading/lens
```

An individual score is not automatically private merely because it is individual. A rating may be intentionally public when governance policy requires public scrutiny, including public/demo roles whose decision-support influence depends on publicly reviewable competence.

A **private** rating remains private. A **public** rating is intentionally disclosed. A **scoped** rating is disclosed only to viewers whose EkoH access grant covers the rated subject.

---

## 2. Non-goals

V4.1 MUST NOT introduce:

- a second Konnaxion identity system;
- a second global RBAC engine;
- EkoH business roles such as `CEO`, `Supervisor`, `Manager`, `Minister`, or `HR`;
- EkoH-owned organisation/department truth;
- a Smart Vote weight stored as a global EkoH profile field;
- direct EkoH writes into Ethikos/Korum/Konsultations source facts.

Calling modules may map their own organisation/team/project concepts to a generic EkoH scope, but EkoH only evaluates disclosure grants.

---

## 3. Canonical models

### 3.1 `RatingVisibilitySetting`

Per-rated-subject publication policy.

```yaml
user: OneToOne(settings.AUTH_USER_MODEL)
visibility: public | scoped | private
publication_basis: string
updated_at: datetime
```

Compatibility rule: if no row exists, current ratings retain the pre-V4.1 behavior and are treated as `public` until an explicit policy is created.

### 3.2 `RatingAccessScope`

Generic reusable hierarchical scope.

```yaml
key: stable slug
name: display label
parent: optional self FK
scope_type: optional semantic hint
external_namespace: optional adapter namespace
external_key: optional external object key
active: boolean
```

No foreign key to Ethikos, Team Builder, KeenKonnect, Kontrol, or any external organisation model is required.

### 3.3 `RatingScopeSubject`

Assigns a rated user to a disclosure scope.

```yaml
scope: FK RatingAccessScope
user: FK settings.AUTH_USER_MODEL
active: boolean
unique: [scope, user]
```

### 3.4 `RatingAccessGrant`

Grants a viewer access to ratings in one scope.

```yaml
viewer: FK settings.AUTH_USER_MODEL
scope: FK RatingAccessScope
include_descendants: boolean
access_level: ratings | history
active: boolean
unique: [viewer, scope]
```

`ratings` exposes current domain ratings and ethics/reliability context.  
`history` additionally exposes the governed `ScoreHistory` projection.

---

## 4. Access resolver

All consuming modules MUST use the EkoH access decision, not reimplement it.

Canonical service:

```python
resolve_rating_access(viewer=viewer, subject=subject)
```

Canonical decision order:

```text
1. self -> history
2. staff compatibility override -> history
3. explicit matching scope grant -> ratings/history
4. public rating policy -> ratings
5. deny
```

`private` is stricter than `scoped`: scope grants do not override a private policy.

An ancestor grant applies to a descendant scope only when `include_descendants=true`.

Example:

```text
ACME
├── Department A
│   ├── Alice
│   └── Bob
└── Department B
    └── Eve

Boss grant        -> ACME, descendants=true, history
Supervisor A      -> Department A, descendants=true, ratings
```

Result:

```text
Boss              -> Alice, Bob, Eve
Supervisor A      -> Alice, Bob only
ordinary employee -> self + public profiles
```

EkoH does not need to know that one viewer is a boss and another is a supervisor.

---

## 5. Identity visibility is separate

`ConfidentialitySetting` continues to control identity presentation:

```text
public
pseudonym
anonymous
```

`RatingVisibilitySetting` controls rating disclosure:

```text
public
scoped
private
```

These settings MUST NOT be collapsed into one enum.

An anonymous identity remains non-discoverable to ordinary callers even if a rating policy is otherwise public, because rating disclosure must not defeat the stronger identity-protection decision.

---

## 6. Public figures and public roles

A public individual rating is permitted when its publication policy explicitly declares it.

The public-policy rule is:

> If EkoH-derived competence materially supports public decision-making influence, the governance basis for that influence may itself be made public and auditable.

This does not create a universal rank. EkoH remains domain-specific. A high software-architecture rating does not imply authority in diplomacy, law, education, Indigenous governance, or another unrelated domain.

`publication_basis` SHOULD explain why the rating is public.

---

## 7. API contract

Canonical endpoint remains:

```text
GET /api/v1/ekoh/profile/{user_id}/
```

Allowed response:

```json
{
  "user_id": 42,
  "display_name": "Example Person",
  "confidentiality_level": "public",
  "rating_visibility": "scoped",
  "rating_publication_basis": "",
  "rating_access": {
    "allowed": true,
    "level": "ratings",
    "reason": "scope_grant",
    "scope": {
      "key": "acme-department-a",
      "name": "Department A"
    }
  },
  "ethics_score": 0.97,
  "expertise": [
    {
      "domain_code": "0613",
      "domain_name": "Software and applications",
      "weighted_score": 0.91
    }
  ],
  "score_history": null
}
```

Denied rating access is represented without leaking the ratings:

```json
{
  "rating_access": {
    "allowed": false,
    "level": null,
    "reason": "outside_authorized_scope",
    "scope": null
  },
  "ethics_score": null,
  "expertise": null,
  "score_history": null
}
```

The backend is authoritative. Frontend code MUST NOT infer access from role labels or hide data that the backend already exposed as an authorization substitute.

---

## 8. Smart Vote boundary

Smart Vote may compute a declared reading from EkoH context, but EkoH does not become the vote engine.

Smart Vote MUST preserve:

- raw baseline source facts;
- declared lens/snapshot context;
- reproducibility;
- separation between rating and contextual advisory influence.

Participant-level reading details derived from EkoH MUST respect EkoH disclosure before being returned to the caller. Aggregate Smart Vote results may still be computed from the declared lens without disclosing private individual ratings.

The following are distinct values:

```text
EkoH domain rating
EkoH ethics/reliability context
question-specific expertise alignment
Smart Vote advisory weight
```

They MUST NOT be presented as synonyms.

---

## 9. Frontend contract

Reusable EkoH UI belongs under:

```text
frontend/services/ekoh.ts
frontend/modules/ekoh/components/
```

Ethikos may compose EkoH UI with Smart Vote context, but the reusable EkoH components MUST NOT import Smart Vote.

Canonical reusable components in V4.1:

```text
EkohRatingDrawer
EkohDomainRatings
EkohAccessNotice
```

A consuming module may add context-specific content after the generic rating display.

---

## 10. Migration contract

V4.1 uses one additive EkoH migration.

It MUST:

- create only EkoH-owned access/disclosure tables;
- preserve existing `UserExpertiseScore`, `UserEthicsScore`, `ScoreHistory`, and `ConfidentialitySetting` rows;
- preserve existing profile URLs;
- preserve pre-V4.1 readable-profile behavior when no explicit rating policy exists;
- use the existing `ekoh_smartvote` schema/search-path contract.

It MUST NOT rename or move existing score tables.

---

## 11. Minimum test matrix

Required automated cases:

```text
public profile + anonymous viewer -> ratings visible
private profile + self -> history visible
private profile + other viewer -> denied
scoped Department A + Supervisor A -> visible
scoped Department B + Supervisor A -> denied
company root + descendant grant -> all child departments visible
history grant -> ScoreHistory visible
ratings grant -> ScoreHistory hidden
Smart Vote participant detail -> filtered through EkoH disclosure
aggregate baseline/reading -> unchanged by display permission
```

---

## 12. Final contract statement

```text
EkoH owns the rating.
EkoH owns disclosure of the rating.
The consuming application owns the context in which the rating is requested.
Smart Vote alone owns the derived influence of that rating on a declared reading.
```

This contract extends the existing Kintsugi ownership rules; it does not replace them.
