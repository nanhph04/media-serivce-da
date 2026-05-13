import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoStatusChangedAt1745690000000 implements MigrationInterface {
  public readonly name = 'AddVideoStatusChangedAt1745690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "status_changed_at" TIMESTAMP
    `);
    await queryRunner.query(`
      UPDATE "videos"
      SET "status_changed_at" = "updated_at"
      WHERE "status_changed_at" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "status_changed_at" SET DEFAULT now(),
      ALTER COLUMN "status_changed_at" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_status_status_changed_at"
      ON "videos" ("status", "status_changed_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_videos_status_status_changed_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "status_changed_at"
    `);
  }
}
