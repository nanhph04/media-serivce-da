import { forwardRef, Module } from '@nestjs/common';
import { ChannelApplicationService } from './application/channel.application.service';
import { ChannelAccessService } from './application/channel-access.service';
import { ChannelController } from './presentation/controllers/channel.controller';
import { MembershipTierController } from './presentation/controllers/membership-tier.controller';
import { ChannelRepositoryImpl } from './infrastructure/persistence/channel.repository.impl';
import { ChannelOrmEntity } from './infrastructure/persistence/channel.orm-entity';
import { ChannelSubscriptionRepositoryImpl } from './infrastructure/persistence/channel-subscription.repository.impl';
import { ChannelSubscriptionOrmEntity } from './infrastructure/persistence/channel-subscription.orm-entity';
import { MembershipTierOrmEntity } from './infrastructure/persistence/membership-tier.orm-entity';
import { MembershipTierRepositoryImpl } from './infrastructure/persistence/membership-tier.repository.impl';
import { ChannelSubscriptionMapper } from './infrastructure/mappers/channel-subscription.mapper';
import { MembershipPaymentConsumer } from './infrastructure/consumers/membership-payment.consumer';
import { ConfigModule } from '@shared/infrastructure/config/config.module';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosModule } from '../videos/videos.module';
import { CHANNEL_ACCESS_SERVICE } from './application/interfaces/channel-access.service.interface';
import { MEMBERSHIP_CONFIG } from '@shared/application/interfaces/membership-config.interface';
import { CHANNEL_REPOSITORY } from './domain/repositories/channel.repository';
import { CHANNEL_SUBSCRIPTION_REPOSITORY } from './domain/repositories/channel-subscription.repository';
import { MEMBERSHIP_TIER_REPOSITORY } from './domain/repositories/membership-tier.repository';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => VideosModule),
    TypeOrmModule.forFeature([
      ChannelOrmEntity,
      ChannelSubscriptionOrmEntity,
      MembershipTierOrmEntity,
    ]),
  ],
  controllers: [ChannelController, MembershipTierController],
  providers: [
    ChannelApplicationService,
    ChannelRepositoryImpl,
    ChannelSubscriptionRepositoryImpl,
    MembershipTierRepositoryImpl,
    ChannelAccessService,
    ChannelSubscriptionMapper,
    MembershipPaymentConsumer,
    {
      provide: CHANNEL_REPOSITORY,
      useExisting: ChannelRepositoryImpl,
    },
    {
      provide: CHANNEL_SUBSCRIPTION_REPOSITORY,
      useExisting: ChannelSubscriptionRepositoryImpl,
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
    CHANNEL_SUBSCRIPTION_REPOSITORY,
    MEMBERSHIP_TIER_REPOSITORY,
  ],
})
export class ChannelsModule {}
