import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipAdminClose1745660000000 implements MigrationInterface {
  public readonly name = 'AddMembershipAdminClose1745660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "is_membership_closed_by_admin" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "is_membership_closed_by_admin"
    `);
  }
}
