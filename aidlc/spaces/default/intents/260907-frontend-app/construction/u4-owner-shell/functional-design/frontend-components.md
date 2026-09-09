# Frontend Components — `u4-owner-shell`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

The component hierarchy, each component's inputs and state, its interaction flow,
its validation rules and its integration points.

**Framework-neutral.** The framework is OQ4 and unchosen, so nothing here is
expressed as props, hooks or lifecycle. "Inputs" means values a component is
given; "state" means values it owns. The translation into a framework's idiom
belongs to code generation.

## Hierarchy

```
AppShell                        (this unit)
├── ResolutionState             (this unit)  — Q1 = A's blocking state
├── AnonymousLayout             (this unit)
│   ├── LoginForm               (this unit)  — PO-9
│   ├── SignupForm              (this unit)  — PO-1
│   ├── SignupsUnavailable      (this unit)  — PO-0
│   ├── ResetRequestForm        (this unit)  — PO-2
│   └── ResetLinkExpired        (this unit)
└── AuthenticatedLayout         (this unit)
    ├── NavRail                 (u2-design-system, configured here)
    ├── HeaderUserMenu          (this unit)  — carries the logout control
    ├── SessionExpiredDialog    (this unit)  — built from u2's Dialog
    ├── AccountView             (this unit)  — PO-8
    └── <feature outlet>                     — u5, u6, u7 render here
```

**Eleven components, and only three carry logic of any depth**: `AppShell`,
`SessionExpiredDialog` and the two forms that submit credentials. The rest are
layout and presentation over `u2-design-system` primitives.

---

## `AppShell`

The unit's only stateful coordinator.

| Aspect | Detail |
|---|---|
| Inputs | The resolved `Session` from `u3-foundation`; `ThemeTokens` from `LocalityBrandResolver` |
| State | `shellState` (`booting`, `resolving`, `anonymous`, `routing`, `authenticated`, `authenticated-provisional`, `expired`); `provisional` flag; the pending onboarding retry |
| Emits | Route changes; the provisional-state signal that feature units honour |
| Integration | `u3-foundation` for the session and the onboarding read. It makes no other request |

