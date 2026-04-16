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
        'Membership tier name must be less than 50 characters',
      );
    }
    if (input.priceCoin < 0) {
      throw new BadRequestException('Price coin cannot be negative');
    }
    if (input.level < 1) {
      throw new BadRequestException('Level must be greater than or equal to 1');
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
          'Membership tier name must be less than 50 characters',
        );
      }
      this.props.name = input.name;
    }
    if (input.level !== undefined) {
      if (input.level < 1) {
        throw new BadRequestException(
          'Level must be greater than or equal to 1',
        );
      }
      this.props.level = input.level;
    }
    if (input.priceCoin !== undefined) {
      if (input.priceCoin < 0) {
        throw new BadRequestException('Price coin cannot be negative');
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
