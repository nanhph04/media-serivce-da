import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipAutoRenew1746230000000
  implements MigrationInterface
{
  public readonly name = 'AddMembershipAutoRenew1746230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'channel_memberships_renewal_status_enum'
        ) THEN
          CREATE TYPE "public"."channel_memberships_renewal_status_enum"
          AS ENUM ('idle', 'pending', 'retrying', 'disabled');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      ADD COLUMN IF NOT EXISTS "auto_renew_enabled" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      ADD COLUMN IF NOT EXISTS "renewal_status"
      "public"."channel_memberships_renewal_status_enum" NOT NULL DEFAULT 'idle'
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      ADD COLUMN IF NOT EXISTS "renewal_reminder_sent_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      ADD COLUMN IF NOT EXISTS "last_renewal_attempt_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      ADD COLUMN IF NOT EXISTS "next_renewal_attempt_at" TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_channel_memberships_auto_renew_due"
      ON "channel_memberships" ("auto_renew_enabled", "renewal_status", "expiry_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_channel_memberships_auto_renew_due"`,
    );
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      DROP COLUMN IF EXISTS "next_renewal_attempt_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      DROP COLUMN IF EXISTS "last_renewal_attempt_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      DROP COLUMN IF EXISTS "renewal_reminder_sent_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      DROP COLUMN IF EXISTS "renewal_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_memberships"
      DROP COLUMN IF EXISTS "auto_renew_enabled"
    `);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."channel_memberships_renewal_status_enum"`,
    );
  }
}
