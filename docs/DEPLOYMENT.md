# Deployment

How the two services are deployed, and how to diagnose a deploy that builds
successfully but fails at runtime.

---

## Topology

| Service  | Target             | Entry                  | Notes                                     |
| -------- | ------------------ | ---------------------- | ----------------------------------------- |
| Frontend | Firebase Hosting   | `frontend/dist`        | SPA rewrite to `/index.html`               |
| Backend  | Vercel Functions   | `backend/api/index.js` | Thin re-export of `server.js`              |
| Backend  | Firebase Functions | `backend/index.js`     | Alternate target, same app                 |

`server.js` exports the Express app and only calls `listen()` under
`require.main === module`. That one file therefore serves three roles: a
long-lived process locally, a Vercel Function, and a Firebase Function.

### There are three `vercel.json` files

Check which one applies before editing:

- **`backend/vercel.json`** — the one that governs the API deployment when the
  Vercel project's **Root Directory is `backend`**. This is the intended setup.
- **`frontend/vercel.json`** — SPA rewrite, only relevant if the frontend is
  ever served from Vercel rather than Firebase Hosting.
- **`vercel.json`** (repo root) — a monorepo/microfrontends `services` config
  from an earlier attempt. It is **not** used when Root Directory is `backend`.
  If the API behaves as though your `backend/vercel.json` changes had no
  effect, this is the first thing to check.

---

## Deploying the backend

1. **Vercel → Project → Settings → General → Root Directory = `backend`.**
2. **Settings → Environment Variables** — set everything in
   `backend/.env.example` for the Production environment. `MONGODB_URI` and
   `JWT_SECRET` are mandatory; the app starts without the rest but the
   corresponding features no-op.
3. **MongoDB Atlas → Network Access → add `0.0.0.0/0`.** Vercel functions have
   no fixed egress IP, so an allowlist that names specific addresses will block
   them. **No code change can work around this** — the connection simply times
   out. If an open allowlist is unacceptable, use Atlas Private Endpoint or a
   static-egress proxy.
4. Push to `main`. Vercel builds from the connected repo.

### Verify

```bash
curl https://<your-api>.vercel.app/health
```

`/health` is deliberately declared **before** the database gate, so it answers
even when Mongo is unreachable — that is what makes it useful:

```json
{
  "status": "ok",
  "serverless": true,
  "database": "connected",
  "dbConfigured": true
}
```

- `database: "disconnected"` + `dbConfigured: true` → the URI is set but the
  cluster is not reachable. Almost always the Atlas allowlist (step 3).
- `dbConfigured: false` → `MONGODB_URI` is missing from the environment, or was
  set for Preview but not Production. Environment variable changes require a
  **redeploy** to take effect.

Then confirm a real data path:

```bash
curl https://<your-api>.vercel.app/api/batches
```

---

## Symptom → cause

| Symptom | Cause | Fix |
| --- | --- | --- |
| `FUNCTION_INVOCATION_FAILED` crash page on every request | The invocation exceeded its time limit — usually the DB connect hanging, not a code exception | Check `/health`. If `database` is not `connected`, fix the Atlas allowlist or the URI. The connect now aborts at 8s and returns a readable 503 rather than crashing. |
| `503 Database unavailable` | Cluster unreachable or `MONGODB_URI` unset | As above. The precise driver message is in the Vercel runtime logs, not the response — by design. |
| `500` with no detail in production | Working as intended; internal messages are not sent to clients | Read the full error and stack in Vercel → Deployments → Runtime Logs. |
| Config edits appear to do nothing | Wrong `vercel.json` (see above), or Root Directory is not `backend` | Confirm Root Directory in project settings. |
| Rate limiting throttles everyone at once | `trust proxy` unset, so all traffic shares one rate-limit key | Already fixed (`app.set('trust proxy', 1)`); do not raise it to `true`, which lets clients spoof their address via the header. |
| Real-time updates do not arrive in production | Expected. Serverless has no persistent socket layer | Not a bug. Every view must also work from its REST fetch — the frontend polls. Run the backend as a process if live sockets are required. |
| HTML returned instead of JSON | Request never reached the app | Check the rewrite in `backend/vercel.json` and the Root Directory. |

### Reading the actual error

The crash page never contains the cause. It is always in:

**Vercel → your project → Deployments → (deployment) → Runtime Logs**

Errors are logged there as `[error] <METHOD> <url> — <message>` with a stack
outside production.

---

## Backups and restore

**Atlas M0 has no automated backups.** That is a contradiction for a
system whose whole value is an append-only audit trail, so
[`.github/workflows/backup.yml`](../.github/workflows/backup.yml) runs a
nightly `mongodump` at 19:30 UTC (01:00 IST) and stores the archive as a
GitHub Actions artifact.

This is a stopgap, and worth being honest about its limits:

- **90-day retention maximum.** GitHub does not keep artifacts longer.
  Anything you need beyond that must be copied somewhere durable.
- **Same-provider risk.** Losing access to the GitHub account loses the
  backups with it.
- **Untested restores are not backups.** Do the drill below at least
  once, against a scratch cluster, before you need it for real.

The real fix is Atlas M10, which runs continuous backups with
point-in-time recovery. Until then, this is the floor.

### Required secrets

| Secret | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Source cluster. The workflow fails loudly if unset, rather than appearing to succeed. |
| `BACKUP_PASSPHRASE` | strongly recommended | Encrypts the archive with AES-256. Without it the dump is stored unencrypted — readable by anyone with repo access, and it contains user records and password hashes. |

Set both under **Settings → Secrets and variables → Actions**.

### Restoring

Download the artifact from the workflow run, then:

```bash
# If encrypted (BACKUP_PASSPHRASE was set)
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in himshakti-<stamp>.archive.gz.enc \
  -out himshakti-<stamp>.archive.gz \
  -pass env:PASSPHRASE

# Restore into a SCRATCH cluster first — never straight over production
mongorestore --uri="<scratch-cluster-uri>" \
  --gzip --archive=himshakti-<stamp>.archive.gz
```

Verify the restored data before pointing anything at it:

```bash
mongosh "<scratch-cluster-uri>" --eval '
  db.batches.countDocuments({});
  db.batches.findOne({}, { batchCode: 1, traceToken: 1 });
'
```

`--drop` replaces existing collections. Do not pass it against
production unless you have consciously decided to discard what is there.

---

## Deploying the frontend

```bash
cd frontend
npm run build          # → frontend/dist
firebase deploy --only hosting
```

`frontend/.env.production` holds `VITE_API_BASE_URL`; it must point at the
deployed API origin. It is gitignored — set it locally before building, since
Vite inlines these values at build time and a missing variable produces a
bundle that silently calls the wrong origin.

---

## Environment variables

Secrets live in the Vercel and Firebase dashboards, never in the repo.
`.gitignore` denies `.env.*` wholesale and re-includes only `.env.example`, so
adding a new variant cannot leak it by accident. If a secret is ever committed,
rotate it — removing the file from a later commit does not remove it from
history.
