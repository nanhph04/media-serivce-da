import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoModerationStatuses1745630000000
  implements MigrationInterface
{
  public readonly name = 'AddVideoModerationStatuses1745630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."videos_status_enum"
      ADD VALUE IF NOT EXISTS 'pending_moderation'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."videos_status_enum"
      ADD VALUE IF NOT EXISTS 'pending_manual_review'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."videos_status_enum"
      ADD VALUE IF NOT EXISTS 'rejected'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "videos"
      SET "status" = 'failed'
      WHERE "status" IN ('pending_moderation', 'pending_manual_review', 'rejected')
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
        'failed'
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
