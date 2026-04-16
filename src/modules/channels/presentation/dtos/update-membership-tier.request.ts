import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMembershipTierRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  priceCoin?: number;

  @IsBoolean()
  @IsOptional()
  isAcceptingNew?: boolean;
}
