# EkoH — System Overview

## Purpose

EkoH is Konnaxion's contextual expertise, ethics/reliability and rating-access domain.

It answers questions such as:

- what expertise domains are demonstrated by a participant;
- what evidence/rules produced a score;
- what rating detail a viewer is allowed to see;
- what contextual snapshot may be used by a declared Smart Vote reading.

EkoH does **not** decide civic outcomes and does not own source ballots or ethiKos stances.

## Canonical backend

```text
backend/konnaxion/ekoh/
```

Canonical model families:

- expertise taxonomy;
- per-user/domain expertise score;
- ethics/reliability context;
- score configuration/history;
- confidentiality;
- rating visibility/access scopes/grants;
- contextual analysis log.

## Expertise

Expertise is domain-bounded. A score in one domain does not create universal authority in another.

The current scoring service normalizes evidence axes to `0..1` and computes a domain score. Absence of expertise is neutral, not negative merit.

## Context analysis

The current code correctly treats AI-assisted contextual analysis as a proposal/analysis record. It does not directly mutate authoritative expertise scores.

## Privacy and rating access

Identity confidentiality and rating visibility are separate.

`resolve_rating_access()` is the current server-side disclosure authority and resolves:

1. self;
2. staff;
3. scoped access grants;
4. public policy;
5. deny.

## Relationship to Smart Vote

```text
EkoH context
   ↓
explicit snapshot / current contextual input
   ↓
Smart Vote lens
   ↓
derived reading
```

EkoH supplies context. Smart Vote owns the reading. The source civic domain owns the source participation event.
