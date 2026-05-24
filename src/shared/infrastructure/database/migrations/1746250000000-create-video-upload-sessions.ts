import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVideoUploadSessions1746250000000 implements MigrationInterface {
  name = 'CreateVideoUploadSessions1746250000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "video_upload_sessions" (
        "id" varchar(36) NOT NULL,
        "video_id" varchar(36) NOT NULL,
        "user_id" varchar(36) NOT NULL,
        "raw_file_key" varchar(500) NOT NULL,
        "upload_id" varchar(512) NOT NULL,
        "part_size_bytes" integer NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "file_size" bigint NOT NULL,
        "file_last_modified" timestamp NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'active',
        "expires_at" timestamp NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_upload_sessions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_video_upload_sessions_video_upload"
      ON "video_upload_sessions" ("video_id", "upload_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_video_upload_sessions_status_expires"
      ON "video_upload_sessions" ("status", "expires_at")
    `);
    await queryRunner.query(`
      CREATE TABLE "video_upload_parts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" varchar(36) NOT NULL,
        "part_number" integer NOT NULL,
        "etag" varchar(255) NOT NULL,
        "size_bytes" bigint NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_upload_parts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_video_upload_parts_session"
          FOREIGN KEY ("session_id")
          REFERENCES "video_upload_sessions"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_video_upload_parts_session_part"
      ON "video_upload_parts" ("session_id", "part_number")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_video_upload_parts_session_part"');
    await queryRunner.query('DROP TABLE "video_upload_parts"');
    await queryRunner.query(
      'DROP INDEX "IDX_video_upload_sessions_status_expires"',
    );
    await queryRunner.query(
      'DROP INDEX "IDX_video_upload_sessions_video_upload"',
    );
    await queryRunner.query('DROP TABLE "video_upload_sessions"');
  }
}
