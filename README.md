# Notes App

Full stack notes application: create, edit, delete and archive notes, tag them
with categories and filter by category.

Two independent applications, each with its own `package.json`, talking only
over a REST API: a **NestJS** backend on **PostgreSQL**, and a **Next.js** SPA
shipped as a static export.

## Live demo

| Piece | Platform | URL |
|---|---|---|
| SPA | Vercel | _to be filled in_ |
| REST API | Render | _to be filled in_ |
| PostgreSQL | Supabase | — |

> The API runs on a free plan that sleeps after inactivity, so the first request
> after an idle period can take ~30 seconds.

## Contents

- [Scope](#scope)
- [Quick start](#quick-start)
- [Requirements](#requirements)
- [Architecture](#architecture)
- [REST API](#rest-api)
- [Configuration](#configuration)
- [Quality](#quality)
- [Deployment](#deployment)
- [Notes on dependencies](#notes-on-dependencies)

---

## Scope

Both phases of the exercise are implemented.

**Phase 1 — notes**

| User story | Status |
|---|---|
| Create, edit and delete notes | ✅ |
| Archive and unarchive notes | ✅ |
| List active notes | ✅ |
| List archived notes | ✅ |

**Phase 2 — categories**

| User story | Status |
|---|---|
| Add and remove categories on a note | ✅ |
| Filter notes by category | ✅ |

**There is no login.** The exercise lists it as optional and it was not
implemented, so there are no credentials to document — every note belongs to a
single implicit user.

---

## Quick start

Prerequisites: **Docker**, **bash** and **curl**. Nothing else — see
[Requirements](#requirements) for versions.

From the root of the repository:

```bash
./start.sh
```

- SPA: <http://localhost:5173>
- REST API: <http://localhost:3000/api>
- Health: <http://localhost:3000/api/health>

Press `Ctrl+C` to stop everything. The containers are removed but the named
volume is kept, so your data is still there on the next run.

If the script is not executable after cloning: `chmod +x start.sh`

### What the script does

1. checks that Docker and curl are available and that the ports it needs are free,
2. creates the `.env` files from their `.env.example` templates,
3. starts PostgreSQL and waits for its healthcheck,
4. builds the API and SPA images,
5. **applies the database migrations**,
6. **seeds the initial data** (skipped if the database already has notes),
7. starts the API and waits until `/api/health` reports the database is up,
8. starts the SPA and follows the container logs.

The migration and the seed are both idempotent, so running it repeatedly is safe.

### Changing ports

If a port is taken, the script names it and the variable to override instead of
letting Docker fail with a daemon-level bind error:

```bash
FRONTEND_PORT=5180 ./start.sh
```

`CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` follow the ports in use automatically —
otherwise the SPA would keep calling the old port and the browser would block
the response.

### Running each piece by hand

```bash
# Database only
docker compose up -d --wait db

# Backend
cd backend
cp .env.example .env
npm install
npm run migration:run       # creates the schema
npm run seed                # optional sample data
npm run start:dev           # or: npm run build && npm start

# Frontend, in another terminal
cd frontend
cp .env.example .env
npm install
npm run dev -- -p 5173      # next dev defaults to :3000, which the API uses
npm run build               # static export into frontend/out/
```

### Resetting the database

```bash
docker compose down -v      # -v also drops the data volume
./start.sh
```

---

## Requirements

| Tool | Version used | Minimum required |
|---|---|---|
| Docker Engine | 29.8.0 | 24+ |
| Docker Compose | v5.5.1 (plugin) | v2 (`docker compose`, not `docker-compose`) |
| bash | 5.2 | any POSIX bash/zsh |
| curl | 8.5 | any — `start.sh` uses it to poll the health endpoint |
| Node.js | 22.11.0 | `^20.19.0` or `>=22.12.0` — **only for local development** |
| npm | 11.12.1 | 9+ — only for local development |

`./start.sh` needs **nothing but Docker, bash and curl**: PostgreSQL, the API
and the SPA all run in containers, and the migrations and seed run inside the
API image. Node is only required to run an app directly on the host, or to use
Storybook and the end-to-end suite.

Verified end to end on **Ubuntu 24.04**.

### Main libraries

**Backend**

| Package | Version |
|---|---|
| @nestjs/common, @nestjs/core, @nestjs/platform-express | 11.2.3 |
| @nestjs/typeorm | 11.0.3 |
| typeorm | 0.3.31 |
| pg | 8.23.0 |
| PostgreSQL (container image) | 16-alpine |
| class-validator / class-transformer | 0.14.4 / 0.5.1 |
| typescript | 5.9.3 |
| jest / ts-jest / supertest | 29.7.0 / 29.4.12 / 7.2.2 |

**Frontend**

| Package | Version |
|---|---|
| next | 16.3.4 |
| react / react-dom | 19.2.8 |
| tailwindcss | 4.3.3 |
| swr | 2.5.1 |
| sonner | 2.0.8 |
| typescript | 5.9.3 |
| storybook | 10.6.0 |
| nginx (container image) | 1.27-alpine |

**End-to-end**

| Package | Version |
|---|---|
| @playwright/test | 1.50+ |

---

## Architecture

```
/
├── backend/             NestJS REST API (Controller → Service → Repository)
├── frontend/            Next.js SPA, static export served by nginx
├── e2e/                 Playwright suite driving the SPA against the API
├── docs/                deployment guide
├── .github/workflows/   CI: lint, build and tests for every app
├── docker-compose.yml   PostgreSQL + API + SPA
└── start.sh             one-command startup
```

### Backend layers

The exercise requires a visible separation of layers, so each domain is a NestJS
module with one file per responsibility:

```
src/notes/
├── notes.controller.ts   HTTP only: routes, status codes, DTO binding
├── notes.service.ts      business rules and orchestration
├── notes.repository.ts   the only file that talks to TypeORM
├── note.entity.ts        persistence model
└── dto/                  request validation contracts
```

`src/categories/` follows exactly the same shape. Two rules keep the boundaries
honest:

- Controllers never import `Repository<T>` from TypeORM — they only know the service.
- Services never import HTTP concerns beyond domain exceptions (`NotFoundException`,
  `ConflictException`), so they stay testable without any HTTP machinery.

Cross-module access goes through services, never repositories: `NotesService`
resolves category ids via `CategoriesService.resolveByIds()`, which is why
`CategoriesModule` exports only its service.

That isolation is what made the move from SQLite to PostgreSQL cheap: only the
driver, the migration and the connection config changed. No controller, service
or test needed edits.

### Data model

| Table | Columns |
|---|---|
| `notes` | `id`, `title`, `content`, `archived`, `created_at`, `updated_at` |
| `categories` | `id`, `name` (unique), `created_at` |
| `note_categories` | `note_id`, `category_id` — many-to-many join |

Archiving is a boolean on the note rather than a separate table: an archived note
is the same note in a different state, and the user stories only ever ask for two
lists. `note_categories` cascades on delete, so removing a category cleanly drops
its assignments without leaving orphan rows.

### Database and migrations

Persistence is PostgreSQL 16 accessed through TypeORM. The schema is **not**
created with `synchronize: true`; it comes from an explicit migration in
`backend/src/migrations/`, which is what `start.sh` runs.

`GET /api/health` is a readiness probe that runs `SELECT 1` and answers `503`
when the database is unreachable, so "the API responds" also means "the API can
reach its database". `start.sh` polls it before handing over to the SPA.

### Frontend

```
src/
├── app/          layout and page — every component is a Client Component
├── api/          the only place that performs HTTP calls
├── hooks/        useNotes / useCategories / useTheme
├── components/   presentational components + shared Tailwind class strings
└── types/        mirrors of the API contracts
```

**It is a static export, not a server-rendered app.** `next.config.ts` sets
`output: 'export'`, so `next build` emits plain HTML/CSS/JS and reports every
route as static. Nothing renders on a server at request time — the container
runs nginx over those files, which is why the image is ~75 MB. The exercise
treats server-side rendering as a rejection criterion, so this makes "it is a
SPA" verifiable rather than a claim.

Two consequences follow from that choice, on purpose:

- **There is no dev-server proxy.** The SPA calls the API by absolute URL and
  the backend allows the origin through CORS. `NEXT_PUBLIC_API_URL` is inlined
  into the bundle at build time, which is why the Docker image takes it as a
  build argument rather than a runtime variable.
- **No API routes, middleware or server components** that need a request-time
  server.

Components never call `fetch` directly; they go through `api/`. Data loading
uses **SWR** — the approach the Next.js static-export guide recommends over
fetching inside `useEffect` — so requests are deduped and every mutation
revalidates every cached note list, meaning the UI never shows state that was
not actually persisted.

Errors and confirmations surface as **toasts** (`sonner`) raised inside the
hooks, so no component handles errors on its own.

Styling is **TailwindCSS, mobile-first**: a single column below 640px, a
two-column note grid from there, and the category sidebar only from 1024px.
Dark mode is driven by a class on `<html>` rather than the media query, so the
toggle in the header can override the system preference; an inline script
applies the stored choice before first paint to avoid a flash.

---

## REST API

Base URL: `http://localhost:3000/api` locally, or the deployed API URL above.

### Notes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notes?archived=<bool>&categoryId=<id>` | List notes. Defaults to active ones; `categoryId` filters by category. |
| `GET` | `/notes/:id` | Get one note |
| `POST` | `/notes` | Create. Body: `{ title, content?, categoryIds? }` |
| `PATCH` | `/notes/:id` | Edit. Body: `{ title?, content?, categoryIds? }` |
| `DELETE` | `/notes/:id` | Delete (`204`) |
| `PATCH` | `/notes/:id/archive` | Archive |
| `PATCH` | `/notes/:id/unarchive` | Unarchive |
| `POST` | `/notes/:id/categories` | Attach a category. Body: `{ categoryId }` |
| `DELETE` | `/notes/:id/categories/:categoryId` | Detach a category |

Archive and unarchive are their own endpoints instead of a generic `PATCH` on the
`archived` field, because the user stories describe them as distinct actions.

Sending `categoryIds` in `PATCH /notes/:id` **replaces** the whole set of
categories on the note.

### Categories

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List all |
| `POST` | `/categories` | Create. Body: `{ name }` — `409` if the name exists |
| `DELETE` | `/categories/:id` | Delete (`204`) and detach it from every note |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | `200` with `{ status, database, uptime }`, `503` if the database is down |

### Errors

Every failure returns the same shape:

```json
{
  "statusCode": 404,
  "message": "Note 42 not found",
  "error": "NOT_FOUND",
  "path": "/api/notes/42",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

Validation errors return `400` with `message` as an array of problems. Unknown
fields in a request body are rejected rather than ignored.

---

## Configuration

`backend/.env` (created from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://notes:notes@localhost:5432/notes` | PostgreSQL connection string |
| `DATABASE_SSL` | `false` | `true` for managed Postgres that requires TLS |
| `PORT` | `3000` | Port the API listens on |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3001` | Comma-separated list of allowed origins; `*` allows any |
| `DB_LOGGING` | `false` | Log every SQL statement |

`frontend/.env`:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Absolute URL of the REST API. Inlined at build time |

`docker-compose.yml` also reads `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB`, `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `CORS_ORIGIN`
and `NEXT_PUBLIC_API_URL` from the environment, all with working defaults.

The API prints the origins it allows at startup and logs any origin it blocks,
so a CORS misconfiguration is visible in the server log rather than only as a
failed request in the browser.

Pointing the SPA at a different API means **rebuilding** it, because the value
is compiled into the bundle:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api \
CORS_ORIGIN=https://notes.example.com \
docker compose up -d --build
```

---

## Quality

### Backend tests

```bash
docker compose up -d --wait db   # the suite needs a running PostgreSQL
npm --prefix backend test
```

24 tests: unit tests for the service layer with mocked repositories, plus an
end-to-end suite that hits the HTTP API against a real PostgreSQL built by the
same migration the app ships.

The API suite **creates and drops its own throwaway database** on every run
(`notes_e2e_<pid>`), so it never touches development data. A dedicated database
rather than a schema: the migration issues raw SQL with unqualified table names,
which resolves through `search_path` and would land in `public` regardless of
TypeORM's `schema` option.

```bash
npm --prefix backend test -- notes.service     # one file
npm --prefix backend test -- -t "archives"     # tests matching a name
npm --prefix backend run test:unit             # unit tests only, no database
```

### Browser end-to-end tests

```bash
./start.sh                                   # in another terminal
npm --prefix e2e ci
npm --prefix e2e run install:browsers        # first run only
npm --prefix e2e test
```

12 Playwright tests driving the real SPA against the real API: create, edit,
archive, unarchive, delete, persistence across a reload, and category creation,
duplicate rejection, assignment, filtering and removal.

The suite shares one database with the app, so each test namespaces the rows it
creates and the tests run serially. `E2E_BASE_URL` points them at another host.

### Storybook

```bash
npm --prefix frontend run storybook          # http://localhost:6006
npm --prefix frontend run build-storybook    # static build into storybook-static/
```

28 stories across the 8 components, covering the states that are awkward to
reach in the running app: empty lists, the loading skeletons, the error message,
a note with no body, a title long enough to test wrapping, and the category form
mid-submit.

The toolbar has a **theme switch** that toggles the same `dark` class on `<html>`
the app uses, so every component is reviewed in both themes. The **a11y addon**
runs axe against each story.

> Storybook requires Node `^20.19.0 || >=22.12.0` and refuses to start below
> that — stricter than the app itself, which runs on 22.11.

### Linters

```bash
npm --prefix backend run lint
npm --prefix frontend run lint
```

### Continuous integration

`.github/workflows/ci.yml` runs three jobs on every push and pull request:

| Job | What it checks |
|---|---|
| Backend | lint, build, and the 24 tests against a `postgres:16` service |
| Frontend | lint, build, Storybook build, and that the export really is static |
| E2E | builds and starts the whole compose stack, then runs Playwright against it |

The Playwright report is uploaded as an artifact when the suite fails, together
with the container logs.

---

## Deployment

Three independent pieces: **Supabase** for PostgreSQL, **Render** for the API
and **Vercel** for the SPA. The API is a long-running server holding a
connection pool, so it does not belong on a serverless platform; the SPA is a
folder of static files, so a CDN is exactly right.

The repository ships what the deployment needs:

- `render.yaml` — Render blueprint for the API, running `backend/Dockerfile`
  with `/api/health` as the health check. Secrets are declared `sync: false`,
  so Render prompts for them and they never enter the repository.
- `frontend/vercel.json` — Vercel build configuration for the static export.
- **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** — the step-by-step guide,
  including a troubleshooting table.

Two things decide whether the deployment works, and both are covered there:

1. **Which Supabase connection string.** Use the *session pooler* on port 5432.
   The transaction pooler on 6543 breaks prepared statements, and the direct
   connection is IPv6-only unless you buy the IPv4 add-on.
2. **The CORS loop.** The SPA needs the API's URL at *build* time
   (`NEXT_PUBLIC_API_URL` is compiled into the bundle), and afterwards the API
   needs the SPA's origin in `CORS_ORIGIN`. Missing that last step is what makes
   a deployment load correctly and then fail every request.

---

## Notes on dependencies

`@nestjs/platform-express` still resolves `multer` 2.2.0, which carries four
high-severity advisories. The app has no file uploads, but `npm audit fix --force`
would downgrade NestJS to v7, so the patched release is pinned through an
`overrides` entry in `backend/package.json` instead. `npm audit` reports zero
vulnerabilities for both apps.
