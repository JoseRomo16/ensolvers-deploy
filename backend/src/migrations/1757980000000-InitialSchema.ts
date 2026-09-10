import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1757980000000 implements MigrationInterface {
  name = 'InitialSchema1757980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL DEFAULT '',
        "archived" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(60) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "note_categories" (
        "note_id" integer NOT NULL,
        "category_id" integer NOT NULL,
        CONSTRAINT "PK_note_categories" PRIMARY KEY ("note_id", "category_id"),
        CONSTRAINT "FK_note_categories_note"
          FOREIGN KEY ("note_id") REFERENCES "notes" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_note_categories_category"
          FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Listing active vs archived notes is the most frequent query in the app.
    await queryRunner.query(
      `CREATE INDEX "IDX_notes_archived" ON "notes" ("archived")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_note_categories_note" ON "note_categories" ("note_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_note_categories_category" ON "note_categories" ("category_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_note_categories_category"`);
    await queryRunner.query(`DROP INDEX "IDX_note_categories_note"`);
    await queryRunner.query(`DROP INDEX "IDX_notes_archived"`);
    await queryRunner.query(`DROP TABLE "note_categories"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "notes"`);
  }
}
