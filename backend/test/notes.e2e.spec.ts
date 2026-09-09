import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { CategoriesModule } from '../src/categories/categories.module';
import { Category } from '../src/categories/category.entity';
import { InitialSchema1757462400000 } from '../src/migrations/1757462400000-InitialSchema';
import { Note } from '../src/notes/note.entity';
import { NotesModule } from '../src/notes/notes.module';

/**
 * Runs against a real SQLite file built by the same migration the app uses,
 * so this also proves the migration produces a schema the entities can use.
 */
describe('Notes API (e2e)', () => {
  const databasePath = join(tmpdir(), `notes-e2e-${Date.now()}.sqlite`);
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: databasePath,
          entities: [Note, Category],
          migrations: [InitialSchema1757462400000],
          migrationsRun: true,
          synchronize: false,
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
    await app.close();
    rmSync(databasePath, { force: true });
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
