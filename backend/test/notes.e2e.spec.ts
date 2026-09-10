import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CategoriesModule } from '../src/categories/categories.module';
import { Category } from '../src/categories/category.entity';
import { InitialSchema1757980000000 } from '../src/migrations/1757980000000-InitialSchema';
import { Note } from '../src/notes/note.entity';
import { NotesModule } from '../src/notes/notes.module';

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgres://notes:notes@localhost:5432/notes';

const SSL =
  process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;

/**
 * Every run gets a throwaway database, created and dropped by the suite, so the
 * tests never touch development data and concurrent runs cannot collide.
 *
 * A dedicated database rather than a Postgres schema: the migration issues raw
 * SQL with unqualified table names, which resolves through `search_path` and
 * would land in `public` regardless of TypeORM's `schema` option.
 */
const TEST_DATABASE = `notes_e2e_${process.pid}`;

function withDatabase(connectionUrl: string, database: string): string {
  const parsed = new URL(connectionUrl);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

/** `postgres` is the maintenance database: CREATE/DROP DATABASE run from there. */
const MAINTENANCE_URL = withDatabase(DATABASE_URL, 'postgres');
const TEST_URL = withDatabase(DATABASE_URL, TEST_DATABASE);

async function runOnMaintenance(statements: string[]): Promise<void> {
  const admin = new DataSource({
    type: 'postgres',
    url: MAINTENANCE_URL,
    ssl: SSL,
  });
  await admin.initialize();
  try {
    for (const statement of statements) {
      await admin.query(statement);
    }
  } finally {
    await admin.destroy();
  }
}

/**
 * Runs against a real PostgreSQL built by the same migration the app ships,
 * so this also proves the migration produces a schema the entities can use.
 */
describe('Notes API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await runOnMaintenance([
      `DROP DATABASE IF EXISTS "${TEST_DATABASE}"`,
      `CREATE DATABASE "${TEST_DATABASE}"`,
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: TEST_URL,
          entities: [Note, Category],
          migrations: [InitialSchema1757980000000],
          migrationsRun: true,
          synchronize: false,
          retryAttempts: 0,
          ssl: SSL,
        }),
        NotesModule,
        CategoriesModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    // The app has to let go of its pool before the database can be dropped.
    if (app) {
      await app.close();
    }
    await runOnMaintenance([`DROP DATABASE IF EXISTS "${TEST_DATABASE}"`]);
  });

  const api = () => request(app.getHttpServer());

  it('starts with an empty list', async () => {
    await api().get('/api/notes').expect(200).expect([]);
  });

  it('rejects a note without a title', async () => {
    await api().post('/api/notes').send({ content: 'orphan' }).expect(400);
  });

  it('creates, edits and deletes a note', async () => {
    const created = await api()
      .post('/api/notes')
      .send({ title: 'First', content: 'Body' })
      .expect(201);

    expect(created.body).toMatchObject({
      title: 'First',
      content: 'Body',
      archived: false,
      categories: [],
    });

    const id: number = created.body.id;

    await api()
      .patch(`/api/notes/${id}`)
      .send({ title: 'Renamed' })
      .expect(200)
      .expect((res) => expect(res.body.title).toBe('Renamed'));

    await api().delete(`/api/notes/${id}`).expect(204);
    await api().get(`/api/notes/${id}`).expect(404);
  });

  it('moves a note between the active and archived lists', async () => {
    const { body: note } = await api()
      .post('/api/notes')
      .send({ title: 'Archivable' })
      .expect(201);

    await api().patch(`/api/notes/${note.id}/archive`).expect(200);

    const active = await api().get('/api/notes?archived=false').expect(200);
    expect(active.body.map((n: Note) => n.id)).not.toContain(note.id);

    const archived = await api().get('/api/notes?archived=true').expect(200);
    expect(archived.body.map((n: Note) => n.id)).toContain(note.id);

    await api().patch(`/api/notes/${note.id}/unarchive`).expect(200);
    const backToActive = await api().get('/api/notes?archived=false');
    expect(backToActive.body.map((n: Note) => n.id)).toContain(note.id);
  });

  it('filters by category without dropping the other categories of a note', async () => {
    const { body: work } = await api()
      .post('/api/categories')
      .send({ name: 'Work' })
      .expect(201);
    const { body: urgent } = await api()
      .post('/api/categories')
      .send({ name: 'Urgent' })
      .expect(201);

    const { body: tagged } = await api()
      .post('/api/notes')
      .send({ title: 'Tagged', categoryIds: [work.id, urgent.id] })
      .expect(201);

    await api().post('/api/notes').send({ title: 'Untagged' }).expect(201);

    const filtered = await api()
      .get(`/api/notes?archived=false&categoryId=${work.id}`)
      .expect(200);

    const ids = filtered.body.map((n: Note) => n.id);
    expect(ids).toContain(tagged.id);

    const found = filtered.body.find((n: Note) => n.id === tagged.id);
    expect(found.categories).toHaveLength(2);
  });

  it('rejects a duplicated category name', async () => {
    await api().post('/api/categories').send({ name: 'Unique' }).expect(201);
    await api().post('/api/categories').send({ name: 'Unique' }).expect(409);
  });

  it('attaches and detaches a category on an existing note', async () => {
    const { body: category } = await api()
      .post('/api/categories')
      .send({ name: 'Later' })
      .expect(201);
    const { body: note } = await api()
      .post('/api/notes')
      .send({ title: 'Plain' })
      .expect(201);

    const attached = await api()
      .post(`/api/notes/${note.id}/categories`)
      .send({ categoryId: category.id })
      .expect(200);
    expect(attached.body.categories).toHaveLength(1);

    const detached = await api()
      .delete(`/api/notes/${note.id}/categories/${category.id}`)
      .expect(200);
    expect(detached.body.categories).toHaveLength(0);
  });

  it('fails when creating a note with an unknown category', async () => {
    await api()
      .post('/api/notes')
      .send({ title: 'Bad', categoryIds: [9999] })
      .expect(404);
  });
});
