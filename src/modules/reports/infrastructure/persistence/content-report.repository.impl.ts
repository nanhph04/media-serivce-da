import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsWhere } from 'typeorm';
import {
  ContentReportEntity,
  ContentReportStatus,
  ContentReportTargetType,
} from '../../domain/entities/content-report.entity';
import type {
  ContentReportPage,
  ContentReportPageFilters,
  ContentReportSummary,
  IContentReportRepository,
} from '../../domain/repositories/content-report.repository';
import { ContentReportOrmEntity } from './content-report.orm-entity';

@Injectable()
export class ContentReportRepositoryImpl implements IContentReportRepository {
  constructor(
    @InjectRepository(ContentReportOrmEntity)
    private readonly ormRepository: Repository<ContentReportOrmEntity>,
  ) {}

  async save(report: ContentReportEntity): Promise<void> {
    await this.ormRepository.save({
      id: report.id,
      targetType: report.targetType,
      reporterUserId: report.reporterUserId,
      targetVideoId: report.targetVideoId,
      targetChannelId: report.targetChannelId,
      reason: report.reason,
      evidenceTimestampSeconds: report.evidenceTimestampSeconds,
      contextVideoId: report.contextVideoId,
      contextVideoTitle: report.contextVideoTitle,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });
  }

  async findById(id: string): Promise<ContentReportEntity | null> {
    const row = await this.ormRepository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findPendingByReporterAndTarget(input: {
    reporterUserId: string;
    targetType: ContentReportTargetType;
    targetVideoId?: string | null;
    targetChannelId: string;
  }): Promise<ContentReportEntity | null> {
    const where: FindOptionsWhere<ContentReportOrmEntity> = {
      reporterUserId: input.reporterUserId,
      targetType: input.targetType,
      targetChannelId: input.targetChannelId,
      status: ContentReportStatus.PENDING,
    };

    if (input.targetType === ContentReportTargetType.VIDEO) {
      if (!input.targetVideoId) {
        return null;
      }

      where.targetVideoId = input.targetVideoId;
    }

    const row = await this.ormRepository.findOne({
      where,
      order: { createdAt: 'ASC' },
    });

    return row ? this.toDomain(row) : null;
  }

  async findPage(
    filters: ContentReportPageFilters,
  ): Promise<ContentReportPage> {
    const where: FindOptionsWhere<ContentReportOrmEntity> = {};
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    const [rows, total] = await this.ormRepository.findAndCount({
      where,
      order: { createdAt: 'ASC' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async getSummary(): Promise<ContentReportSummary> {
    const row = await this.ormRepository
      .createQueryBuilder('report')
      .select(
        `COUNT(*) FILTER (
          WHERE report.status = :pendingStatus
        )`,
        'pendingUserReports',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE report.status = :pendingStatus
          AND report.target_type = :videoTarget
        )`,
        'pendingVideoReports',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE report.status = :pendingStatus
          AND report.target_type = :channelTarget
        )`,
        'pendingChannelReports',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE report.status = :resolvedStatus
        )`,
        'resolvedUserReports',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE report.status = :dismissedStatus
        )`,
        'dismissedUserReports',
      )
      .setParameters({
        pendingStatus: ContentReportStatus.PENDING,
        resolvedStatus: ContentReportStatus.RESOLVED,
        dismissedStatus: ContentReportStatus.DISMISSED,
        videoTarget: ContentReportTargetType.VIDEO,
        channelTarget: ContentReportTargetType.CHANNEL,
      })
      .getRawOne<{
        pendingUserReports?: string | number | null;
        pendingVideoReports?: string | number | null;
        pendingChannelReports?: string | number | null;
        resolvedUserReports?: string | number | null;
        dismissedUserReports?: string | number | null;
      }>();

    return {
      pendingUserReports: Number(row?.pendingUserReports ?? 0),
      pendingVideoReports: Number(row?.pendingVideoReports ?? 0),
      pendingChannelReports: Number(row?.pendingChannelReports ?? 0),
      resolvedUserReports: Number(row?.resolvedUserReports ?? 0),
      dismissedUserReports: Number(row?.dismissedUserReports ?? 0),
    };
  }

  private toDomain(row: ContentReportOrmEntity): ContentReportEntity {
    return new ContentReportEntity({
      id: row.id,
      targetType: row.targetType,
      reporterUserId: row.reporterUserId,
      targetVideoId: row.targetVideoId,
      targetChannelId: row.targetChannelId,
      reason: row.reason,
      evidenceTimestampSeconds: row.evidenceTimestampSeconds,
      contextVideoId: row.contextVideoId,
      contextVideoTitle: row.contextVideoTitle,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
