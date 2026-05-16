import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipReviewStatus1746220000000
  implements MigrationInterface
{
  public readonly name = 'AddMembershipReviewStatus1746220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'channels_membership_review_status_enum'
            AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."channels_membership_review_status_enum"
          AS ENUM('not_requested', 'pending', 'approved', 'rejected');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "membership_review_status"
      "public"."channels_membership_review_status_enum"
      NOT NULL DEFAULT 'not_requested'
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "membership_rejection_reason" text
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "membership_reviewed_by" character varying(36)
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "membership_reviewed_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "membership_requested_at" TIMESTAMP
    `);
    await queryRunner.query(`
      UPDATE "channels"
      SET
        "membership_review_status" = 'pending',
        "membership_requested_at" = COALESCE("membership_requested_at", now())
      WHERE "is_eligible_for_membership" = true
        AND "membership_review_status" = 'not_requested'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "membership_requested_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "membership_reviewed_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "membership_reviewed_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "membership_rejection_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "membership_review_status"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."channels_membership_review_status_enum"
    `);
  }
}
