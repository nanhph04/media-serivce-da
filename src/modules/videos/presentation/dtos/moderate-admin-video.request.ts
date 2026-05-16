import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ModerateAdminVideoRequestDto {
  @IsIn(['approve', 'reject'])
  @IsNotEmpty()
  action!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  reason?: string;
}
