import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1745610000000
  implements MigrationInterface
{
  public readonly name = 'AddPerformanceIndexes1745610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_status_visibility_published_created"
      ON "videos" ("status", "visibility", "published_at" DESC, "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_channel_status_visibility_published_created"
      ON "videos" (
        "channel_id",
        "status",
        "visibility",
        "published_at" DESC,
        "created_at" DESC
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_watch_progress_continue_watching"
      ON "video_watch_progress" ("user_id", "last_watched_at" DESC)
      WHERE "completed_at" IS NULL AND "last_position_seconds" > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_video_watch_progress_continue_watching"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_videos_channel_status_visibility_published_created"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_videos_status_visibility_published_created"
    `);
  }
}
