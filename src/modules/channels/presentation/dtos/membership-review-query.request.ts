import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { MembershipReviewStatus } from '../../domain/entities/channel.entity';

export class MembershipReviewQueryRequestDto {
  @IsIn([
    MembershipReviewStatus.PENDING,
    MembershipReviewStatus.APPROVED,
    MembershipReviewStatus.REJECTED,
  ])
  @IsOptional()
  status?: MembershipReviewStatus;

  @Transform(({ value }) => normalizePage(value))
  @IsOptional()
  page?: number;

  @Transform(({ value }) => normalizeLimit(value))
  @IsOptional()
  limit?: number;
}

function normalizePage(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(parsed, 1);
}

function normalizeLimit(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.min(Math.max(parsed, 1), 50);
}
