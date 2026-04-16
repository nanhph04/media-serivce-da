import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChannelRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  bio!: string;
}
