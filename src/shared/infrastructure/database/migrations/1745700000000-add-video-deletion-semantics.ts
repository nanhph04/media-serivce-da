import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoDeletionSemantics1745700000000
  implements MigrationInterface
{
  public readonly name = 'AddVideoDeletionSemantics1745700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."videos_status_enum"
      ADD VALUE IF NOT EXISTS 'banned'
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "deleted_by" character varying(36)
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "delete_reason" character varying(100)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_public_visibility"
      ON "videos" ("status", "visibility", "is_deleted", "published_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_videos_public_visibility"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "delete_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "deleted_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "deleted_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "is_deleted"
    `);
    await queryRunner.query(`
      UPDATE "videos"
      SET "status" = 'failed'
      WHERE "status" = 'banned'
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "status" TYPE text USING "status"::text
    `);
    await queryRunner.query(`DROP TYPE "public"."videos_status_enum"`);
    await queryRunner.query(`
      CREATE TYPE "public"."videos_status_enum" AS ENUM(
        'draft',
        'processing',
        'ready',
        'failed',
        'pending_moderation',
        'pending_manual_review',
        'rejected'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "status" TYPE "public"."videos_status_enum"
      USING "status"::"public"."videos_status_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);
  }
}
