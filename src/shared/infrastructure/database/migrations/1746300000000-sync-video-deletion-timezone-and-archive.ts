import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncVideoDeletionTimezoneAndArchive1746300000000
  implements MigrationInterface
{
  public readonly name = 'SyncVideoDeletionTimezoneAndArchive1746300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET TIME ZONE 'UTC'`);

    await queryRunner.query(`
      ALTER TABLE "outbox_messages"
      ALTER COLUMN "next_attempt_at" TYPE TIMESTAMPTZ USING "next_attempt_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "next_attempt_at" SET DEFAULT now(),
      ALTER COLUMN "locked_at" TYPE TIMESTAMPTZ USING "locked_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "published_at" TYPE TIMESTAMPTZ USING "published_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'Asia/Ho_Chi_Minh'
    `);

    await queryRunner.query(`
      UPDATE "outbox_messages"
      SET "next_attempt_at" = now(), "updated_at" = now()
      WHERE "status" = 'pending'
        AND "next_attempt_at" > now()
        AND "next_attempt_at" <= now() + INTERVAL '1 day'
    `);

    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "storage_deleted_at" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "published_at" TYPE TIMESTAMPTZ USING "published_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ USING "deleted_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "delete_requested_at" TYPE TIMESTAMPTZ USING "delete_requested_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "refund_completed_at" TYPE TIMESTAMPTZ USING "refund_completed_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "storage_deleted_at" TYPE TIMESTAMPTZ USING "storage_deleted_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "status_changed_at" TYPE TIMESTAMPTZ USING "status_changed_at" AT TIME ZONE 'Asia/Ho_Chi_Minh'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET TIME ZONE 'UTC'`);

    await queryRunner.query(`
      ALTER TABLE "videos"
      ALTER COLUMN "published_at" TYPE TIMESTAMP USING "published_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "deleted_at" TYPE TIMESTAMP USING "deleted_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "delete_requested_at" TYPE TIMESTAMP USING "delete_requested_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "refund_completed_at" TYPE TIMESTAMP USING "refund_completed_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "updated_at" TYPE TIMESTAMP USING "updated_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "status_changed_at" TYPE TIMESTAMP USING "status_changed_at" AT TIME ZONE 'Asia/Ho_Chi_Minh'
    `);

    await queryRunner.query(`
      ALTER TABLE "videos" DROP COLUMN IF EXISTS "storage_deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "outbox_messages"
      ALTER COLUMN "next_attempt_at" TYPE TIMESTAMP USING "next_attempt_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "next_attempt_at" DROP DEFAULT,
      ALTER COLUMN "locked_at" TYPE TIMESTAMP USING "locked_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "published_at" TYPE TIMESTAMP USING "published_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at" AT TIME ZONE 'Asia/Ho_Chi_Minh',
      ALTER COLUMN "updated_at" TYPE TIMESTAMP USING "updated_at" AT TIME ZONE 'Asia/Ho_Chi_Minh'
    `);
  }
}
