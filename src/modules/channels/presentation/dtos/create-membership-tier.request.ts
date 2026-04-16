import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsIn,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMembershipTierRequestDto {
  @IsInt()
  @IsIn([1, 2, 3])
  level!: 1 | 2 | 3;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsInt()
  @Min(0)
  priceCoin!: number;
}
