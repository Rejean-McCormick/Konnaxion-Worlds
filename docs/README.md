# Konnaxion — Documentation

## Scope

Konnaxion is an **ecosystem system** of the kOA Digital Ecosystem and a **platform** in its own product scope. It owns its civic/public domain state and its application surfaces. It is not the kOA Digital Ecosystem itself, and it does not absorb the authority of Orgo, Kristal, SemantiK Architect or kOA-Linux when integrated with them.

Within Konnaxion, the word **module** is only a convenient product/UI term. Architecture documents use the more precise terms **domain**, **application**, **service**, **component**, **gateway** and **external ecosystem system**.

## Canonical reading order

1. `Technical-Reference/DocV14/Konnaxion v14 - Full-Stack Technical Specification.md`
2. `Technical-Reference/GLOSSARY.md`
3. `Technical-Reference/BOUNDARIES_AND_OWNERSHIP.md`
4. `Technical-Reference/CONTRACTS.txt`
5. `Technical-Reference/EkoH Smart Vote/EkoH and Smart Vote - Technical Specification.md`
6. `Technical-Reference/CODE_ALIGNMENT_NOTES.md`
7. `Technical-Reference/DocV14/Konnaxion v14 - Site Navigation Map.md`
8. `Konnaxion_User_Workflows.md`

## Architectural invariants

- One authoritative owner per state.
- No direct write across ownership boundaries.
- Source facts and derived readings are distinct.
- A reading never retroactively becomes a source fact.
- EkoH context does not become a civic vote.
- Smart Vote does not silently replace a public baseline.
- External systems integrate through explicit contracts, not shared internal tables.
- Presentation does not transfer authority.
- A Konnaxion deployment inside kOA-Linux remains Konnaxion-owned at the domain level.

## Core Konnaxion rule

> **Single Truth, Multiple Readings.**

A stable source event or civic state may be interpreted through one or more explicitly declared readings. The reading identifies the method and context used to derive it; it does not mutate the source.
