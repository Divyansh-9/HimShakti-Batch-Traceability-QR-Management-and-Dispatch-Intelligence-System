# Security

## Reporting a vulnerability

Email **divyanshuniyal185@gmail.com** with steps to reproduce. Please do
not open a public issue for anything exploitable.

This is a student/TBI project without a funded bounty or a guaranteed
response window — that is stated plainly so nobody reports in the
expectation of one.

---

## Security model

What the system does, so a reviewer can check whether it still holds.

### Authentication

- Passwords are bcrypt hashed (10–12 rounds). Minimum length 8, no
  complexity or breach-list check — a known weakness.
- JWTs expire in 8 hours and are stored in `localStorage`, so an XSS
  would expose them. There is no refresh-token rotation.
- **Sessions are revocable.** Every authenticated request checks the
  token against the stored account: exists, not deleted, active, and
  `tokenVersion` matches. Bumped on password change, password reset,
  deactivation, soft delete and `POST /auth/me/logout-all`. Role and
  identity are read from the database, not the token, so a demotion
  applies on the next request. See
  [`docs/RBAC.md`](./docs/RBAC.md#session-validity-v2100).
- Residual risk: a stolen token that nobody notices stays valid until it
  expires. Revocation is immediate only when someone acts.

### Google account linking

Sign-in resolves a user by matching `googleEmail`, so that field is a
credential, not a label. Linking therefore requires a Google token
verified server-side ([`googleIdentity.js`](./backend/src/services/googleIdentity.js));
the address is taken from Google's verified response, never from the
client. A unique partial index enforces one Google identity per account.

Until v2.11.0 this endpoint accepted any email string the client sent.
One user could claim another person's address, and that person's Google
sign-in would then land in the attacker's account. Fixed, and the
deprecated `PATCH` shape now refuses to link.

### Authorization

Four tiers, enforced by middleware in
[`requireAdmin.js`](./backend/src/middleware/requireAdmin.js) and covered
in both directions by tests — every role that must pass each guard, and
every role that must be refused. Super Admin is Tier 0, identified by a
flag **no API can set**; only a script or a direct Atlas edit.

### Public surface

`GET /api/batches`, the batch reads, and the trace endpoints are
unauthenticated **by design** — the consumer QR flow depends on it.

The QR encodes an opaque HMAC token (`/trace/t/<token>`), not the
sequential batch code, because the code is enumerable and the endpoint
has no auth. Legacy `/trace/:batchCode` still resolves for
already-printed labels but returns a reduced record: product, expiry,
freshness. Farmer, village, lot code, quantity and yield require the
token. Enumeration remains possible and returns little worth having.

Quality verdicts are published only when `PASSED`; `FAILED` and
`FLAGGED` are withheld from the public response entirely.

### Data handling

- **Scanner IPs are never stored raw** — SHA-256 hashed before
  persistence. The login-history service reads the IP for a geo lookup
  then discards it. *Known weakness:* the scan hash is salted with
  `JWT_SECRET`, and the IPv4 space is small enough to brute-force for
  anyone holding that secret.
- **User reads use an explicit allowlist**, never `.select('-field')`. A
  previous denylist shipped `resetToken` — the credential
  `resetPassword()` accepts — to every manager.
- Invite tokens are stored hashed with a 72-hour expiry.
- Nothing is hard-deleted; `noteHistory` is append-only.
- **Backups** run nightly and are AES-256 encrypted when
  `BACKUP_PASSPHRASE` is set. Without it, dumps containing user records
  and password hashes are stored unencrypted in GitHub artifacts.

### Platform

- `trust proxy` is `1`, not `true` — `true` would let a client spoof its
  address via `X-Forwarded-For`.
- Rate limits count in a shared store when configured; per-container
  in-memory otherwise, which under serverless enforces far less than it
  appears to.
- Production error responses return a generic string for 5xx. The
  previous behaviour forwarded `err.message`, leaking driver text,
  hostnames and connection-string fragments.
- `helmet` is applied. CORS currently reflects any origin.

---

## Known weaknesses

Listed because an undisclosed weakness is worse than a disclosed one.

| Issue | Status |
| --- | --- |
| JWT in `localStorage`; XSS would expose it | Open — needs httpOnly cookies + refresh rotation |
| No refresh tokens; 8-hour window on an unnoticed theft | Open |
| Password policy is length-only (min 8) | Open |
| Scan IP hash salted with `JWT_SECRET`; IPv4 is brute-forceable | Open — needs a separate pepper |
| CORS reflects any origin | Open |
| `react-router` advisory (RSC-mode CSRF) | Accepted — fix requires a semver-major migration and this app does not use RSC mode |
| Moderate `npm audit` findings in both trees | Tracked by Dependabot; audit reports in CI but does not block |
| Rate limiting ineffective unless `UPSTASH_*` is configured | Configuration-dependent by design |

Anything unpatched here is listed on purpose. If you find something that
is *not* listed, that is worth reporting.
