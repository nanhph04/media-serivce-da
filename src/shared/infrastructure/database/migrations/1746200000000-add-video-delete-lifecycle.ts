import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoDeleteLifecycle1746200000000
  implements MigrationInterface
{
  public readonly name = 'AddVideoDeleteLifecycle1746200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "deletion_status" varchar(32) NOT NULL DEFAULT 'active'
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "delete_requested_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "refund_completed_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "refund_summary" jsonb
    `);
    await queryRunner.query(`
      UPDATE "videos"
      SET
        "deletion_status" = CASE
          WHEN "is_deleted" = true THEN 'pending_delete'
          ELSE 'active'
        END,
        "delete_requested_at" = COALESCE("delete_requested_at", "deleted_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_deletion_status"
      ON "videos" ("deletion_status", "updated_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_videos_deletion_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "refund_summary"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "refund_completed_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "delete_requested_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "deletion_status"
    `);
  }
}
