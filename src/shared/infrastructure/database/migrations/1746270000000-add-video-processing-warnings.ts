import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoProcessingWarnings1746270000000 implements MigrationInterface {
  public readonly name = 'AddVideoProcessingWarnings1746270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "processing_warnings" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "processing_warnings"
    `);
  }
}
