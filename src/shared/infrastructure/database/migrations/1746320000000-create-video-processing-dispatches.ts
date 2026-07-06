import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVideoProcessingDispatches1746320000000
  implements MigrationInterface
{
  name = 'CreateVideoProcessingDispatches1746320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'video_processing_dispatches_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."video_processing_dispatches_status_enum" AS ENUM(
            'pending',
            'processing',
            'dispatched'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_processing_dispatches" (
        "id" character varying(36) NOT NULL,
        "video_id" character varying(36) NOT NULL,
        "job_id" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "public"."video_processing_dispatches_status_enum" NOT NULL DEFAULT 'pending',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "next_attempt_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "locked_at" TIMESTAMPTZ,
        "dispatched_at" TIMESTAMPTZ,
        "last_error" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_processing_dispatches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_video_processing_dispatches_job_id" UNIQUE ("job_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_processing_dispatches_status_next_attempt_at"
      ON "video_processing_dispatches" ("status", "next_attempt_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_processing_dispatches_video_id"
      ON "video_processing_dispatches" ("video_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_processing_dispatches_video_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_processing_dispatches_status_next_attempt_at"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "video_processing_dispatches"`);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."video_processing_dispatches_status_enum"
    `);
  }
}
