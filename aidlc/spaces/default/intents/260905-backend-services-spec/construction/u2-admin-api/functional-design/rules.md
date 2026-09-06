# Business Rules — u2-admin-api

`Admin` owns no data (see `entities.md`), so its rules are about authorization and delegation correctness, not data validation — the actual validation/business logic for each delegated call lives in `u1-backend-api`'s `rules.md` and is cross-referenced below, never duplicated.

## Source of Truth

```yaml
rules:
  - id: BR1.1
    statement: Only authenticated ops staff may call any admin-api operation
    category: authorization
    applies_to: Admin
    trigger: any admin-api request
    logic: "IF the caller is not an authenticated ops-staff identity THEN reject the request before it reaches any delegated call"
    violation_behaviour: "reject with an authorization error; no call to u1-backend-api's internal API is made (AC4.4.3's authorization boundary, enforced here at the entry point rather than only by u1-backend-api's own BR9.3 omission)"
    source: FR9.5, AC4.4.3

  - id: BR1.2
    statement: POI curation delegates entirely to backend-api's PointOfInterest write API
    category: policy
    applies_to: Admin
    trigger: create/edit POI request
    logic: "forward the request to u1-backend-api's internal POI endpoint; that component's own BR5.1 (duplicate-within-locality check) and BR5.2 (empty-locality messaging) govern the outcome"
    violation_behaviour: "N/A — see u1-backend-api's rules.md BR5.1 for the actual rejection logic"
    source: FR5.1, AC4.1.1, AC4.1.2

  - id: BR1.3
    statement: Event management delegates entirely to backend-api's LocalEvent API
    category: policy
    applies_to: Admin
    trigger: event ingestion view / lifecycle audit request
    logic: "forward the request to u1-backend-api's internal Event endpoint; that component's own BR6.1 (dedup), BR6.2 (expiry), and BR6.3 (exclusion from guest-facing reads) govern the outcome — this unit only presents the audit trail, it does not re-implement the lifecycle logic"
    violation_behaviour: "N/A — see u1-backend-api's rules.md BR6.1-BR6.3"
    source: FR6.1, FR6.3, AC4.2.1, AC4.2.2, AC4.2.3

  - id: BR1.4
    statement: Account lookup delegates entirely to backend-api's Identity read API
    category: policy
    applies_to: Admin
    trigger: account lookup request
    logic: "forward the identifier to u1-backend-api's internal Account read endpoint and relay the result (found or not-found) unchanged"
    violation_behaviour: "N/A — a not-found result is a valid response, not a rejection (AC4.3.2)"
    source: AC4.3.1, AC4.3.2

  - id: BR1.5
    statement: Locality-brand management delegates entirely to backend-api's Locality write API
    category: policy
    applies_to: Admin
    trigger: create/edit locality-brand or domain-association request
    logic: "forward the request to u1-backend-api's internal Locality endpoint; that component's own BR9.2 (domain uniqueness) and BR9.4 (minimum-identity validation) govern the outcome"
    violation_behaviour: "N/A — see u1-backend-api's rules.md BR9.2, BR9.4"
    source: FR9.1, FR9.4, AC4.4.1, AC4.4.2, AC4.4.4, AC4.4.5

  - id: BR1.6
    statement: A failed delegated call is relayed to the ops caller without translation
    category: policy
    applies_to: Admin
    trigger: any delegated call to u1-backend-api returning a non-2xx response
    logic: "pass through backend-api's ErrorResponse (code, message, details) unchanged (Q1)"
    violation_behaviour: "N/A — this rule defines the relay behaviour itself, not a rejection"
    source: Q1 (this stage)
```

## Summary

| Group | Rules | Categories Present |
|---|---|---|
| BR1 — Admin | BR1.1-BR1.6 | authorization, policy |

6 rules, all describing delegation and authorization — zero validation/calculation rules, consistent with `Admin` owning no data of its own. Four of the six rules (BR1.2, BR1.3, BR1.4, BR1.5) explicitly point to the real enforcement logic in `u1-backend-api`'s `rules.md` rather than restating it, avoiding a maintenance hazard where the same rule could drift between two files.
