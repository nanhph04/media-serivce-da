import { forwardRef, Module } from '@nestjs/common';
import { CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG } from '@shared/application/interfaces/channel-membership-eligibility-config.interface';
import { ChannelAccessService } from './application/channel-access.service';
import { CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE } from './application/interfaces/channel-membership-eligibility.service.interface';
import { ChannelMembershipEligibilityService } from './application/services/channel-membership-eligibility.service';
import { CreateChannelUseCase } from './application/use-cases/create-channel.use-case';
import { UpdateChannelUseCase } from './application/use-cases/update-channel.use-case';
import { GetChannelDetailUseCase } from './application/use-cases/get-channel-detail.use-case';
import { GetMembershipStatusUseCase } from './application/use-cases/get-membership-status.use-case';
import { CreateMembershipTierUseCase } from './application/use-cases/create-membership-tier.use-case';
import { GetMembershipTiersUseCase } from './application/use-cases/get-membership-tiers.use-case';
import { GetMembershipTierUseCase } from './application/use-cases/get-membership-tier.use-case';
import { UpdateMembershipTierUseCase } from './application/use-cases/update-membership-tier.use-case';
import { DisableMembershipTierUseCase } from './application/use-cases/disable-membership-tier.use-case';
import { HandleMembershipPaymentSuccessUseCase } from './application/use-cases/handle-membership-payment-success.use-case';
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
    ChannelRepositoryImpl,
    ChannelMembershipRepositoryImpl,
    MembershipTierRepositoryImpl,
    ChannelAccessService,
    ChannelMembershipEligibilityService,
    ChannelMembershipMapper,
    CreateChannelUseCase,
    UpdateChannelUseCase,
    GetChannelDetailUseCase,
    GetMembershipStatusUseCase,
    CreateMembershipTierUseCase,
    GetMembershipTiersUseCase,
    GetMembershipTierUseCase,
    UpdateMembershipTierUseCase,
    DisableMembershipTierUseCase,
    HandleMembershipPaymentSuccessUseCase,
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
      provide: CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG,
      useExisting: ConfigService,
    },
    {
      provide: CHANNEL_ACCESS_SERVICE,
      useExisting: ChannelAccessService,
    },
    {
      provide: CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
      useExisting: ChannelMembershipEligibilityService,
    },
  ],
  exports: [
    CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
    CHANNEL_ACCESS_SERVICE,
    CHANNEL_REPOSITORY,
    CHANNEL_MEMBERSHIP_REPOSITORY,
    MEMBERSHIP_TIER_REPOSITORY,
  ],
})
export class ChannelsModule {}
