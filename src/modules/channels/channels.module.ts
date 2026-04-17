import { forwardRef, Module } from '@nestjs/common';
import { ChannelApplicationService } from './application/channel.application.service';
import { ChannelAccessService } from './application/channel-access.service';
import { ChannelController } from './presentation/controllers/channel.controller';
import { MembershipTierController } from './presentation/controllers/membership-tier.controller';
import { ChannelRepositoryImpl } from './infrastructure/persistence/channel.repository.impl';
import { ChannelOrmEntity } from './infrastructure/persistence/channel.orm-entity';
import { ChannelMembershipRepositoryImpl } from './infrastructure/persistence/channel-membership.repository.impl';
import { ChannelMembershipOrmEntity } from './infrastructure/persistence/channel-membership.orm-entity';
import { MembershipTierOrmEntity } from './infrastructure/persistence/membership-tier.orm-entity';
import { MembershipTierRepositoryImpl } from './infrastructure/persistence/membership-tier.repository.impl';
import { ChannelMembershipMapper } from './infrastructure/mappers/channel-membership.mapper';
import { MembershipPaymentConsumer } from './infrastructure/consumers/membership-payment.consumer';
import { ConfigModule } from '@shared/infrastructure/config/config.module';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosModule } from '../videos/videos.module';
import { CHANNEL_ACCESS_SERVICE } from './application/interfaces/channel-access.service.interface';
import { MEMBERSHIP_CONFIG } from '@shared/application/interfaces/membership-config.interface';
import { CHANNEL_REPOSITORY } from './domain/repositories/channel.repository';
import { CHANNEL_MEMBERSHIP_REPOSITORY } from './domain/repositories/channel-membership.repository';
import { MEMBERSHIP_TIER_REPOSITORY } from './domain/repositories/membership-tier.repository';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => VideosModule),
    TypeOrmModule.forFeature([
      ChannelOrmEntity,
      ChannelMembershipOrmEntity,
      MembershipTierOrmEntity,
    ]),
  ],
  controllers: [ChannelController, MembershipTierController],
  providers: [
    ChannelApplicationService,
    ChannelRepositoryImpl,
    ChannelMembershipRepositoryImpl,
    MembershipTierRepositoryImpl,
    ChannelAccessService,
    ChannelMembershipMapper,
    MembershipPaymentConsumer,
    {
      provide: CHANNEL_REPOSITORY,
      useExisting: ChannelRepositoryImpl,
    },
    {
      provide: CHANNEL_MEMBERSHIP_REPOSITORY,
      useExisting: ChannelMembershipRepositoryImpl,
    },
    {
      provide: MEMBERSHIP_TIER_REPOSITORY,
      useExisting: MembershipTierRepositoryImpl,
    },
    {
      provide: MEMBERSHIP_CONFIG,
      useExisting: ConfigService,
    },
    {
      provide: CHANNEL_ACCESS_SERVICE,
      useExisting: ChannelAccessService,
    },
  ],
  exports: [
    ChannelApplicationService,
    CHANNEL_ACCESS_SERVICE,
    CHANNEL_REPOSITORY,
    CHANNEL_MEMBERSHIP_REPOSITORY,
    MEMBERSHIP_TIER_REPOSITORY,
  ],
})
export class ChannelsModule {}
