# Accounts, Personas, EkoH and Smart Vote

## 1. Two identity layers

### Platform Principal

Real authentication identity:

```text
request.user = Réjean / admin
```

Global across Worlds.

### World Persona

Identity represented inside the World:

```text
Carol Gould
Omar Dahbour
Citizen 001
Hydro Expert 03
```

World-specific.

The World toggle changes which Personas are visible. It does not log the principal out or authenticate as a Persona.

## 2. v1 compatibility bridge

Current Konnaxion source models use `AUTH_USER_MODEL`.

A full actor abstraction would be invasive.

Therefore v1 may create global Persona Bridge Users with collision-proof names:

```text
w_cuny__carol_gould
w_cuny__omar_dahbour
w_hydro__expert_03
```

Rules:
- never reuse a raw username from a seed as global identity;
- seed `actor.key` is stable logical identity;
- internal username is generated from World + actor key;
- human display name is separate;
- bridge users must not be reset/deleted casually;
- cleanup checks every World reference.

## 3. World participant discovery

Do not populate "accounts" pages by listing all global persona bridge users.

Use World-local membership/persona mapping:

```text
World
→ WorldPersona
→ bridge User
→ World-local EkoH / content
```

Therefore switching World changes the visible account population.

## 4. EkoH

EkoH remains owned by `konnaxion.ekoh`.

World isolation changes storage context, not domain semantics.

Within a World:
- expertise is domain-bounded;
- lack of expertise is not negative merit;
- contextual AI analysis remains non-authoritative unless governed evidence updates score state;
- rating visibility/access remains server-side;
- ethics and expertise remain distinct.

Same bridge user may theoretically participate in multiple Worlds but receives independent EkoH rows because the EkoH schemas differ.

## 5. EkoH taxonomy

Each WorldRelease EkoH schema loads the canonical taxonomy fixture.

This keeps local FK resolution deterministic.

Do not create different meanings for the same ISCED code per World without an explicit separate taxonomy extension contract.

## 6. Smart Vote

Smart Vote remains owned by `konnaxion.smart_vote`.

Within one WorldRelease:

```text
Ethikos source state
        ↓ read-only
SourceConsultationBinding
        ↓
World-local ConsultationRelevance
        +
World-local EkoH
        ↓
Smart Vote reading
```

Mandatory:
- source and reading remain separate;
- reading carries World/Release context;
- no cross-World source binding;
- no global weight;
- no weighted value written back to ethiKos or consultation source ballots.

## 7. View As

Suggested UI:

```text
WORLD   [ CUNY Philosophy ▼ ]
VIEW AS [ Public Viewer      ▼ ]
```

Possible View As identities:
- public viewer;
- moderator;
- Carol Gould;
- Omar Dahbour;
- expert.

Requirements:
- `request.user` remains real principal;
- permissions remain those of the principal plus explicit presenter simulation policy;
- visible banner while View As is active;
- audit start/stop;
- never use real credentials of the represented person;
- represented philosopher positions must remain sourced/reconstructed, not impersonated as live endorsement.

## 8. Persona authorship metadata

For demo/seeding use, argument authorship should distinguish:

```text
representation_type: reconstructed_position
source_basis: [...]
generated_by: seed/editor/AI
```

This is especially important when the Persona is a real scholar.

Ethikos should not falsely imply the person personally posted the seeded message.
