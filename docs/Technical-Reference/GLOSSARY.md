# Konnaxion — Architectural Glossary

## Konnaxion

**Konnaxion** is an **ecosystem system** in the kOA Digital Ecosystem. In its own scope it is also a **platform** because it contains multiple product domains, applications, services and shared capabilities.

When hosted or integrated by kOA-Linux, Konnaxion may be called a **subsystem from the kOA-Linux scope**. That host-relative term does not transfer Konnaxion's internal authority.

## Module

`module` is a generic product/UI word, not a sufficient architecture category.

Within Konnaxion, existing UI and documentation may use `module` for named product areas. In normative architecture text, prefer the exact category:

```text
module
→ domain
→ application
→ service
→ component
→ gateway
→ interface surface
```

Examples:

- Konnaxion: ecosystem system / platform.
- ethiKos: Konnaxion civic domain and application surface.
- EkoH: Konnaxion domain/service boundary for expertise, ethics, privacy and rating access.
- Smart Vote: Konnaxion derived-reading/aggregation boundary.
- Kontrol: Konnaxion administrative application surface.
- Reports: cross-domain reporting application surface.
- K-Port: EkoH evidence application/gateway; not a peer of Konnaxion.

## Domain

A **domain** owns a coherent set of business semantics and authoritative state. A domain can be physically implemented by one Django app, several apps, or shared infrastructure.

Logical domain boundaries do not require one database per domain, but they require explicit write ownership.

## Application

An **application** is a bounded software/user-facing capability. It can present or mediate a domain without owning every state it displays.

## Service

A **service** is an executable capability with an API/function/task boundary. A service should mutate only state owned by its domain.

## Gateway

A **gateway** accepts/transforms/transports data at a declared boundary. A gateway does not become the owner of the downstream authoritative state.

## Source fact

A **source fact** is an authoritative event/state owned by the domain that captured it. Examples include an ethiKos stance or a consultation ballot.

## Baseline

A **baseline** is the direct, declared aggregation/view of the relevant source facts without a contextual Smart Vote lens silently replacing them.

## Reading

A **reading** is a derived interpretation of source facts under an explicit method/lens.

```text
Reading = f(SourceFacts, LensDeclaration, SnapshotContext?)
```

A reading should identify its target, method/lens, input snapshot when applicable, computation time and result payload.

## Lens

A **lens** declares the method and contextual assumptions used to produce a reading. A lens is not truth and does not transfer ownership of source facts.

## EkoH snapshot

A content-identifiable set of EkoH contextual inputs used for a reading. If a reading is presented as published/replayable, the referenced snapshot must itself be retrievable or otherwise reproducible.

## Korum

**Korum** is the logical structured-deliberation sub-domain inside ethiKos. Current physical implementation is primarily inside `konnaxion.ethikos` rather than a separate Django app.

## Konsultations

**Konsultations** is the logical consultation/intake/decision sub-domain inside the Konnaxion civic surface. It owns formal source participation/ballot semantics when such a protocol is used. It must not be equated automatically with an Orgo Task or with a Smart Vote reading.

## EkoH

**EkoH** owns contextual expertise, ethics/reliability, confidentiality/rating visibility, evidence-derived score state and related access policy. It does not own civic ballots or final decision protocols.

## Smart Vote

**Smart Vote** owns declared derived readings, lens semantics and reading aggregation. It may consume EkoH context and source participation facts through explicit bindings. It must not silently rewrite those sources.

## Kollective Intelligence

**Kollective Intelligence** is retained as a product/navigation umbrella. It is **not the canonical backend owner** for EkoH or Smart Vote state. Canonical code ownership is split between `konnaxion.ekoh` and `konnaxion.smart_vote`.

## External ecosystem system

Orgo, Kristal, SemantiK Architect and kOA-Linux are external ecosystem systems relative to the Konnaxion domain. Integration does not give them direct write access to Konnaxion internal state.
