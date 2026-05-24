import type { MembershipReviewStatus } from '../../domain/entities/channel.entity';

export interface ListMembershipReviewsQuery {
  adminId: string;
  role: string | undefined;
  status: MembershipReviewStatus;
  page: number;
  limit: number;
}
