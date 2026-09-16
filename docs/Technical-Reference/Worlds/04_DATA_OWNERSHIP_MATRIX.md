# Data Ownership Matrix

This matrix defines **target ownership**, not the exact migration order.

| Domain / data | Target scope | Notes |
|---|---|---|
| Real authentication principal | Global | `request.user`, admin/developer identity |
| Sessions/auth credentials | Global | Never switched by World toggle |
| World registry / releases | Global control plane | Owned by `konnaxion.worlds` |
| World permissions/membership | Global control plane | Access relationship to Worlds |
| Control-plane audit | Global | World/release IDs recorded |
| ethiKos topics | World | Source civic state |
| ethiKos stances | World | Source state |
| ethiKos arguments/sources | World | Source deliberation state |
| ethiKos moderation/visibility | World | Same owner as ethiKos |
| Konsultations source ballots | World | Raw ballots remain source facts |
| EkoH taxonomy | World release fixture | Loaded from canonical fixture |
| EkoH expertise score | World | Same person may differ across Worlds |
| EkoH ethics context | World | Never globalized by convenience |
| EkoH history/access/visibility | World | Disclosure remains server-side |
| Smart Vote source binding | World | Must bind within same World |
| Smart Vote relevance | World | World-local lens context |
| Smart Vote reading/result | World-derived | Never mutates source |
| Konsensus polls/votes | World | World-specific voting context |
| keenKonnect projects/workspaces | World | Unless a future explicit shared contract exists |
| KonnectED World resources | World | Shared catalog must be explicit |
| Kreative content | World | Default World-local |
| TeamBuilder state | World | Problems/sessions/teams |
| Search index | World-derived | Namespaced by World/Release |
| Embeddings | World-derived | Metadata/namespace required |
| Reports/analytics | World-derived | Must identify World |
| World media/attachments | World | Namespaced storage path |
| Platform deployment settings | Global | Infrastructure |
| Existing external systems | External | Orgo/Kristal/etc. ownership rules unchanged |

## 1. No accidental sharing

A table becomes shared only by an explicit architectural decision.

Do not make data global because:
- it is inconvenient to migrate;
- two seeds happen to use the same display name;
- a foreign key currently points to a global model;
- one demo happens to work when objects are reused.

## 2. Persona bridge exception

Current models often use `AUTH_USER_MODEL`.

v1 may retain persona bridge users globally while all World-specific content and EkoH context stays in World schemas.

This is an explicit compatibility exception, not a statement that persona state is globally owned.

Requirements:
- namespaced username;
- World membership;
- no cross-World update by natural key;
- display name separate from internal username;
- cleanup only when no World references remain.

## 3. Canonical fixture rule

ISCED/EkoH taxonomy may be loaded into every EkoH schema from the same canonical fixture.

This provides deterministic local resolution:

```text
ExpertiseCategory.objects.filter(code=domain_code)
```

without making mutable scores shared across Worlds.

## Ecosystem boundary ownership

| State / concern | Authoritative owner | Worlds rule |
|---|---|---|
| Konnaxion civic/domain state | Konnaxion domain owner | World-scoped where declared by this matrix |
| World / WorldRelease / Seed Pack registry / Snapshot | Konnaxion Worlds | Never transferred to Orgo/Kristal/IK |
| IK transport/envelope semantics | Interaction Kernel protocol | Protocol does not own domain state |
| Orgo Signal/Workflow/Case/Task/IntegrationOperation | Orgo | Not aliases of World or civic objects |
| Kristal epistemic artifacts | Kristal | Not aliases of Seed Pack/WorldRelease/Snapshot |
| Physical Runtime Pack activation when kOA-Linux is present | kOA-Linux | Worlds promotion must not duplicate this state |
