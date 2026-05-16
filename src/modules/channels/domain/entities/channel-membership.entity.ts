export enum ChannelMembershipStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export enum ChannelMembershipRenewalStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  RETRYING = 'retrying',
  DISABLED = 'disabled',
}

export interface ChannelMembershipProps {
  id: string;
  userId: string;
  channelId: string;
  membershipId: string;
  expiryDate: Date | null;
  retryCount: number;
  status: ChannelMembershipStatus;
  autoRenewEnabled: boolean;
  renewalStatus: ChannelMembershipRenewalStatus;
  renewalReminderSentAt: Date | null;
  lastRenewalAttemptAt: Date | null;
  nextRenewalAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelMembershipEntity {
  private props: ChannelMembershipProps;

  constructor(props: ChannelMembershipProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get channelId(): string {
    return this.props.channelId;
  }

  get membershipId(): string {
    return this.props.membershipId;
  }

  get expiryDate(): Date | null {
    return this.props.expiryDate;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get status(): ChannelMembershipStatus {
    return this.props.status;
  }

  get autoRenewEnabled(): boolean {
    return this.props.autoRenewEnabled;
  }

  get renewalStatus(): ChannelMembershipRenewalStatus {
    return this.props.renewalStatus;
  }

  get renewalReminderSentAt(): Date | null {
    return this.props.renewalReminderSentAt;
  }

  get lastRenewalAttemptAt(): Date | null {
    return this.props.lastRenewalAttemptAt;
  }

  get nextRenewalAttemptAt(): Date | null {
    return this.props.nextRenewalAttemptAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: {
    userId: string;
    channelId: string;
    membershipId: string;
    expiryDate: Date | null;
  }): ChannelMembershipEntity {
    return new ChannelMembershipEntity({
      id: crypto.randomUUID(),
      userId: input.userId,
      channelId: input.channelId,
      membershipId: input.membershipId,
      expiryDate: input.expiryDate,
      retryCount: 0,
      status: ChannelMembershipStatus.ACTIVE,
      autoRenewEnabled: true,
      renewalStatus: ChannelMembershipRenewalStatus.IDLE,
      renewalReminderSentAt: null,
      lastRenewalAttemptAt: null,
      nextRenewalAttemptAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public cancel(): void {
    if (this.props.status === ChannelMembershipStatus.CANCELLED) {
      return;
    }
    this.props.status = ChannelMembershipStatus.CANCELLED;
    this.props.autoRenewEnabled = false;
    this.props.renewalStatus = ChannelMembershipRenewalStatus.DISABLED;
    this.props.nextRenewalAttemptAt = null;
    this.props.updatedAt = new Date();
  }

  public reactivate(): void {
    if (this.props.status === ChannelMembershipStatus.ACTIVE) {
      return;
    }
    this.props.status = ChannelMembershipStatus.ACTIVE;
    this.props.autoRenewEnabled = true;
    this.props.renewalStatus = ChannelMembershipRenewalStatus.IDLE;
    this.props.updatedAt = new Date();
  }

  public isActive(): boolean {
    return this.props.status === ChannelMembershipStatus.ACTIVE;
  }

  public syncMembership(input: {
    membershipId: string;
    expiryDate: Date | null;
  }): void {
    this.props.membershipId = input.membershipId;
    this.props.expiryDate = input.expiryDate;
    this.props.status = ChannelMembershipStatus.ACTIVE;
    this.props.autoRenewEnabled = true;
    this.props.retryCount = 0;
    this.props.renewalStatus = ChannelMembershipRenewalStatus.IDLE;
    this.props.renewalReminderSentAt = null;
    this.props.lastRenewalAttemptAt = null;
    this.props.nextRenewalAttemptAt = null;
    this.props.updatedAt = new Date();
  }

  public setAutoRenewEnabled(enabled: boolean): void {
    this.props.autoRenewEnabled = enabled;
    this.props.renewalStatus = enabled
      ? ChannelMembershipRenewalStatus.IDLE
      : ChannelMembershipRenewalStatus.DISABLED;
    this.props.nextRenewalAttemptAt = null;
    this.props.updatedAt = new Date();
  }

  public markRenewalReminderSent(sentAt: Date): void {
    this.props.renewalReminderSentAt = sentAt;
    this.props.updatedAt = new Date();
  }

  public markRenewalRequested(requestedAt: Date): void {
    this.props.renewalStatus = ChannelMembershipRenewalStatus.PENDING;
    this.props.lastRenewalAttemptAt = requestedAt;
    this.props.nextRenewalAttemptAt = null;
    this.props.updatedAt = new Date();
  }

  public markRenewalFailed(input: {
    attemptedAt: Date;
    maxRetryCount: number;
    retryDelayHours: number;
  }): void {
    this.props.retryCount += 1;
    this.props.lastRenewalAttemptAt = input.attemptedAt;

    if (this.props.retryCount >= input.maxRetryCount) {
      this.props.autoRenewEnabled = false;
      this.props.renewalStatus = ChannelMembershipRenewalStatus.DISABLED;
      this.props.nextRenewalAttemptAt = null;
      this.props.updatedAt = new Date();
      return;
    }

    this.props.renewalStatus = ChannelMembershipRenewalStatus.RETRYING;
    this.props.nextRenewalAttemptAt = new Date(
      input.attemptedAt.getTime() + input.retryDelayHours * 60 * 60 * 1000,
    );
    this.props.updatedAt = new Date();
  }

  public isCurrentlyActive(): boolean {
    if (this.props.status !== ChannelMembershipStatus.ACTIVE) {
      return false;
    }

    if (!this.props.expiryDate) {
      return true;
    }

    return this.props.expiryDate.getTime() > Date.now();
  }
}
