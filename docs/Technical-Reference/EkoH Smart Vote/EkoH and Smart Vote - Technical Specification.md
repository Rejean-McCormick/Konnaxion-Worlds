# EkoH and Smart Vote — Technical Specification

## 1. Ownership

```text
ethiKos / consultation owner   source participation facts
EkoH                           expertise / ethics / access context
Smart Vote                     lens + derived reading
```

These responsibilities remain separate even when their tables share a PostgreSQL search-path scope.

## 2. EkoH code

Primary packages:

```text
backend/konnaxion/ekoh/models/
backend/konnaxion/ekoh/services/
backend/konnaxion/ekoh/views/
```

Important services:

- `multidimensional_scoring.py` — domain score computation;
- `contextual_analysis.py` — non-authoritative analysis intake;
- `rating_access.py` — disclosure policy authority.

## 3. Smart Vote code

Primary packages:

```text
backend/konnaxion/smart_vote/models/
backend/konnaxion/smart_vote/services/
backend/konnaxion/smart_vote/views/
backend/konnaxion/smart_vote/tasks/
```

Important reading path:

- `SourceConsultationBinding` explicitly binds a source object to a Smart Vote consultation;
- `ConsultationRelevance` defines relevant EkoH domains;
- `reading_service.py` reads ethiKos stances and EkoH context;
- `EthikosTopicReadingView` exposes the derived reading.

## 4. Current strong alignment

The following existing behaviors should remain:

- ethiKos stances are read-only inputs to the reading service;
- a source binding is explicit rather than guessed by title;
- lens identity is content-hashed;
- EkoH input identity is hashed into `snapshot_ref`;
- baseline and advisory result are separate;
- advisory exclusions do not delete source stances;
- participant details are filtered by server-side rating access;
- contextual AI analysis does not silently mutate expertise scores.

## 5. Remaining implementation alignment

The older Smart Vote ballot/aggregation path still stores `weighted_value` directly on `Vote` and aggregates it into `VoteResult`. That path must be reconciled with the reading architecture so that a source ballot and a derived reading are not the same stored object.

The UI must not present a global `Smart Vote Weight`. Smart Vote influence is contextual to an explicit consultation/lens; implementation exceptions are listed in `../CODE_ALIGNMENT_NOTES.md`.

See `../CODE_ALIGNMENT_NOTES.md` for exact paths.
