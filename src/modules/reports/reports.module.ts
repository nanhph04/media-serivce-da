import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from '../channels/channels.module';
import { VideosModule } from '../videos/videos.module';
import { GetAdminReportsSummaryUseCase } from './application/use-cases/get-admin-reports-summary.use-case';
import { ListAdminReportsUseCase } from './application/use-cases/list-admin-reports.use-case';
import { ReportChannelUseCase } from './application/use-cases/report-channel.use-case';
import { ReportVideoUseCase } from './application/use-cases/report-video.use-case';
import { UpdateAdminReportStatusUseCase } from './application/use-cases/update-admin-report-status.use-case';
import { CONTENT_REPORT_REPOSITORY } from './domain/repositories/content-report.repository';
import { ContentReportOrmEntity } from './infrastructure/persistence/content-report.orm-entity';
import { ContentReportRepositoryImpl } from './infrastructure/persistence/content-report.repository.impl';
import { AdminReportController } from './presentation/controllers/admin-report.controller';
import { ContentReportController } from './presentation/controllers/content-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentReportOrmEntity]),
    forwardRef(() => ChannelsModule),
    forwardRef(() => VideosModule),
  ],
  controllers: [AdminReportController, ContentReportController],
  providers: [
    ContentReportRepositoryImpl,
    ReportVideoUseCase,
    ReportChannelUseCase,
    GetAdminReportsSummaryUseCase,
    ListAdminReportsUseCase,
    UpdateAdminReportStatusUseCase,
    {
      provide: CONTENT_REPORT_REPOSITORY,
      useExisting: ContentReportRepositoryImpl,
    },
  ],
})
export class ReportsModule {}
