import { Repository } from 'typeorm';
import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { MembershipTierOrmEntity } from './membership-tier.orm-entity';
export declare class MembershipTierRepositoryImpl implements IMembershipTierRepository {
    private readonly ormRepository;
    constructor(ormRepository: Repository<MembershipTierOrmEntity>);
    create(tier: MembershipTierEntity): Promise<void>;
    update(tier: MembershipTierEntity): Promise<void>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<MembershipTierEntity | null>;
    findByChannelId(channelId: string): Promise<MembershipTierEntity[]>;
}
