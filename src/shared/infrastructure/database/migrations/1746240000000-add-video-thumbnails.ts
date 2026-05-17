import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoThumbnails1746240000000 implements MigrationInterface {
  public readonly name = 'AddVideoThumbnails1746240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "thumbnail_object_key" character varying(500)
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "thumbnail_source" character varying(16) NOT NULL DEFAULT 'auto'
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "thumbnail_status" character varying(16) NOT NULL DEFAULT 'pending'
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "thumbnail_generated_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "thumbnail_error" text
    `);
    await queryRunner.query(`
      UPDATE "videos"
      SET "thumbnail_status" = 'ready'
      WHERE "thumbnail_url" IS NOT NULL
        AND "thumbnail_status" = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "thumbnail_error"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "thumbnail_generated_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "thumbnail_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "thumbnail_source"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "thumbnail_object_key"
    `);
  }
}
