import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { MembershipTierOrmEntity } from './membership-tier.orm-entity';

@Injectable()
export class MembershipTierRepositoryImpl implements IMembershipTierRepository {
  constructor(
    @InjectRepository(MembershipTierOrmEntity)
    private readonly ormRepository: Repository<MembershipTierOrmEntity>,
  ) {}

  async create(tier: MembershipTierEntity): Promise<void> {
    const ormEntity = {
      id: tier.id,
      channelId: tier.channelId,
      name: tier.name,
      level: tier.level,
      priceCoin: tier.priceCoin,
      isAcceptingNew: tier.isAcceptingNew,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    };
    await this.ormRepository.save(ormEntity);
  }

  async update(tier: MembershipTierEntity): Promise<void> {
    await this.ormRepository.save({
      id: tier.id,
      channelId: tier.channelId,
      name: tier.name,
      level: tier.level,
      priceCoin: tier.priceCoin,
      isAcceptingNew: tier.isAcceptingNew,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }

  async findById(id: string): Promise<MembershipTierEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) {
      return null;
    }
    return new MembershipTierEntity({
      id: ormEntity.id,
      channelId: ormEntity.channelId,
      name: ormEntity.name,
      level: ormEntity.level,
      priceCoin: ormEntity.priceCoin,
      isAcceptingNew: ormEntity.isAcceptingNew,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  async findByChannelId(channelId: string): Promise<MembershipTierEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { channelId },
      order: { level: 'ASC' },
    });

    return ormEntities.map(
      (ormEntity) =>
        new MembershipTierEntity({
          id: ormEntity.id,
          channelId: ormEntity.channelId,
          name: ormEntity.name,
          level: ormEntity.level,
          priceCoin: ormEntity.priceCoin,
          isAcceptingNew: ormEntity.isAcceptingNew,
          createdAt: ormEntity.createdAt,
          updatedAt: ormEntity.updatedAt,
        }),
    );
  }

  async findByChannelIdPaged(
    channelId: string,
    page: number,
    limit: number,
  ): Promise<{ items: MembershipTierEntity[]; total: number }> {
    const [ormEntities, total] = await this.ormRepository.findAndCount({
      where: { channelId },
      order: { level: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: ormEntities.map(
        (ormEntity) =>
          new MembershipTierEntity({
            id: ormEntity.id,
            channelId: ormEntity.channelId,
            name: ormEntity.name,
            level: ormEntity.level,
            priceCoin: ormEntity.priceCoin,
            isAcceptingNew: ormEntity.isAcceptingNew,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
          }),
      ),
      total,
    };
  }
}