**It never reads a token.** Route guards branch on `Session.status` and nothing
else — the shape has no token field to read (`u3`'s BR1.1).

**It owns the provisional signal**, and `u5-owner-guide` consumes it. While
provisional, saving, publishing and unpublishing are suppressed; reading and
navigating are not. This is the compensating control for Q3 = B and is the one
piece of this unit's behaviour another unit must actively honour.

---

## `ResolutionState`

| Aspect | Detail |
|---|---|
| Inputs | None |
| State | None |
| Behaviour | The shell's own loading treatment, visible within roughly 300ms (NFR5). Not a blank page, not a spinner alone |
| Accessibility | Announces politely that the app is loading, via `u2`'s `LiveRegion`. A blocking state that says nothing is indistinguishable from a hang to a screen-reader user |

**This is what every cold load currently shows before falling through to
`/login`**, because `AC4.1.4` does not exist. Its quality is not cosmetic while
that remains true.

---

## `LoginForm` (PO-9)

| Aspect | Detail |
|---|---|
| Inputs | None |
| State | `username`, `password`, `submitting`, `bannerError` |
| Primitives | Two `TextInput`, one `Button`, one `StatusBanner` |
| Emits | `authenticated` on success |
| Integration | `u3-foundation`'s login method |

**Validation:** required-field checks on blur and on submit. Nothing else — the
backend owns credential validity, and pre-judging a password's shape at login
would tell an attacker about the password policy.

**Error handling is the exception in this product.** A `UNAUTHORIZED` renders
**one** `StatusBanner` above the form with an identical message for a wrong
password and an unknown username (AC1.3.2). There is no field-level error state on
this form at all — not "unused", *absent*, so it cannot be reached by a later
change that adds one for consistency with `SignupForm`.

---

## `SignupForm` (PO-1)

| Aspect | Detail |
|---|---|
| Inputs | `ThemeTokens` (unbranded default until `AC4.1.7`) |
| State | `username`, `password`, per-field errors, `submitting`, `bannerError`, `replaced` |
| Primitives | Two `TextInput`, one `Button`, one `StatusBanner` |
| Emits | `authenticated` on success |
| Integration | `u3-foundation`'s signup method |

**Validation:** on **blur** and on submit, never per keystroke (AC1.1.4). Each
error names what is wrong — never a generic "invalid input".

**There is no locality-selection control anywhere on this form** (AC1.1.1), and
none may be added: the locality is resolved from the address the owner arrived at
and assigned silently. A visible picker would contradict the tenancy model.

**Error mapping:**

| Typed error | Presentation |
|---|---|
| `CONFLICT` | Inline on the **username field** — "That username is already taken" (AC1.1.3) |
| `VALIDATION_ERROR` | Each `FieldError` attached to its own named field (AC1.1.5) |
| `LOCALITY_NOT_RESOLVED` | `replaced` — the whole screen becomes `SignupsUnavailable` (AC1.2.1) |
| Anything else | One `StatusBanner`, carrying the catalogue's message. No status code reaches the screen |

---

## `SignupsUnavailable` (PO-0)

| Aspect | Detail |
|---|---|
| Inputs | **None, deliberately — including no `ThemeTokens`** |
| State | None |
| Behaviour | A neutral page: "Signups aren't available at this address." No form, not even a disabled one (AC1.2.1) |

**The one component in the product that takes no theme in any state** (AC1.2.2).
No locality resolved, so nothing is claimed — not even the product's default
accent. Passing it tokens would be a defect, not an enhancement.

**No raw status or code is shown** (AC1.2.3).

---

## `ResetRequestForm` (PO-2) and `ResetLinkExpired`

| Aspect | Detail |
|---|---|
| Inputs | None |
| State | `username`, `submitting`, `submitted` |
| Primitives | One `TextInput`, one `Button`, one `StatusBanner` |
| Integration | `u3-foundation`'s reset-request method |

**The success message is identical whether or not the account exists** (AC1.4.1),
and is worded conditionally — "if that account exists, we've sent a reset link" —
so it is not a lie in either case. The component has **no branch** on account
existence, because the API deliberately returns `202` either way.

`ResetLinkExpired` is a single state with a request-a-new-link action (AC1.4.3).
Never a dead end.

**There is no `ResetConfirmForm`** (Q2 = B). The backend discards the reset token
it generates and there is no mailer, so `AC1.4.2` has no reachable path. Deferred
explicitly rather than built untested.

---

## `HeaderUserMenu`

| Aspect | Detail |
|---|---|
| Inputs | The `Account` from the resolved session |
| State | `open` |
| Primitives | `Button`, and `u2`'s focus-managed overlay behaviour |
| Emits | `logout` |

**The logout control lives here** (AC1.11.3), reachable from every dashboard
screen without visiting Account. `US1.11` is Must and `US1.15` is Should — routing
the only logout through Account would leave a Must story with no reachable
trigger.

---

## `SessionExpiredDialog`

Built from `u2-design-system`'s `Dialog`, and **it inverts that primitive's
Escape-closes default** — the one named accessibility override in the product
(`u2`'s BR2.2).

| Aspect | Detail |
|---|---|
| Inputs | The ended `Session` and its reason |
| State | None — its presence is the state |
| Emits | `sign-in-requested` |
| Overrides | `escape-closes: false`, named explicitly at the call site |

**Why the override exists.** A session that has ended has nothing behind it to
return to. Dismissing this dialog would leave the owner looking at a dashboard
that cannot do anything — every request behind it would fail. The screen behind is
preserved because it holds the owner's work (AC1.10.3), not because it is still
usable.

**It renders over the current route and unmounts nothing.** The editor's buffer,
the wizard's entries and the scroll position all survive.

**It is only reached on an expiry**, never on a sign-out. A sign-out routes to
`/login` and makes authenticated routes unreachable (AC1.11.2).

---

## `AccountView` (PO-8)

| Aspect | Detail |
|---|---|
| Inputs | The `Account` from the resolved session |
| State | None |
| Behaviour | Three read-only values — username, property name, locality name (AC1.15.1) — a link to Subscription, and a logout control (AC1.15.2) |
| Integration | **None.** It fetches nothing; the identity comes from the resolved session |

**Nothing on this screen is drawn as though it could be edited** — no disabled
inputs, no greyed "change password" leading nowhere. The API allows nothing else:
no email is ever collected, there is no password-change endpoint, and there is no
property-name-edit endpoint. The property name typed once at onboarding is
permanent, and it is the guest's trust cue.

---

## API integration points

Every one goes through `u3-foundation`. This unit calls no endpoint directly and
constructs no request.

| Component | Call | Notes |
|---|---|---|
| `LoginForm` | login | The only place credentials are submitted for an existing account |
| `SignupForm` | signup | Untestable end-to-end until `AC4.1.8` — the tenant comes from `Host` |
| `ResetRequestForm` | reset request | Always `202`, whatever the outcome |
| `AppShell` | session resolution | Blocked on `AC4.1.4`; currently always falls through |
| `AppShell` | onboarding read | The read whose failure Q3 = B is about |
| `HeaderUserMenu` | logout | Client-side discard only, until `AC4.1.5` |
| `AccountView` | **none** | Identity comes from the session, not a fetch |

## Accessibility obligations this unit owns

Under `u2-design-system`'s Q1 = A boundary, a feature unit inherits its
accessibility obligations from `accessibility-checklist.md` directly rather than
assuming the design system covered them. For this unit that means:

- **`SessionExpiredDialog`'s focus behaviour**, since it overrides a `Dialog`
  default. Focus is still trapped and the background still inert; only the Escape
  behaviour changes, and the override is named at the call site.
- **`ResolutionState`'s announcement**, because a blocking state that says nothing
  is a hang to a screen-reader user.
- **`HeaderUserMenu`'s overlay behaviour**, which is a menu rather than a dialog:
  focus returns to the trigger on close, and Escape closes it normally.
- **The non-disclosing login banner's announcement**, politely — the error must
  reach a screen-reader user without being read as a field error, since there is
  no field to associate it with.
