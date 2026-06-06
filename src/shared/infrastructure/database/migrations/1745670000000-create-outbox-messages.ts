import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxMessages1745670000000 implements MigrationInterface {
  name = 'CreateOutboxMessages1745670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'outbox_messages_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."outbox_messages_status_enum" AS ENUM(
            'pending',
            'processing',
            'published'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outbox_messages" (
        "id" character varying(36) NOT NULL,
        "topic" character varying(255) NOT NULL,
        "message_key" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "public"."outbox_messages_status_enum" NOT NULL DEFAULT 'pending',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "next_attempt_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "locked_at" TIMESTAMPTZ,
        "published_at" TIMESTAMPTZ,
        "last_error" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_outbox_messages_status_next_attempt_at"
      ON "outbox_messages" ("status", "next_attempt_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_outbox_messages_status_next_attempt_at"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "outbox_messages"`);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."outbox_messages_status_enum"
    `);
  }
}
