# Testing

## Running

```bash
cd backend  && npm test        # 75 tests
cd frontend && npm test        # 21 tests
npm run test:watch             # backend only, watch mode
```

Both use [Vitest](https://vitest.dev/). No database, no network, no
fixtures — the whole suite runs in well under two seconds, which is the
point: a suite you wait for is a suite you stop running.

CI runs both on every push and pull request
([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

---

## What is tested, and why only this

96 tests is not broad coverage of 19,572 lines, and it is not trying to
be. The suite targets one specific category: **logic whose failure mode
is silent.**

A route that 500s tells you it is broken. A tier boundary that is off by
one does not. It ships a batch a day late, or buries an urgent one in
the queue, and every log line looks normal. Those are the bugs worth
paying for tests, because they are the ones nothing else will catch.

| Area | File | What would break silently |
| --- | --- | --- |
| Expiry tiers | `backend/tests/expiryCalculator.test.js` | A wrong boundary ships expired stock or hides urgent stock. Boundaries are asserted exactly: 0 EXPIRED, 7 URGENT, 8 WARNING, 30 WARNING, 31 READY. |
| FEFO priority | same file | Wrong dispatch order. Also pins the real `365 - days` formula, which the docs once contradicted. |
| RBAC matrix | `backend/tests/rbac.test.js` | A role quietly gaining a capability. Asserted in **both** directions — every role that must pass, every role that must be refused. The dangerous failure is the permissive one, and it never throws. |
| Message retention | `backend/tests/messageRetention.test.js` | `expiresAtFor` alone decides permanent audit evidence vs 90-day expiry. Inverting it deletes the audit trail with no error. Nothing else enforced it. |
| Trace tokens | `backend/tests/traceToken.test.js` | Non-determinism breaks the backfill's idempotency and orphans printed labels. A missing key would produce guessable tokens that look fine. |
| Session revocation | `backend/tests/sessionRevocation.test.js` | A deleted user keeping access; a demotion not applying; a stolen token surviving a password change. Includes: database failure must **not** read as authenticated, and `passwordHash`/`resetToken` must never reach `req.user`. |
| Shared store | `backend/tests/sharedStore.test.js` | Every branch is a failure branch, because those are the ones that run locally, in CI, and during any Upstash outage. |
| CSV parsing | `frontend/src/utils/csvParser.test.js` | A mis-split quoted field does not error — it writes a wrong farmer name into a permanent, append-only production record. |

---

## Conventions

**Test the contract, not the implementation.** `expectAllowed(guard,
roles)` in the RBAC tests asserts the permission matrix from
[`RBAC.md`](./RBAC.md). Refactoring the guards freely is fine; changing
who can do what fails the build.

**Boundaries exactly, never approximately.** `expect(getBatchStatus(7))
.toBe('URGENT')` and `expect(getBatchStatus(8)).toBe('WARNING')` — both
sides of every edge. Off-by-one is the entire risk.

**Assert the safe default explicitly.** `getTier('intern')` returns 99,
not 0, because an unrecognised role must be the *least* privileged. That
is a one-line test guarding a whole class of privilege escalation.

**Stub at the module boundary.** `sessionRevocation.test.js` replaces
`User.model` in `require.cache` rather than reaching for Mongo. A test
that needs a database is a test that eventually stops being run.

**Comment the why, not the what.** Every test file opens with what
breaks if the code under it is wrong. A test named
`'returns null for record comments'` says nothing; the comment saying
null is what makes Mongo's TTL skip the document says everything.

---

## Gaps, stated rather than implied

Known and deliberate:

- **No route or integration tests.** Controllers, middleware chains and
  Mongoose queries are unexercised. `supertest` against an in-memory
  Mongo is the natural next step.
- **No frontend component tests.** Only `csvParser` is covered. React
  Testing Library plus jsdom would be needed, and `Dashboard.jsx` at
  ~3,400 lines is close to untestable until split.
- **Google OAuth is untested.** `googleAuth.controller.js` has no
  coverage, which is why the `google-auth-library` v11 major bump is
  held rather than merged.
- **The backup workflow is untested.** CI never exercises
  `backup.yml`. After changing it, dispatch it manually and confirm the
  artifact appears.
- **`npm audit` reports, it does not block.** Known moderates remain in
  both trees; a blocking gate would be red on arrival and switched off.

---

## Lint budget

The frontend carries **61 pre-existing lint errors** — 40 unused
variables plus react-hooks findings, none auto-fixable. CI caps the
count rather than pretending they are fixed:

- errors rise above 61 → build fails
- errors fall below 61 → build passes and prints a notice to lower the
  cap in `ci.yml`, locking the win in

`continue-on-error` was rejected: it looks like a gate while being none.
The budget only ever ratchets down.

---

## Adding a test

Put backend tests in `backend/tests/*.test.js` (CommonJS, `describe`/
`it`/`expect` are globals via `vitest.config.mjs`). Put frontend tests
beside their subject as `*.test.js` (ESM, import from `vitest`).

Before adding one, ask what it would catch that a running app would not.
If the answer is "nothing", the time is better spent elsewhere — the
value of this suite is that every test in it is load-bearing.
