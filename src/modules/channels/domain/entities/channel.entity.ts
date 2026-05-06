import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

export enum ChannelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface ChannelProps {
  id: string;
  userId: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  status: ChannelStatus;
  isEligibleForMembership: boolean;
  isMembershipClosedByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelEntity {
  private props: ChannelProps;

  constructor(props: ChannelProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get bio(): string {
    return this.props.bio;
  }

  get avatarUrl(): string {
    return this.props.avatarUrl;
  }

  get bannerUrl(): string {
    return this.props.bannerUrl;
  }

  get status(): ChannelStatus {
    return this.props.status;
  }

  get isEligibleForMembership(): boolean {
    return this.props.isEligibleForMembership;
  }

  get isMembershipClosedByAdmin(): boolean {
    return this.props.isMembershipClosedByAdmin;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: {
    userId: string;
    name: string;
    bio: string;
  }): ChannelEntity {
    if (input.name.length > 100) {
      throw new BadRequestException(
        'Channel name must be less than 100 characters',
      );
    }
    if (input.bio.length > 1000) {
      throw new BadRequestException(
        'Channel bio must be less than 1000 characters',
      );
    }

    return new ChannelEntity({
      id: crypto.randomUUID(),
      userId: input.userId,
      name: input.name,
      bio: input.bio,
      avatarUrl: '',
      bannerUrl: '',
      status: ChannelStatus.ACTIVE,
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public update(
    input: Partial<
      Pick<ChannelProps, 'name' | 'bio' | 'avatarUrl' | 'bannerUrl' | 'status'>
    >,
  ): void {
    if (input.name !== undefined) {
      if (input.name.length > 100) {
        throw new BadRequestException(
          'Channel name must be less than 100 characters',
        );
      }
      this.props.name = input.name;
    }
    if (input.bio !== undefined) {
      if (input.bio.length > 1000) {
        throw new BadRequestException(
          'Channel bio must be less than 1000 characters',
        );
      }
      this.props.bio = input.bio;
    }
    if (input.avatarUrl !== undefined) {
      this.props.avatarUrl = input.avatarUrl;
    }
    if (input.bannerUrl !== undefined) {
      this.props.bannerUrl = input.bannerUrl;
    }
    if (input.status !== undefined) {
      this.props.status = input.status;
    }
    this.props.updatedAt = new Date();
  }

  public delete(): void {
    this.props.status = ChannelStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  public restore(): void {
    this.props.status = ChannelStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public suspend(): void {
    this.props.status = ChannelStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  public closeMembershipByAdmin(): void {
    if (this.props.isMembershipClosedByAdmin) {
      return;
    }

    this.props.isMembershipClosedByAdmin = true;
    this.props.updatedAt = new Date();
  }

  public openMembershipByAdmin(): void {
    if (!this.props.isMembershipClosedByAdmin) {
      return;
    }

    this.props.isMembershipClosedByAdmin = false;
    this.props.updatedAt = new Date();
  }

  public syncMembershipEligibility(isEligibleForMembership: boolean): void {
    if (!isEligibleForMembership || this.props.isEligibleForMembership) {
      return;
    }

    this.props.isEligibleForMembership = true;
    this.props.updatedAt = new Date();
  }
}
