# Konnaxion — Boundaries and Ownership

## 1. Konnaxion boundary

Konnaxion owns its domain data and executes mutations through its own services/APIs. A foreign tool or ecosystem system may request work, provide an artifact, ask a query, or consume a result; it does not write Konnaxion internal tables directly.

## 2. Internal ownership

### ethiKos / Korum

Owns the structured deliberation source state represented in the current code by objects including:

- `EthikosTopic`;
- `EthikosStance`;
- `EthikosArgument`;
- `EthikosCategory`;
- `ArgumentSource`;
- `ArgumentImpactVote`;
- `ArgumentSuggestion`;
- `DiscussionParticipantRole`;
- `DiscussionVisibilitySetting`.

Rules:

- topic-level stance is distinct from argument-level impact/evaluation;
- arguments and replies form deliberation state, not Smart Vote output;
- moderation and visibility remain ethiKos-owned;
- EkoH/Smart Vote may read declared inputs but do not mutate these records as part of a reading.

### Konsultations

Logical owner of consultation/intake/formal decision source events where that product capability is used.

Rules:

- source ballots are recorded as source facts;
- a Smart Vote lens may interpret them but does not replace them;
- a consultation object is not automatically an Orgo Task;
- decision protocol and workflow orchestration are different concepts.

### EkoH

Canonical backend owner: `konnaxion.ekoh`.

Owns:

- `ExpertiseCategory` taxonomy;
- `UserExpertiseScore`;
- `UserEthicsScore`;
- score configuration/history;
- confidentiality;
- rating visibility and scoped rating access;
- contextual analysis records.

Strong existing behavior to preserve:

- contextual AI analysis is non-authoritative unless governed evidence actually updates score state;
- rating disclosure is resolved through a dedicated deterministic access service;
- expertise remains domain-bounded;
- lack of expertise is not negative merit.

### Smart Vote

Canonical backend owner: `konnaxion.smart_vote`.

Owns:

- `Consultation` as Smart Vote reading/ballot context;
- `ConsultationRelevance`;
- `SourceConsultationBinding`;
- reading computation;
- lens identity;
- reading aggregation/presentation.

For an ethiKos-bound reading, the current correct pattern is:

```text
EthikosTopic / EthikosStance
        ↓ read only
SourceConsultationBinding
        ↓
ConsultationRelevance + EkoH context
        ↓
Smart Vote reading
        ↓
baseline + declared advisory reading
```

The source stance remains owned by ethiKos.

### Kollective Intelligence

`konnaxion.kollective_intelligence` is not a canonical data owner in the current architecture. New EkoH or Smart Vote functionality must not be added there.

### keenKonnect

Owns project/collaboration state in its domain. External recommendations or EkoH displays do not transfer project ownership.

### KonnectED

Owns learning/resources/certification/portfolio state in its domain. Offline packages in this domain are application content packages and must not be confused with Kristal Runtime Packs unless an explicit contract says otherwise.

### Kreative

Owns creative works, galleries, collaboration sessions, traditions/archives and related domain state.

### TeamBuilder

Owns its problem, builder-session, team and team-member state. It is a Konnaxion application/domain capability, not an Orgo Task engine.

### Kontrol

Administrative application surface for Konnaxion moderation, roles/users, audit and platform-level views. Presentation in Kontrol does not move ownership of the underlying domain state.

## 3. Konnaxion ↔ Orgo through Interaction Kernel

The current Konnaxion documentation snapshot does not establish an **active IK-conformant Orgo adapter** as qualified. The supplied Interaction Kernel migration material references an existing/historical `orgo_bridge_*` J30 implementation and `OrgoImpactPublication`; treat that as a compatibility surface to verify in executable code, not as proof of current IK conformance.

The target ecosystem profiles are:

- Konnaxion → Orgo: `governance.decision.execute/1.0.0`, carrying explicit execution intent for an immutable/read-model `DecisionRecord`;
- Orgo → Konnaxion: `accountability.impact.publish/1.0.0`, carrying operational/accountability impact back through a Konnaxion-owned adapter boundary.

No current Konnaxion object is declared identical to an Orgo object.

Required invariant for a future boundary:

```text
Orgo Case ≠ Konnaxion Topic
Orgo Task ≠ Konnaxion Consultation
Orgo status ≠ civic decision status
```

When Orgo requests a Konnaxion operation:

```text
Orgo intent
→ command/job/proposal
→ Konnaxion authentication + validation + domain rules
→ Konnaxion mutation
→ receipt/event/result
→ Orgo workflow reconciliation
```

When Konnaxion requires governed work in Orgo, it emits a request/event; it does not create or edit Orgo Case/Task rows directly.

Interaction Kernel is a distributed protocol, not a shared owner. Konnaxion remains authoritative for civic/governance state and Orgo remains authoritative for Signal/Workflow/Case/Task/IntegrationOperation state.

## 4. Konnaxion ↔ Kristal

No Kristal integration is implemented in the current Konnaxion code snapshot.

If/when Konnaxion consumes a Kristal artifact:

- Kristal owns artifact semantics, identity, epistemic metadata and integrity rules;
- Konnaxion may present/query/transport only according to an explicit profile;
- Konnaxion must not reinterpret assertion status, certainty, validation, authority recognition or Reader Policy;
- Konnaxion does not acquire ownership of local kOA-Linux Runtime Pack activation merely because it can transport or display an artifact.

## 5. Konnaxion ↔ SemantiK Architect

No SemantiK Architect integration is implemented in the current Konnaxion code snapshot.

A future integration is a generation/presentation boundary:

```text
Konnaxion structured input
→ Architect request
→ Architect NLG pipeline
→ surface output + trace/metadata
```

Architect does not write Konnaxion civic state.

## 6. Konnaxion ↔ kOA-Linux

kOA-Linux may host/integrate Konnaxion as a subsystem from the kOA-Linux scope. Konnaxion keeps authority over Konnaxion domain behavior and data.

Platform deployment, host privilege, resource governance and local runtime activation owned by kOA-Linux are not Konnaxion business capabilities.

## 7. K-Port

K-Port is not a peer of Konnaxion. It is an EkoH evidence application/gateway. Evidence entering through K-Port becomes authoritative EkoH state only through EkoH's governed validation/update boundary.
