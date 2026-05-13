import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryTagsModel1745680000000 implements MigrationInterface {
  public readonly name = 'AddCategoryTagsModel1745680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "parent_id" character varying(36)
    `);
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_categories_parent_id'
        ) THEN
          ALTER TABLE "categories"
          ADD CONSTRAINT "FK_categories_parent_id"
          FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_categories_status_display_order"
      ON "categories" ("status", "display_order")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'tags_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."tags_status_enum" AS ENUM(
            'active',
            'inactive',
            'pending',
            'deleted'
          );
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" character varying(36) NOT NULL,
        "name" character varying(100) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "status" "public"."tags_status_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tags_slug" ON "tags" ("slug")
    `);

    await queryRunner.query(`
      ALTER TABLE "videos"
      ADD COLUMN IF NOT EXISTS "category_id" character varying(36)
    `);
    await queryRunner.query(`
      UPDATE "videos" video
      SET "category_id" = picked_category."category_id"
      FROM (
        SELECT DISTINCT ON ("video_id") "video_id", "category_id"
        FROM "video_categories"
        ORDER BY "video_id", "category_id"
      ) picked_category
      WHERE video."id" = picked_category."video_id"
        AND video."category_id" IS NULL
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_videos_category_id'
        ) THEN
          ALTER TABLE "videos"
          ADD CONSTRAINT "FK_videos_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_category_id_status_visibility"
      ON "videos" ("category_id", "status", "visibility")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_tags" (
        "video_id" character varying(36) NOT NULL,
        "tag_id" character varying(36) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_tags_video_id_tag_id" PRIMARY KEY ("video_id", "tag_id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_video_tags_video_id_tag_id"
      ON "video_tags" ("video_id", "tag_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_tags_tag_id" ON "video_tags" ("tag_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_video_tags_video_id'
        ) THEN
          ALTER TABLE "video_tags"
          ADD CONSTRAINT "FK_video_tags_video_id"
          FOREIGN KEY ("video_id") REFERENCES "videos"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_video_tags_tag_id'
        ) THEN
          ALTER TABLE "video_tags"
          ADD CONSTRAINT "FK_video_tags_tag_id"
          FOREIGN KEY ("tag_id") REFERENCES "tags"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_tags" DROP CONSTRAINT IF EXISTS "FK_video_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_tags" DROP CONSTRAINT IF EXISTS "FK_video_tags_video_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_video_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_video_tags_video_id_tag_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "video_tags"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_videos_category_id_status_visibility"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "FK_videos_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP COLUMN IF EXISTS "category_id"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_tags_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."tags_status_enum"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_categories_status_display_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_parent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "display_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "parent_id"`,
    );
  }
}
