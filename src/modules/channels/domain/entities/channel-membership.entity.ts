export enum ChannelMembershipStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export interface ChannelMembershipProps {
  id: string;
  userId: string;
  channelId: string;
  membershipId: string;
  expiryDate: Date | null;
  retryCount: number;
  status: ChannelMembershipStatus;
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public cancel(): void {
    if (this.props.status === ChannelMembershipStatus.CANCELLED) {
      return;
    }
    this.props.status = ChannelMembershipStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public reactivate(): void {
    if (this.props.status === ChannelMembershipStatus.ACTIVE) {
      return;
    }
    this.props.status = ChannelMembershipStatus.ACTIVE;
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
