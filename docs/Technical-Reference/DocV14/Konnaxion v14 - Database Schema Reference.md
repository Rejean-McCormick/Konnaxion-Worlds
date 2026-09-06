# Konnaxion v14 — Database Schema Reference

## Purpose

This reference identifies **canonical ownership and major current model families**. It does not duplicate every migration field; the Django models and migrations remain the executable physical schema.

## 1. users

Canonical owner: `konnaxion.users`.

Shared user identity is referenced by Konnaxion domain models through `AUTH_USER_MODEL = users.User`.

## 2. ethiKos

Canonical owner: `konnaxion.ethikos`.

Current models:

| Model | Role |
|---|---|
| `EthikosCategory` | topic classification |
| `EthikosTopic` | civic/deliberation topic |
| `EthikosStance` | one user's topic-level stance |
| `EthikosArgument` | argument/reply node |
| `ArgumentSource` | source/evidence attached to argument |
| `ArgumentImpactVote` | argument-level impact evaluation |
| `ArgumentSuggestion` | proposed structured change/contribution |
| `DiscussionParticipantRole` | participant role in a discussion |
| `DiscussionVisibilitySetting` | discussion visibility policy |
| `DemoScenarioImport` | demo-import tracking |

Key invariants:

- `EthikosStance.value` is constrained to `-3..+3`;
- one stance per `(user, topic)`;
- `ArgumentImpactVote` is distinct from `EthikosStance`;
- Smart Vote readings do not rewrite these source rows.

### Alignment issue

`EthikosTopic.expertise_category` currently targets `kollective_intelligence.ExpertiseCategory`; the canonical EkoH taxonomy is `ekoh.ExpertiseCategory`. This relation must be realigned in code/data migrations.

## 3. EkoH

Canonical owner: `konnaxion.ekoh`.

Current model families:

| Model | Role |
|---|---|
| `ExpertiseCategory` | hierarchical expertise taxonomy |
| `UserExpertiseScore` | user/domain expertise score |
| `UserEthicsScore` | governed ethics/reliability context |
| `ScoreConfiguration` | score configuration |
| `ScoreHistory` | score change trace |
| `ConfidentialitySetting` | identity privacy |
| `RatingVisibilitySetting` | rating visibility policy |
| `RatingAccessScope` | hierarchical access scope |
| `RatingScopeSubject` | subject membership in access scope |
| `RatingAccessGrant` | viewer access grant |
| `ContextAnalysisLog` | non-authoritative contextual analysis record |

The EkoH taxonomy and scores are the canonical source for EkoH/Smart Vote contextual expertise. New code must not use `kollective_intelligence` compatibility equivalents as source of truth.

## 4. Smart Vote

Canonical owner: `konnaxion.smart_vote`.

Current models:

| Model | Role |
|---|---|
| `Consultation` | Smart Vote consultation/reading context |
| `ConsultationRelevance` | consultation → EkoH domain relevance |
| `SourceConsultationBinding` | explicit source object → consultation binding |
| `VoteModality` | ballot modality definition |
| `Vote` | current Smart Vote ballot row |
| `VoteResult` | current aggregate row |
| `VoteLedger` | vote ledger record |

### Architectural interpretation

For ethiKos-bound readings, the source of civic truth is `EthikosStance`; `SourceConsultationBinding` references it indirectly through the topic and Smart Vote computes a separate reading.

The fields `Vote.weighted_value` and `VoteResult.sum_weighted_value` must not be treated as universal/canonical civic truth. The code path that creates them requires alignment with the source-fact/derived-reading separation.

## 5. keenKonnect

Canonical owner: `konnaxion.keenkonnect`.

Current model families include projects, project resources, tasks, messages, teams, ratings and tags.

## 6. KonnectED

Canonical owner: `konnaxion.konnected`.

Current model families include:

- certification paths;
- evaluations;
- peer validations;
- portfolios;
- interoperability mappings;
- knowledge resources;
- recommendations;
- learning progress;
- offline packages;
- mentorship;
- co-creation;
- forums.

## 7. Kreative

Canonical owner: `konnaxion.kreative`.

Current model families include:

- tags;
- artworks;
- gallery relations;
- collaboration sessions;
- traditions;
- virtual exhibitions;
- digital archives/documents;
- AI catalogue entries;
- cultural partners.

## 8. TeamBuilder

Canonical owner: `konnaxion.teambuilder`.

Models:

- `Problem`;
- `ProblemChangeEvent`;
- `BuilderSession`;
- `Team`;
- `TeamMember`.

## 9. Shared/admin models

Konnaxion also contains moderation, trust, Kontrol and shared user/platform state. These remain Konnaxion-owned and should not be merged into Orgo/Kristal models merely for integration convenience.

## 10. Physical database scope

The current settings register EkoH and Smart Vote separately and use the `ekoh_smartvote,public` search path for their tables. Physical schema placement does not merge their logical ownership.
