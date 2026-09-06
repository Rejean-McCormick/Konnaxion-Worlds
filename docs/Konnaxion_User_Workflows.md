# Konnaxion — User Workflows

## 1. Scope

These workflows describe current Konnaxion product surfaces without treating every UI area as an independent architecture system.

## 2. Shared entry

```text
user
→ Konnaxion frontend
→ authenticated/public context
→ product surface
→ Konnaxion API/service owner
→ result
```

Shared navigation/search/auth may cross product surfaces, but domain mutations remain owned by their backend domain.

## 3. ethiKos — deliberate

```text
open topic
→ read source/context
→ inspect argument graph
→ add argument/reply/source when authorized
→ optional stance update
→ moderated/audited ethiKos state
```

Topic stance and argument-level impact are separate interactions.

## 4. ethiKos — decision result

```text
source stances
→ baseline aggregation
→ display baseline
→ optional Smart Vote reading request
→ display declared advisory reading separately
```

If no Smart Vote reading exists, the UI displays no derived reading rather than inventing one.

## 5. EkoH profile

```text
viewer requests profile
→ identity confidentiality policy
→ rating-access policy
→ allowed EkoH fields
→ profile response
```

The viewer does not receive private rating detail merely because identity is visible.

## 6. Smart Vote contextual reading

```text
source topic
→ explicit SourceConsultationBinding
→ consultation relevance vector
→ EkoH context
→ lens hash + input snapshot identity
→ baseline + advisory reading
```

A contextual reading weight is specific to the consultation/lens. It is not a global property of the person.

## 7. keenKonnect

```text
browse/create project
→ project workspace
→ teams/resources/tasks/messages
→ domain services
→ project state
```

EkoH context may be displayed for people but does not own the project.

## 8. KonnectED

```text
browse learning resource/path
→ consume/contribute/evaluate
→ peer validation or certification workflow when applicable
→ portfolio/progress state
```

## 9. Kreative

```text
browse/create creative work
→ gallery/collaboration/archive/tradition surface
→ owner service mutation
→ updated creative domain state
```

## 10. TeamBuilder

```text
select/create problem
→ builder session
→ teams/members
→ problem/team state updates
```

TeamBuilder objects are Konnaxion objects; they are not Orgo Case/Task objects.

## 11. Kontrol

```text
admin enters Kontrol
→ authorization
→ moderation/users/roles/audit/config surface
→ underlying Konnaxion owner service
→ result
```

Kontrol is an administrative UI, not a replacement owner for every domain it displays.

## 12. External system workflows

No concrete Orgo/Kristal/SemantiK Architect workflow is implemented in the current Konnaxion snapshot. When added, the UI/backend must call an explicit adapter and preserve both systems' ownership boundaries.
