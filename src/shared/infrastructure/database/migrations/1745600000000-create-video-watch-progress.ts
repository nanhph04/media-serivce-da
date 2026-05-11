import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVideoWatchProgress1745600000000 implements MigrationInterface {
  public readonly name = 'CreateVideoWatchProgress1745600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_watch_progress" (
        "id" character varying(36) NOT NULL,
        "user_id" character varying(36) NOT NULL,
        "video_id" character varying(36) NOT NULL,
        "channel_id" character varying(36) NOT NULL,
        "last_position_seconds" integer NOT NULL DEFAULT 0,
        "duration_seconds" integer,
        "last_watched_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_watch_progress_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_video_watch_progress_user_id_video_id"
      ON "video_watch_progress" ("user_id", "video_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_watch_progress_user_id_last_watched_at"
      ON "video_watch_progress" ("user_id", "last_watched_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_watch_progress_video_id"
      ON "video_watch_progress" ("video_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_video_watch_progress_video_id'
        ) THEN
          ALTER TABLE "video_watch_progress"
          ADD CONSTRAINT "FK_video_watch_progress_video_id"
          FOREIGN KEY ("video_id") REFERENCES "videos"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "video_watch_progress"
      DROP CONSTRAINT IF EXISTS "FK_video_watch_progress_video_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_watch_progress_video_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_watch_progress_user_id_last_watched_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_watch_progress_user_id_video_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "video_watch_progress"
    `);
  }
}
