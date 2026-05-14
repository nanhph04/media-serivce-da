import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoModerationDetails1746210000000
  implements MigrationInterface
{
  name = 'AddVideoModerationDetails1746210000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "moderation_details" jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
      DROP COLUMN IF EXISTS "moderation_details"
    `);
  }
}
