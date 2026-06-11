import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChannelImageObjectKeys1746310000000 implements MigrationInterface {
  public readonly name = 'AddChannelImageObjectKeys1746310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "avatar_object_key" character varying(500)
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "banner_object_key" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channels" DROP COLUMN IF EXISTS "banner_object_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "channels" DROP COLUMN IF EXISTS "avatar_object_key"
    `);
  }
}
