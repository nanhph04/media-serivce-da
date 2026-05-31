import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVideoViewDailyStats1746280000000
  implements MigrationInterface
{
  public readonly name = 'CreateVideoViewDailyStats1746280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_view_daily_stats" (
        "video_id" character varying(36) NOT NULL,
        "stat_date" date NOT NULL,
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_view_daily_stats" PRIMARY KEY ("video_id", "stat_date")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_view_daily_stats_stat_date_view_count"
      ON "video_view_daily_stats" ("stat_date", "view_count" DESC)
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_video_view_daily_stats_video_id'
        ) THEN
          ALTER TABLE "video_view_daily_stats"
          ADD CONSTRAINT "FK_video_view_daily_stats_video_id"
          FOREIGN KEY ("video_id") REFERENCES "videos"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "video_view_daily_stats"
      DROP CONSTRAINT IF EXISTS "FK_video_view_daily_stats_video_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_view_daily_stats_stat_date_view_count"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "video_view_daily_stats"
    `);
  }
}
