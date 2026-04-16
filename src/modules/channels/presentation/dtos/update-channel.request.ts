import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateChannelRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;
}
