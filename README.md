# Notes App

Full stack notes application: create, edit, delete and archive notes, tag them
with categories and filter by category.

- **Phase 1** (notes + archiving) — implemented.
- **Phase 2** (categories + filtering) — implemented.

The frontend and the backend are two independent applications, each with its own
`package.json`. They communicate exclusively over a REST API.

---

## Requirements

| Tool | Version used | Minimum required |
|---|---|---|
| Node.js | 22.11.0 | `^20.19.0` or `>=22.12.0` |
| npm | 11.12.1 | 9+ |
| bash | 5.2 | any POSIX bash/zsh |

Nothing else is needed: no database server, no Docker. The database is SQLite,
which lives in a file created by the migrations.

> **Note on the Node version.** The app was developed on Node 22.11.0 and runs
> fine there, but Vite 7 formally asks for `^20.19.0 || >=22.12.0` and prints a
> warning below that. Node 22.12+ is recommended to keep the output clean.

### Main libraries

**Backend**

| Package | Version |
|---|---|
| @nestjs/common, @nestjs/core, @nestjs/platform-express | 11.2.3 |
| @nestjs/typeorm | 11.0.3 |
| typeorm | 0.3.31 |
| better-sqlite3 | 11.10.0 |
| class-validator / class-transformer | 0.14.4 / 0.5.1 |
| typescript | 5.9.3 |
| jest / ts-jest / supertest | 29.7.0 / 29.4.12 / 7.2.2 |

**Frontend**

| Package | Version |
|---|---|
| react / react-dom | 19.3.0 |
| vite | 7.3.6 |
| @vitejs/plugin-react | 5.2.0 |
| typescript | 5.9.3 |

---

## Running the app

From the root of the repository:

```bash
./start.sh
```

That single command installs both apps' dependencies, creates the `.env` files
from their `.env.example` templates, applies the database migrations, builds the
backend and starts everything.

- SPA: <http://localhost:5173>
- REST API: <http://localhost:3000/api>

Press `Ctrl+C` to stop both processes.

If the script is not executable after cloning:

```bash
chmod +x start.sh
```

### Running each app by hand

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migration:run     # creates the SQLite schema
npm run start:dev         # or: npm run build && npm start

# Frontend (in another terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Tests

```bash
cd backend
npm test
```

24 tests: unit tests for the service layer with mocked repositories, plus an
end-to-end suite that hits the HTTP API against a real SQLite database built by
the same migration the app uses.

To run a single suite or a single test:

```bash
npm test -- notes.service          # one file
npm test -- -t "archives"          # tests matching a name
```

### There is no login

The exercise lists a login screen as optional and it was not implemented, so
there are no credentials to document. All notes belong to a single implicit user.

---

## Architecture

```
/
├── backend/     NestJS REST API (Controller → Service → Repository)
├── frontend/    React SPA (Vite)
└── start.sh     one-command startup
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

### Database and ORM

Persistence is a relational database accessed through TypeORM. SQLite was chosen
over PostgreSQL for one concrete reason: the exercise requires the app to start
with a single command, and SQLite needs no server, no Docker and no credentials,
so `./start.sh` works on a clean machine without any manual setup.

The schema is **not** created with `synchronize: true`. It is created by an
explicit TypeORM migration (`src/migrations/`), which is what `start.sh` runs.
Switching to PostgreSQL would mean changing the driver in
`src/config/typeorm.config.ts` and porting that migration.

### Frontend

```
src/
├── api/          the only place that performs HTTP calls
├── hooks/        useNotes / useCategories — state, loading and errors
├── components/   presentational components
└── types/        mirrors of the API contracts
```

Components never call `fetch` directly; they go through `api/`. After every
mutation the hooks re-read the list from the server, so the UI never shows state
that was not actually persisted.

In development Vite proxies `/api` to the backend, so the browser sees a single
origin. Set `VITE_API_URL` to point the SPA at an API on another host instead.

---

## REST API

Base URL: `http://localhost:3000/api`

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
| `PORT` | `3000` | Port the API listens on |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin allowed by CORS |
| `DB_PATH` | `data/notes.sqlite` | SQLite file, relative to `backend/` |
| `DB_LOGGING` | `false` | Log every SQL statement |

`frontend/.env`:

| Variable | Default | Description |
|---|---|---|
| `VITE_PROXY_TARGET` | `http://localhost:3000` | Backend the dev server proxies `/api` to |
| `VITE_API_URL` | *(unset)* | Set to call an API directly, bypassing the proxy |

### Resetting the database

```bash
rm backend/data/notes.sqlite
npm --prefix backend run migration:run
```

---

## Known issue

`better-sqlite3` is a native module. It ships prebuilt binaries for the usual
Linux and macOS targets, so `npm install` normally does not compile anything. On
a platform without a matching prebuild, npm falls back to building from source,
which needs Python and a C++ toolchain (`build-essential` on Debian/Ubuntu, Xcode
Command Line Tools on macOS).

## Deployment

The app was not deployed; there is no live URL to document.
