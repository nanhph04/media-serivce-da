import { forwardRef, Module } from '@nestjs/common';
import { CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG } from '@shared/application/interfaces/channel-membership-eligibility-config.interface';
import { ChannelAccessService } from './application/channel-access.service';
import { CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE } from './application/interfaces/channel-membership-eligibility.service.interface';
import { ChannelMembershipEligibilityService } from './application/services/channel-membership-eligibility.service';
import { CreateChannelUseCase } from './application/use-cases/create-channel.use-case';
import { GetCurrentChannelUseCase } from './application/use-cases/get-current-channel.use-case';
import { UpdateChannelUseCase } from './application/use-cases/update-channel.use-case';
import { UploadChannelImageUseCase } from './application/use-cases/upload-channel-image.use-case';
import { GetChannelDetailUseCase } from './application/use-cases/get-channel-detail.use-case';
import { GetMembershipStatusUseCase } from './application/use-cases/get-membership-status.use-case';
import { GetMyMembershipsUseCase } from './application/use-cases/get-my-memberships.use-case';
import { CreateMembershipTierUseCase } from './application/use-cases/create-membership-tier.use-case';
import { AdminLockChannelUseCase } from './application/use-cases/admin-lock-channel.use-case';
import { GetMembershipTiersUseCase } from './application/use-cases/get-membership-tiers.use-case';
import { GetMembershipTierUseCase } from './application/use-cases/get-membership-tier.use-case';
import { UpdateMembershipTierUseCase } from './application/use-cases/update-membership-tier.use-case';
import { DisableMembershipTierUseCase } from './application/use-cases/disable-membership-tier.use-case';
import { HandleMembershipPaymentSuccessUseCase } from './application/use-cases/handle-membership-payment-success.use-case';
import { HandleMembershipAutoRenewFailedUseCase } from './application/use-cases/handle-membership-auto-renew-failed.use-case';
import { ModerateChannelMembershipUseCase } from './application/use-cases/moderate-channel-membership.use-case';
import { RequestDueMembershipRenewalsUseCase } from './application/use-cases/request-due-membership-renewals.use-case';
import { SendDueMembershipRenewalRemindersUseCase } from './application/use-cases/send-due-membership-renewal-reminders.use-case';
import { UpdateMembershipAutoRenewUseCase } from './application/use-cases/update-membership-auto-renew.use-case';
import { HandleUserStatusChangedUseCase } from './application/use-cases/handle-user-status-changed.use-case';
import { ListAdminChannelsUseCase } from './application/use-cases/list-admin-channels.use-case';
import { ListMembershipReviewsUseCase } from './application/use-cases/list-membership-reviews.use-case';
import { ReviewChannelMembershipUseCase } from './application/use-cases/review-channel-membership.use-case';
import { RequestChannelMembershipReviewUseCase } from './application/use-cases/request-channel-membership-review.use-case';
import { PurchaseMembershipUseCase } from './application/use-cases/purchase-membership.use-case';
import { GetAdminChannelSummaryUseCase } from './application/use-cases/get-admin-channel-summary.use-case';
import { ChannelController } from './presentation/controllers/channel.controller';
import { AdminChannelController } from './presentation/controllers/admin-channel.controller';
import { MembershipController } from './presentation/controllers/membership.controller';
import { MembershipPurchaseController } from './presentation/controllers/membership-purchase.controller';
import { MembershipTierController } from './presentation/controllers/membership-tier.controller';
import { CHANNEL_SEARCH_QUERY_SERVICE } from './application/interfaces/channel-search-query.service.interface';
import { ChannelRepositoryImpl } from './infrastructure/persistence/channel.repository.impl';
import { ChannelOrmEntity } from './infrastructure/persistence/channel.orm-entity';
import { ChannelMembershipRepositoryImpl } from './infrastructure/persistence/channel-membership.repository.impl';
import { ChannelMembershipOrmEntity } from './infrastructure/persistence/channel-membership.orm-entity';
import { MembershipTierOrmEntity } from './infrastructure/persistence/membership-tier.orm-entity';
import { MembershipTierRepositoryImpl } from './infrastructure/persistence/membership-tier.repository.impl';
import { ChannelMembershipMapper } from './infrastructure/mappers/channel-membership.mapper';
import { MembershipPaymentConsumer } from './infrastructure/consumers/membership-payment.consumer';
import { MembershipAutoRenewFailedConsumer } from './infrastructure/consumers/membership-auto-renew-failed.consumer';
import { UserStatusChangedConsumer } from './infrastructure/consumers/user-status-changed.consumer';
import { MembershipAutoRenewPublisher } from './infrastructure/messaging/membership-auto-renew.publisher';
import { ChannelStatusEventPublisher } from './infrastructure/messaging/channel-status-event.publisher';
import { MembershipCoinCompensationPublisher } from './infrastructure/messaging/membership-coin-compensation.publisher';
import { MembershipAutoRenewScheduler } from './infrastructure/services/membership-auto-renew.scheduler';
import { ChannelCreationTransactionService } from './infrastructure/persistence/channel-creation-transaction.service';
import { ChannelStatusChangeTransactionService } from './infrastructure/persistence/channel-status-change-transaction.service';
import { ChannelSearchQueryService } from './infrastructure/query/channel-search-query.service';
import { UserMembershipQueryService } from './infrastructure/query/user-membership-query.service';
import { ConfigModule } from '@shared/infrastructure/config/config.module';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { OutboxMessageOrmEntity } from '@shared/infrastructure/messaging/outbox-message.orm-entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosModule } from '../videos/videos.module';
import { CHANNEL_ACCESS_SERVICE } from './application/interfaces/channel-access.service.interface';
import { MEMBERSHIP_CONFIG } from '@shared/application/interfaces/membership-config.interface';
import { CHANNEL_REPOSITORY } from './domain/repositories/channel.repository';
import { CHANNEL_MEMBERSHIP_REPOSITORY } from './domain/repositories/channel-membership.repository';
import { MEMBERSHIP_TIER_REPOSITORY } from './domain/repositories/membership-tier.repository';
import { MEMBERSHIP_COIN_COMPENSATION_PUBLISHER } from './application/interfaces/membership-coin-compensation.publisher.interface';
import { MEMBERSHIP_AUTO_RENEW_PUBLISHER } from './application/interfaces/membership-auto-renew.publisher.interface';
import { USER_MEMBERSHIP_QUERY_SERVICE } from './application/interfaces/user-membership-query.service.interface';
import { CHANNEL_CREATION_TRANSACTION } from './application/interfaces/channel-creation-transaction.interface';
import { CHANNEL_STATUS_EVENT_PUBLISHER } from './application/interfaces/channel-status-event.publisher.interface';
import { CHANNEL_STATUS_CHANGE_TRANSACTION } from './application/interfaces/channel-status-change-transaction.interface';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => VideosModule),
    TypeOrmModule.forFeature([
      ChannelOrmEntity,
      ChannelMembershipOrmEntity,
      MembershipTierOrmEntity,
      OutboxMessageOrmEntity,
    ]),
  ],
  controllers: [
    AdminChannelController,
    ChannelController,
    MembershipController,
    MembershipPurchaseController,
    MembershipTierController,
  ],
  providers: [
    ChannelRepositoryImpl,
    ChannelMembershipRepositoryImpl,
    MembershipTierRepositoryImpl,
    ChannelSearchQueryService,
    UserMembershipQueryService,
    ChannelAccessService,
    ChannelMembershipEligibilityService,
    ChannelMembershipMapper,
    ChannelCreationTransactionService,
    ChannelStatusChangeTransactionService,
    CreateChannelUseCase,
    GetCurrentChannelUseCase,
    UpdateChannelUseCase,
    UploadChannelImageUseCase,
    GetChannelDetailUseCase,
    GetMembershipStatusUseCase,
    GetMyMembershipsUseCase,
    CreateMembershipTierUseCase,
    AdminLockChannelUseCase,
    GetMembershipTiersUseCase,
    GetMembershipTierUseCase,
    UpdateMembershipTierUseCase,
    DisableMembershipTierUseCase,
    HandleMembershipPaymentSuccessUseCase,
    HandleMembershipAutoRenewFailedUseCase,
    ModerateChannelMembershipUseCase,
    RequestDueMembershipRenewalsUseCase,
    SendDueMembershipRenewalRemindersUseCase,
    UpdateMembershipAutoRenewUseCase,
    HandleUserStatusChangedUseCase,
    ListAdminChannelsUseCase,
    ListMembershipReviewsUseCase,
    ReviewChannelMembershipUseCase,
    RequestChannelMembershipReviewUseCase,
    PurchaseMembershipUseCase,
    GetAdminChannelSummaryUseCase,
    MembershipPaymentConsumer,
    MembershipAutoRenewFailedConsumer,
    UserStatusChangedConsumer,
    MembershipAutoRenewPublisher,
    ChannelStatusEventPublisher,
    MembershipCoinCompensationPublisher,
    MembershipAutoRenewScheduler,
    {
      provide: CHANNEL_REPOSITORY,
      useExisting: ChannelRepositoryImpl,
    },
    {
      provide: CHANNEL_CREATION_TRANSACTION,
      useExisting: ChannelCreationTransactionService,
    },
    {
      provide: CHANNEL_STATUS_CHANGE_TRANSACTION,
      useExisting: ChannelStatusChangeTransactionService,
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
      provide: CHANNEL_SEARCH_QUERY_SERVICE,
      useExisting: ChannelSearchQueryService,
    },
    {
      provide: USER_MEMBERSHIP_QUERY_SERVICE,
      useExisting: UserMembershipQueryService,
    },
    {
      provide: CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
      useExisting: ChannelMembershipEligibilityService,
    },
    {
      provide: MEMBERSHIP_COIN_COMPENSATION_PUBLISHER,
      useExisting: MembershipCoinCompensationPublisher,
    },
    {
      provide: MEMBERSHIP_AUTO_RENEW_PUBLISHER,
      useExisting: MembershipAutoRenewPublisher,
    },
    {
      provide: CHANNEL_STATUS_EVENT_PUBLISHER,
      useExisting: ChannelStatusEventPublisher,
    },
  ],
  exports: [
    CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
    CHANNEL_ACCESS_SERVICE,
    CHANNEL_SEARCH_QUERY_SERVICE,
    CHANNEL_REPOSITORY,
    CHANNEL_MEMBERSHIP_REPOSITORY,
    MEMBERSHIP_TIER_REPOSITORY,
  ],
})
export class ChannelsModule {}
