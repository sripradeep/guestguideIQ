# Entity Model — u2-admin-api

`u2-admin-api` hosts a single component, `Admin`, which — per `domain-design/components.md` and ADR-004 in `domain-design/decisions.md` — owns **no entities of its own**. This is a deliberate architectural fact, not an omission: `Admin` is a thin orchestration boundary that exposes privileged operations by calling into `u1-backend-api`'s own components (`PointOfInterest`, `LocalEvent`, `Identity`, `Locality`), each of which owns and validates its own data.

## Source of Truth

```yaml
entities: []
```

## Summary

Zero entities. Every piece of data `admin-api`'s four capabilities read or write (POI records, event records, account records, locality-brand records) is owned and defined by `u1-backend-api`'s `entities.md` — see that file for the `POI`, `Event`, `Account`, `Property`, and `LocalityEntity` shapes `Admin`'s operations act upon. This unit's `rules.md` and `functional-spec.md` reference those entities by name rather than redeclaring them.
