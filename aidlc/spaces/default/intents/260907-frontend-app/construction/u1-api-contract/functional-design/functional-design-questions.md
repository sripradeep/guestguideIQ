# Functional Design — `u1-api-contract`

Two questions. Construction questions are exceptional rather than routine — by
this point the decisions should already be made, and most of this unit is settled
by Contract Design. These two are genuine gaps that stage did not cover.

**What this unit is.** The frontend's typed view of the backend API: the request
and response types, and the step that produces them. It owns no runtime
behaviour, makes no requests and holds no state. It carries no user stories,
because it delivers nothing a user sees.

**What is already settled:**

- `api-documentation.md` is the contract of record; divergence from it is a
  backend defect (Contract Design Q1).
- The types arrive **vendored** — committed into this repository, refreshed by a
  script (Contract Design Q5).
- They start **hand-written**, transcribed from the prose document, at the exact
  path generated output will later occupy. Nothing outside this unit hand-edits a
  type at that path once generation begins.

---

## Q1 — Do the types include endpoints that do not exist yet?

Contract Design found three endpoints that are **documented but absent** from the
running service — `POST /v1/stays`, `GET /v1/subscriptions` and
`GET /v1/accounts/me`. `api-documentation.md` even marks one of them "Missing" in
its own gaps table. Four more are named in `AC4.1.x` and documented nowhere.

Whether this unit types them decides what happens when someone writes code
against them.

- **A. Only what is deployed.** Type the endpoints that actually answer. Code
  calling a missing endpoint **does not compile** — the absence becomes a
  build-time error at the moment someone tries to use it, which is the earliest
  and cheapest signal available. Cost: each unit blocked on a backend endpoint
  cannot even be written against it until it exists, so blocked work is blocked
  harder.
- **B. Everything documented, marked absent.** Type all of it, with the absent
  ones flagged in a way a developer sees at the call site. Blocked units can be
  written and tested against mocks now, which is what the delivery plan assumes
  (Q4 = A there). Cost: the failure moves from compile time to run time — code
  compiles, ships, and 404s.
- **C. Everything documented, unmarked.** Simplest to generate later, since a
  generated client will type whatever the contract declares. Cost: no signal at
  all that an endpoint is fictional.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — What happens when the backend returns a field we do not know about?

The backend can add a response field without redeploying this frontend. How the
types treat that decides whether an additive backend change is invisible or
breaking.

- **A. Tolerant — ignore unknown fields.** The conventional rule for a consumer,
  and the one Contract Design's ownership rules already assume: "consumers ignore
  fields they do not recognise." An additive backend change cannot break the
  frontend. Cost: a **renamed** field looks identical to a removed one, and
  neither is noticed until something renders empty.
- **B. Strict — reject unknown fields.** Any response shape that differs from the
  contract fails loudly at the boundary, which turns silent drift into a visible
  error — valuable given there is no automated divergence check anywhere. Cost: a
  purely additive backend change takes the frontend down, which is a severe
  response to a safe change.
- **C. Tolerant, but log the unknown field.** Ignore it for behaviour, record it
  for visibility. Drift becomes observable without becoming an outage. Cost: it
  needs somewhere to log to, and nobody reads a log nobody is watching.
- **X. Other (please specify)**

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 = A** — Type **only endpoints that are actually deployed**. Code calling a
  missing endpoint does not compile.
- **Q2 = A** — **Tolerant** parsing: unknown response fields are ignored, so an
  additive backend change cannot break the frontend.

**Q1 = A hardens the delivery plan's blockers, and that is worth being concrete
about.** The plan chose to build against an intercepted network now (Q4 = A at
Delivery Planning), which assumed blocked units could at least be *written*
against their eventual endpoints. Typing only deployed endpoints removes that:
code for an absent endpoint cannot be written at all, because there is no type to
call.

What that means, unit by unit:

| Absent endpoint | Code that now cannot be written | Bolt |
|---|---|---|
| `GET /v1/accounts/me` | Session restore on reload (AC1.3.3) | B1 |
| logout / token revocation | Server-side logout (AC1.11.1) | B1 |
| `GET /v1/subscriptions` | Plan and status display (AC1.14.1) | B2 |
| `POST /v1/stays` | **All of guest-link creation** | B3 |
| chat history read | Transcript surviving a reopen (AC2.4.5) | B4 |
| locality brand read | Every branded state | B1, B4 |
| guest-resolvable content | Places and Events showing real names | B4 |

**This is a real trade and it points the right way.** Each of those was already
going to fail — the endpoint does not exist. Q1 = A moves the failure from
"discovered at integration, after code was written and mocked and tested" to
"the compiler refuses on day one". The affected code is not written twice; it is
written once, when it can actually work.

The cost lands hardest on **B3**, which becomes genuinely unstartable rather than
merely unverifiable, and on the parts of B1 and B4 that depend on absent reads.
Those units' remaining work is unaffected.

**Q2 = A is consistent with what Contract Design already assumed** — its
ownership rules state that consumers ignore fields they do not recognise. The
weakness it accepts is named there and stays true: a renamed field is
indistinguishable from a removed one until something renders empty, and no
automated divergence check exists to catch it.

[Answer]: Looks correct
