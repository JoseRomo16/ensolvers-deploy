# Deployment

The app is deployed as three independent pieces:

| Piece | Where | Why |
|---|---|---|
| PostgreSQL | **Supabase** | Managed Postgres with a free tier |
| REST API | **Render** | Runs the existing `backend/Dockerfile` as a long-lived process |
| SPA | **Vercel** | Serves the static export from a CDN |

The API is a long-running NestJS server holding a database connection pool, so
it does not belong on a serverless platform. The SPA is the opposite: it is a
folder of static files, so a CDN is exactly right.

---

## Before you start

Three rules that matter more than the steps:

1. **No credential ever goes into this repository.** `.env` is git-ignored;
   `.env.example` holds placeholders only. Connection strings live in the
   Render and Vercel dashboards.
2. **The database password is not the project password.** Supabase shows the
   database password once, when the project is created. Save it in a password
   manager immediately; if it is lost you have to reset it.
3. **Deploy in the order below.** The API needs the database, and the SPA needs
   the API's URL — then the API needs the SPA's URL for CORS. That last step
   closes a loop and is the one people forget.

---

## Step 1 — PostgreSQL on Supabase

1. Create an account at <https://supabase.com> and start a new project.
2. Choose a region close to where the API will run (Render's `oregon` pairs
   well with a US West region).
3. Set a database password when prompted and **save it**.
4. Wait for provisioning, then open **Project Settings → Database →
   Connection string**.

### Which connection string to copy

Supabase offers three, and the choice decides whether migrations work:

| Option | Port | Use it? |
|---|---|---|
| **Session pooler** | 5432 (pooler host) | ✅ **Use this one** |
| Transaction pooler | 6543 | ❌ No prepared statements — migrations misbehave |
| Direct connection | 5432 (`db.<ref>.supabase.co`) | ⚠️ IPv6-only unless you buy the IPv4 add-on; Render may not reach it |

Copy the **session pooler** string. It looks like:

```
postgresql://postgres.abcdefghijklm:YOUR-PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

Note the username is `postgres.<project-ref>`, not plain `postgres` — that is
how the pooler routes to your project. Copy it from the dashboard rather than
assembling it by hand.

> **If the password has symbols, URL-encode them.** A connection string is a
> URL: `@` becomes `%40`, `#` becomes `%23`, `/` becomes `%2F`, `:` becomes
> `%3A`. An un-encoded `@` is the single most common reason a correct password
> is rejected. The simplest fix is to reset the password to something
> alphanumeric.

---

## Step 2 — Create the schema and seed it

Run this **from your machine**, once, against the Supabase database. Nothing is
committed; the variables only exist for the length of the command.

```bash
cd backend
npm ci

DATABASE_URL='postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres' \
DATABASE_SSL=true \
npm run migration:run

# Optional: a few example notes so the live demo is not an empty screen
DATABASE_URL='...' DATABASE_SSL=true npm run seed
```

`DATABASE_SSL=true` is required: Supabase only accepts TLS connections.

Confirm it worked in the Supabase **Table Editor** — you should see `notes`,
`categories`, `note_categories` and `migrations`.

---

## Step 3 — API on Render

1. Create an account at <https://render.com> and connect the GitHub repository.
2. **New → Blueprint**, select this repository. Render reads `render.yaml`.
3. It will ask for the two secrets declared with `sync: false`:
   - `DATABASE_URL` — the session pooler string from Step 1
   - `CORS_ORIGIN` — leave `http://localhost:5173` for now; Step 5 fixes it
4. Deploy, and wait for the health check at `/api/health` to go green.

Render injects its own `PORT`, which the app already reads. The free plan spins
the service down after inactivity, so the first request after an idle period
takes ~30 seconds — worth mentioning to whoever reviews the live demo.

Check it:

```bash
curl https://notes-api-xxxx.onrender.com/api/health
# {"status":"ok","database":"up",...}
```

If `database` is not `up`, the connection string is wrong — see Troubleshooting.

---

## Step 4 — SPA on Vercel

1. Create an account at <https://vercel.com> and import the repository.
2. Set **Root Directory** to `frontend`. This matters: the repo is a monorepo
   and Vercel defaults to the root.
3. Framework preset should auto-detect **Next.js**.
4. Add one environment variable, for **all** environments:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://notes-api-xxxx.onrender.com/api` |

   Include the `/api` suffix and no trailing slash.

5. Deploy.

> **This value is compiled into the bundle, not read at runtime.** The SPA is a
> static export, so changing `NEXT_PUBLIC_API_URL` later requires a
> **redeploy** — editing the variable alone changes nothing.

---

## Step 5 — Close the CORS loop

The browser now loads the SPA from `vercel.app` and calls the API on
`onrender.com`. That is cross-origin, so the API has to allow it explicitly.

In the Render dashboard, set:

```
CORS_ORIGIN = https://your-app.vercel.app
```

Exactly the origin: scheme included, **no trailing slash**, no path. Save, and
let Render redeploy.

Symptom if you skip this: the SPA loads and looks fine, but every request fails
and the toasts say `Failed to fetch`. The browser console names CORS explicitly.

---

## Verification

```bash
# 1. The API is up and reaches the database
curl https://notes-api-xxxx.onrender.com/api/health

# 2. CORS allows the deployed SPA
curl -i -X OPTIONS https://notes-api-xxxx.onrender.com/api/notes \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" | grep -i access-control
# Expect: Access-Control-Allow-Origin: https://your-app.vercel.app
```

Then, in the browser, on the deployed SPA: create a note, reload the page and
confirm it is still there. That last check is the one that proves the whole
chain — CDN, API and managed database — is actually wired together.

Finally, add both URLs to the top of `README.md`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `password authentication failed` | Symbols in the password are not URL-encoded | Encode them, or reset to an alphanumeric password |
| `ENOTFOUND` / `ENETUNREACH` on the host | Using the direct connection, which is IPv6-only | Switch to the session pooler string |
| `no pg_hba.conf entry ... no encryption` | TLS not requested | Set `DATABASE_SSL=true` |
| `self signed certificate in certificate chain` | Certificate chain not trusted | `DATABASE_SSL=true` already relaxes verification; confirm it is set |
| Migrations hang or report odd prepared-statement errors | Using the transaction pooler on 6543 | Use the session pooler on 5432 |
| SPA loads, every request fails, `Failed to fetch` | `CORS_ORIGIN` missing or has a trailing slash | Set it to the exact Vercel origin and redeploy |
| SPA calls `localhost:3000` in production | `NEXT_PUBLIC_API_URL` was set after the build | Redeploy on Vercel |
| First request takes ~30 s | Render free plan cold start | Expected; upgrade the plan or warm it before a demo |

---

## Cost

Every service above has a free tier that covers this app. The trade-offs are
Render's cold starts and Supabase pausing a project after a week of inactivity —
if the demo is going to sit unused, open the Supabase dashboard once to wake it
before anyone reviews it.
