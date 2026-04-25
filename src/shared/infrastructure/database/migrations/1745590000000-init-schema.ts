import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1745590000000 implements MigrationInterface {
  public readonly name = 'InitSchema1745590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'channels_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."channels_status_enum" AS ENUM('active', 'inactive', 'suspended');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'channel_memberships_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."channel_memberships_status_enum" AS ENUM('active', 'cancelled');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'categories_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."categories_status_enum" AS ENUM('active', 'inactive', 'deleted');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'videos_visibility_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."videos_visibility_enum" AS ENUM('public', 'private');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'videos_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."videos_status_enum" AS ENUM('draft', 'processing', 'public', 'failed');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "channels" (
        "id" character varying(36) NOT NULL,
        "user_id" character varying(36) NOT NULL,
        "name" character varying(100) NOT NULL,
        "bio" text NOT NULL,
        "avatar_url" character varying(500) NOT NULL,
        "banner_url" character varying(500) NOT NULL,
        "status" "public"."channels_status_enum" NOT NULL,
        "is_eligible_for_membership" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_afe0e38e3f9aea7ca0d5af4c938" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_channels_user_id" ON "channels" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "membership_tiers" (
        "id" character varying(36) NOT NULL,
        "channel_id" character varying(36) NOT NULL,
        "name" character varying(100) NOT NULL,
        "level" integer NOT NULL,
        "price_coin" integer NOT NULL,
        "is_accepting_new" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4f2186c243980f6cbcb7ca778f9" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "channel_memberships" (
        "id" character varying(36) NOT NULL,
        "user_id" character varying(36) NOT NULL,
        "channel_id" character varying(36) NOT NULL,
        "membership_id" character varying(36) NOT NULL,
        "expiry_date" TIMESTAMP,
        "retry_count" integer NOT NULL DEFAULT 0,
        "status" "public"."channel_memberships_status_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_e91bce99b2f6b4f34f36e35e99c" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_channel_memberships_user_id_channel_id" ON "channel_memberships" ("user_id", "channel_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" character varying(36) NOT NULL,
        "name" character varying(100) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "description" text,
        "status" "public"."categories_status_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_slug" ON "categories" ("slug")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "videos" (
        "id" character varying(36) NOT NULL,
        "channel_id" character varying(36) NOT NULL,
        "owner_id" character varying(36) NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "visibility" "public"."videos_visibility_enum" NOT NULL DEFAULT 'public',
        "status" "public"."videos_status_enum" NOT NULL DEFAULT 'draft',
        "price" integer NOT NULL DEFAULT 0,
        "required_tier_level" integer,
        "raw_file_key" character varying(500) NOT NULL,
        "master_playlist_key" character varying(500),
        "thumbnail_url" character varying(500),
        "duration_seconds" integer,
        "resolutions" text NOT NULL DEFAULT '',
        "error_message" text,
        "view_count" integer NOT NULL DEFAULT 0,
        "published_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_e4f1cf304c70d41fd448e7f84d7" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_videos_channel_id_status" ON "videos" ("channel_id", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_purchase_unlocks" (
        "id" character varying(36) NOT NULL,
        "video_id" character varying(36) NOT NULL,
        "user_id" character varying(36) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_60fda8d4f93f5972b19d37c7781" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_video_purchase_unlocks_video_id_user_id" ON "video_purchase_unlocks" ("video_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_categories" (
        "video_id" character varying(36) NOT NULL,
        "category_id" character varying(36) NOT NULL,
        CONSTRAINT "PK_b0f948a2738cd6391f1ce8d2960" PRIMARY KEY ("video_id", "category_id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_video_categories_video_id_category_id" ON "video_categories" ("video_id", "category_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_video_categories_video_id'
        ) THEN
          ALTER TABLE "video_categories"
          ADD CONSTRAINT "FK_video_categories_video_id"
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
          WHERE conname = 'FK_video_categories_category_id'
        ) THEN
          ALTER TABLE "video_categories"
          ADD CONSTRAINT "FK_video_categories_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "video_categories" DROP CONSTRAINT "FK_video_categories_category_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "video_categories" DROP CONSTRAINT "FK_video_categories_video_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_video_categories_video_id_category_id"
    `);
    await queryRunner.query(`
      DROP TABLE "video_categories"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_video_purchase_unlocks_video_id_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE "video_purchase_unlocks"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_videos_channel_id_status"
    `);
    await queryRunner.query(`
      DROP TABLE "videos"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_categories_slug"
    `);
    await queryRunner.query(`
      DROP TABLE "categories"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_channel_memberships_user_id_channel_id"
    `);
    await queryRunner.query(`
      DROP TABLE "channel_memberships"
    `);

    await queryRunner.query(`
      DROP TABLE "membership_tiers"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_channels_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE "channels"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."videos_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."videos_visibility_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."categories_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."channel_memberships_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."channels_status_enum"
    `);
  }
}
