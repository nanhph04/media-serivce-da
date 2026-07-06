import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixVideoProcessingDispatchJobIds1746330000000
  implements MigrationInterface
{
  name = 'FixVideoProcessingDispatchJobIds1746330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "video_processing_dispatches" AS dispatch
      SET
        "job_id" = replace(dispatch."job_id", ':', '-'),
        "last_error" = NULL,
        "next_attempt_at" = NOW(),
        "updated_at" = NOW()
      WHERE dispatch."job_id" LIKE 'transcode:%'
        AND NOT EXISTS (
          SELECT 1
          FROM "video_processing_dispatches" AS existing
          WHERE existing."job_id" = replace(dispatch."job_id", ':', '-')
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "video_processing_dispatches" AS dispatch
      SET
        "job_id" = replace(dispatch."job_id", 'transcode-', 'transcode:'),
        "updated_at" = NOW()
      WHERE dispatch."job_id" LIKE 'transcode-%'
        AND NOT EXISTS (
          SELECT 1
          FROM "video_processing_dispatches" AS existing
          WHERE existing."job_id" = replace(dispatch."job_id", 'transcode-', 'transcode:')
        )
    `);
  }
}
