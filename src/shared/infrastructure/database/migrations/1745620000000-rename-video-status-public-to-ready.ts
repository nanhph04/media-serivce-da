import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameVideoStatusPublicToReady1745620000000 implements MigrationInterface {
  public readonly name = 'RenameVideoStatusPublicToReady1745620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'videos_status_enum' AND e.enumlabel = 'public'
        ) THEN
          ALTER TYPE "public"."videos_status_enum" RENAME VALUE 'public' TO 'ready';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'videos_status_enum' AND e.enumlabel = 'ready'
        ) THEN
          ALTER TYPE "public"."videos_status_enum" RENAME VALUE 'ready' TO 'public';
        END IF;
      END
      $$;
    `);
  }
}
