import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropContentReports1746290000000 implements MigrationInterface {
  public readonly name = 'DropContentReports1746290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_content_reports_pending_channel_once"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_content_reports_pending_video_once"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_content_reports_reporter"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_content_reports_target_channel"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_content_reports_target_video"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "public"."IDX_content_reports_status_created_at"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "content_reports"');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "public"."content_reports_status_enum"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "public"."content_reports_target_type_enum"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'content_reports_target_type_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."content_reports_target_type_enum" AS ENUM('video', 'channel');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'content_reports_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."content_reports_status_enum" AS ENUM('pending', 'resolved', 'dismissed');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "content_reports" (
        "id" character varying(36) NOT NULL,
        "target_type" "public"."content_reports_target_type_enum" NOT NULL,
        "reporter_user_id" character varying(36) NOT NULL,
        "target_video_id" character varying(36),
        "target_channel_id" character varying(36),
        "reason" character varying(1000) NOT NULL,
        "evidence_timestamp_seconds" integer,
        "context_video_id" character varying(36),
        "context_video_title" character varying(255),
        "status" "public"."content_reports_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_reports" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_status_created_at"
      ON "content_reports" ("status", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_target_video"
      ON "content_reports" ("target_type", "target_video_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_target_channel"
      ON "content_reports" ("target_type", "target_channel_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_reports_reporter"
      ON "content_reports" ("reporter_user_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_content_reports_pending_video_once"
      ON "content_reports" ("reporter_user_id", "target_video_id")
      WHERE "target_type" = 'video' AND "status" = 'pending' AND "target_video_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_content_reports_pending_channel_once"
      ON "content_reports" ("reporter_user_id", "target_channel_id")
      WHERE "target_type" = 'channel' AND "status" = 'pending' AND "target_channel_id" IS NOT NULL
    `);
  }
}
