export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export interface ChannelSubscriptionProps {
  id: string;
  userId: string;
  channelId: string;
  membershipId: string;
  expiryDate: Date | null;
  retryCount: number;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelSubscriptionEntity {
  private props: ChannelSubscriptionProps;

  constructor(props: ChannelSubscriptionProps) {
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

  get status(): SubscriptionStatus {
    return this.props.status;
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
  }): ChannelSubscriptionEntity {
    return new ChannelSubscriptionEntity({
      id: crypto.randomUUID(),
      userId: input.userId,
      channelId: input.channelId,
      membershipId: input.membershipId,
      expiryDate: input.expiryDate,
      retryCount: 0,
      status: SubscriptionStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public cancel(): void {
    if (this.props.status === SubscriptionStatus.CANCELLED) {
      return;
    }
    this.props.status = SubscriptionStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public reactivate(): void {
    if (this.props.status === SubscriptionStatus.ACTIVE) {
      return;
    }
    this.props.status = SubscriptionStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public isActive(): boolean {
    return this.props.status === SubscriptionStatus.ACTIVE;
  }

  public syncMembership(input: {
    membershipId: string;
    expiryDate: Date | null;
  }): void {
    this.props.membershipId = input.membershipId;
    this.props.expiryDate = input.expiryDate;
    this.props.status = SubscriptionStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public isCurrentlyActive(): boolean {
    if (this.props.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    if (!this.props.expiryDate) {
      return true;
    }

    return this.props.expiryDate.getTime() > Date.now();
  }
}
