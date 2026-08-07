# Contributing

## Setup

```bash
git clone <repo> && cd tbi

cd backend  && npm install && cp ../.env.example .env   # fill in values
cd ../frontend && npm install                            # create .env — see below

# Two terminals
cd backend  && npm run dev     # :5001, nodemon
cd frontend && npm run dev     # :5173, vite
```

`backend/.env` needs `MONGODB_URI` and `JWT_SECRET` at minimum; every
other variable is documented in
[`backend/.env.example`](./backend/.env.example) and degrades gracefully
when absent. `frontend/.env` needs `VITE_API_BASE_URL`.

Health check: `curl http://localhost:5001/health`

---

## Before you open a PR

```bash
cd backend  && npm test
cd frontend && npm test && npm run build && npm run lint
```

CI runs exactly this. All of it must pass, plus the lint count must not
exceed 61 — see [Lint budget](./docs/TESTING.md#lint-budget).

---

## House rules

These are the ones that are easy to get wrong and expensive to get
wrong. The full architectural context is in
[`CLAUDE.md`](./CLAUDE.md).

**Backend is CommonJS, frontend is ESM.** Do not mix.

**Never call `fetch()` from a page or hook.** Everything goes through
`frontend/src/api/client.js`, which attaches the bearer token and
handles the global 401 redirect.

**User read paths use an allowlist, never `.select('-field')`.** The
previous denylist shipped `resetToken` to every manager — and that field
is not an identifier, it is the credential `resetPassword()` accepts. Add
fields to `USER_PUBLIC_FIELDS` deliberately; never widen with a
negation.

**Recompute status on every batch read path.** Persisted `status` and
`priorityScore` are stale by design. If you add a read path, enrich it
like the others or the UI shows yesterday's urgency.

**Never write `data-theme="system"` to the DOM.** `system` is a stored
intent; `SettingsContext` resolves it to `"dark"` or `"light"`. Writing
it literally makes every Tailwind `dark:` class silently drop while the
CSS variables still apply — a half-dark hybrid. This has been
reintroduced twice.

**Guard every socket emit with `if (io)`.** Socket.io is not initialised
under serverless. Every view must work from its REST fetch alone.

**Route order matters.** Literal routes (`/archived`, `/t/:token`,
`/users/deleted`) must be declared before their `/:id` siblings, or
Express parses the literal as an ObjectId.

**Some batch reads are unauthenticated by design.** `GET /api/batches`
and the trace endpoints carry no `protect` — the public QR flow depends
on it. Do not "fix" this reflexively. Do check it before adding anything
sensitive to a batch document.

---

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):
`feat(scope):`, `fix(scope):`, `docs(scope):`, `chore(deps):`.

Write the body for the person who finds this commit in six months while
something is broken. **Explain why the old behaviour was wrong**, not
what the diff shows — the diff is already in the commit. If a decision
looks strange, the commit message is where it stops looking strange.

Update [`CHANGELOG.md`](./CHANGELOG.md) for anything user-visible, and
`docs/PROJECT_TRACKER.md`'s decision log for anything architectural.

---

## Documentation duties

Where README, `docs/` and the code disagree, **the code wins** — and
whoever notices fixes the doc. Two instances were found and corrected in
v2.9.0 and v2.10.0: the README claimed Atlas M0 provides managed backups
(it provides none), and `DATABASE.md` documented a FEFO formula the code
has never implemented. Both had been wrong for months because nothing
forced them to be checked.

When you change something documented, change the documentation in the
same commit. A doc corrected later is a doc that was misleading in the
meantime.
