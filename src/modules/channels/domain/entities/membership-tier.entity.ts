import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

export interface MembershipTierProps {
  id: string;
  channelId: string;
  name: string;
  level: number;
  priceCoin: number;
  isAcceptingNew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MembershipTierEntity {
  private props: MembershipTierProps;

  constructor(props: MembershipTierProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get channelId(): string {
    return this.props.channelId;
  }

  get name(): string {
    return this.props.name;
  }

  get level(): number {
    return this.props.level;
  }

  get priceCoin(): number {
    return this.props.priceCoin;
  }

  get isAcceptingNew(): boolean {
    return this.props.isAcceptingNew;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: {
    channelId: string;
    name: string;
    level: number;
    priceCoin: number;
  }): MembershipTierEntity {
    if (input.name.length > 50) {
      throw new BadRequestException(
        ERROR_MESSAGES.MEMBERSHIP_TIER_NAME_MAX_LENGTH,
      );
    }
    if (input.priceCoin < 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.MEMBERSHIP_TIER_PRICE_COIN_NEGATIVE,
      );
    }
    if (input.level < 1) {
      throw new BadRequestException(ERROR_MESSAGES.MEMBERSHIP_TIER_LEVEL_MIN);
    }

    return new MembershipTierEntity({
      id: crypto.randomUUID(),
      channelId: input.channelId,
      name: input.name,
      level: input.level,
      priceCoin: input.priceCoin,
      isAcceptingNew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public update(
    input: Partial<
      Pick<
        MembershipTierProps,
        'name' | 'level' | 'priceCoin' | 'isAcceptingNew'
      >
    >,
  ): void {
    if (input.name !== undefined) {
      if (input.name.length > 50) {
        throw new BadRequestException(
          ERROR_MESSAGES.MEMBERSHIP_TIER_NAME_MAX_LENGTH,
        );
      }
      this.props.name = input.name;
    }
    if (input.level !== undefined) {
      if (input.level < 1) {
        throw new BadRequestException(ERROR_MESSAGES.MEMBERSHIP_TIER_LEVEL_MIN);
      }
      this.props.level = input.level;
    }
    if (input.priceCoin !== undefined) {
      if (input.priceCoin < 0) {
        throw new BadRequestException(
          ERROR_MESSAGES.MEMBERSHIP_TIER_PRICE_COIN_NEGATIVE,
        );
      }
      this.props.priceCoin = input.priceCoin;
    }
    if (input.isAcceptingNew !== undefined) {
      this.props.isAcceptingNew = input.isAcceptingNew;
    }
    this.props.updatedAt = new Date();
  }

  public hide(): void {
    this.props.isAcceptingNew = false;
    this.props.updatedAt = new Date();
  }

  public show(): void {
    this.props.isAcceptingNew = true;
    this.props.updatedAt = new Date();
  }
}
